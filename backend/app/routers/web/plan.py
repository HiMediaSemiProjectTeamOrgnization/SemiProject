import os
import requests
from zoneinfo import ZoneInfo
from datetime import datetime, time
from typing import List, Optional
from fastapi import Depends, APIRouter, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import select, func
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.output_parsers import JsonOutputParser
from langchain_core.messages import HumanMessage, AIMessage
from sentence_transformers import SentenceTransformer
from dotenv import load_dotenv
from models import AIChatLog, ScheduleEvent, SeatUsage
from schemas import AiResponse, EventResponse, ChatRequest, ManualEventRequest
from ai_models.sbert import get_embedding_model
from database import get_db
from utils.auth_utils import get_cookies_info

router = APIRouter(prefix="/api/web/plan", tags=["plan"])

load_dotenv()
baseurl = os.getenv("OPENAI_API_BASE_URL")
apikey = os.getenv("OPENAI_API_KEY")
KST = ZoneInfo("Asia/Seoul")

# ------------------------------------------------------------------
# [Helper] 24:00 처리 및 시간 변환기 (핵심 수정 사항)
# ------------------------------------------------------------------
def safe_parse_time(time_str: str) -> Optional[time]:
    """
    AI나 프론트에서 '24:00'이 넘어오면 Python time 객체 최대값인 '23:59:59'로 변환
    """
    if not time_str:
        return None
    if time_str == "24:00":
        return time(23, 59, 59)
    try:
        # HH:MM 또는 HH:MM:SS 처리
        if len(time_str.split(":")) == 2:
            return datetime.strptime(time_str, "%H:%M").time()
        else:
            return datetime.strptime(time_str, "%H:%M:%S").time()
    except ValueError:
        return time(0, 0) # 파싱 실패 시 기본값 00:00

# ------------------------------------------------------------------
# 토큰 교환 함수
# ------------------------------------------------------------------
def get_copilot_token(github_token: str):
    url = "https://api.github.com/copilot_internal/v2/token"
    headers = {
        "Authorization": f"token {github_token}",
        "Editor-Version": "vscode/1.85.0",
        "Editor-Plugin-Version": "copilot/1.143.0",
        "User-Agent": "GitHubCopilot/1.143.0"
    }
    response = requests.get(url, headers=headers)
    if response.status_code == 200:
        data = response.json()
        return data.get("token")
    else:
        raise Exception(f"토큰 발급 실패: {response.status_code} {response.text}")

# ------------------------------------------------------------------
# [Helper] Context Injection
# ------------------------------------------------------------------
def get_recent_chat_history(db: Session, member_id: int, limit: int = 10):
    logs = db.query(AIChatLog).filter(AIChatLog.member_id == member_id) \
        .order_by(AIChatLog.created_at.desc()).limit(limit).all()
    logs.reverse()

    messages = []
    for log in logs:
        if log.role == 'user':
            messages.append(HumanMessage(content=log.message))
        else:
            messages.append(AIMessage(content=log.message))
    return messages

# ------------------------------------------------------------------
# [Helper] 벡터 검색
# ------------------------------------------------------------------
def search_similar_events(db: Session, member_id: int, query_vector: list, limit: int = 5):
    title_dist = ScheduleEvent.title_embedding.cosine_distance(query_vector)
    desc_dist = func.coalesce(
        ScheduleEvent.description_embedding.cosine_distance(query_vector),
        2.0
    )
    min_dist = func.least(title_dist, desc_dist)

    stmt = select(ScheduleEvent).filter(
        ScheduleEvent.member_id == member_id
    ).order_by(
        min_dist.asc()
    ).limit(limit)

    results = db.execute(stmt).scalars().all()

    context_str = ""
    for idx, ev in enumerate(results):
        start_str = ev.start_time.strftime("%H:%M")
        end_str = ev.end_time.strftime("%H:%M")
        context_str += (
            f"ID:{idx+1} | Date:{ev.schedule_date} | Time:{start_str}~{end_str} | Title:{ev.title} | Desc:{ev.description or 'None'}\n"
        )

    return context_str if context_str else "검색된 관련 일정이 없습니다."

# ------------------------------------------------------------------
# [Main API] 채팅 프로세싱
# ------------------------------------------------------------------
@router.post("/chat", response_model=AiResponse)
async def process_chat_request(
    req: ChatRequest,
    db: Session = Depends(get_db),
    model: SentenceTransformer = Depends(get_embedding_model)
) -> AiResponse:

    try:
        real_access_token = get_copilot_token(apikey)
    except Exception as e:
        print(f"Token Error: {e}")
        return AiResponse(type="chat", message="GitHub 토큰 발급에 실패했습니다.", events=[])

    member_id = req.member_id
    user_input = req.user_input

    llm = ChatOpenAI(
        api_key=real_access_token,
        model="gpt-4.1", # 모델명 확인 필요
        base_url=baseurl,
        temperature=0,
        default_headers={
            "Authorization": f"Bearer {real_access_token}",
            "Editor-Version": "vscode/1.85.0",
            "Editor-Plugin-Version": "copilot/1.143.0",
            "User-Agent": "GitHubCopilot/1.143.0"
        }
    )

    # [수정] AI에게 날짜와 시간을 모두 알려주기 위해 포맷 변경
    now_dt = datetime.now(KST)
    today_str = now_dt.strftime("%Y-%m-%d")        # 날짜
    current_time_str = now_dt.strftime("%H:%M")    # 시간

    # ------------------------------------------------------------------
    # [Step 1] Router
    # ------------------------------------------------------------------
    # 프롬프트 유지를 원하셔서 {today}에 시간 정보를 병기하거나, 별도 변수로 주입합니다.
    # 여기서는 프롬프트 텍스트를 최소한으로 건드려 {current_time}을 추가합니다.
    router_system = """
    당신은 스터디 플래너의 분류기입니다. 
    오늘 날짜: {today}
    현재 시각: {current_time}

    사용자의 입력과 이전 대화 맥락을 보고 '검색(search)'이 필요한지 판단하세요.

    [판단 기준]
    1. 'search': 과거 일정 조회, 수정/삭제 대상이 모호할 때, 내용 기반 검색
    2. 'direct': 명확한 생성/수정/삭제 요청, 인사

    [JSON 포맷]
    {{
        "decision": "search" | "direct",
        "search_query": "검색할 키워드"
    }}
    """
    router_prompt = ChatPromptTemplate.from_messages([
        ("system", router_system),
        MessagesPlaceholder(variable_name="chat_history"),
        ("user", "{input}")
    ])
    router_chain = router_prompt | llm | JsonOutputParser()

    try:
        history_messages = get_recent_chat_history(db, member_id)
        router_res = router_chain.invoke({
            "today": today_str,
            "current_time": current_time_str,
            "chat_history": history_messages,
            "input": user_input
        })
        decision = router_res.get("decision", "direct")
        search_query = router_res.get("search_query", "")

        # ------------------------------------------------------------------
        # [Step 2] Vector Search
        # ------------------------------------------------------------------
        found_context = ""
        if decision == "search" and search_query:
            query_vec = model.encode(search_query).tolist()
            found_context = search_similar_events(db, member_id, query_vec)

        # ------------------------------------------------------------------
        # [Step 3] Solver
        # ------------------------------------------------------------------
        solver_system = """
        당신은 친절하고 똑똑한 스터디 플래너 AI입니다. 
        오늘 날짜: {today}
        현재 시각: {current_time}

        사용자의 질문에 대해 JSON 포맷으로 답변해야 합니다.

        [핵심 답변 원칙]
        1. <database_context>에 정보가 있다면 그것을 최우선으로 사용하여 답변하세요.
        2. <database_context>가 비어있더라도 무조건 "없다"고 답변하지 마세요. 
           - 만약 사용자가 **"이전 답변의 근거(어떻게 알았어?, 왜?, 진짜야?)"**를 묻는다면, **대화 기록(chat_history)**을 참고하여 답변하세요.
           - 예: "방금 DB에서 검색된 기록을 바탕으로 말씀드린 것입니다." 라고 설명.
        3. DB에는 24:00를 넣을 수 없습니다. '23:59' 또는 다음날 '00:00'로 바꾸세요.
        4. DB를 조작했으면 ~하겠습니다가 아닌 ~했습니다 라고 대답하세요 이래야 조작을 했단걸 명확히 사용자에게 알려줄 수 있어요.
        
        <database_context>
        {context}
        </database_context>
        
        [행동 분류 및 규칙]
        1. 사용자의 입력이 과거 기록에 대한 질문이면, 위 <past_records>를 참고하여 대답하세요.
        2. 사용자의 입력이 새로운 일정 생성/수정/삭제라면, 해당 명령만 수행하세요.
        3. 과거 기록에 있는 내용이 사용자의 현재 요청과 무관하다면 무시하세요.
        - 'create': 일정 생성. (events 배열에 여러 개 담기)
        - 'update': 일정 수정. (한 번에 하나만 수정 권장)
        - 'delete': 일정 삭제. (events 배열에 삭제할 대상들을 담기)
        - 'chat': 일반 대화.

        [삭제(delete) 규칙]
        - 단일건 뿐만 아니라 여러개 삭제 가능함
        - "14일, 15일 다 지워줘" -> events에 2개의 객체를 담을 것.
        - 특정 제목만 지우라면 title을 명시, 날짜 전체 삭제면 title은 null.
        
        [제약 사항]
        - 10일 이상 요청 시 9일까지만 생성하고 메시지로 안내.
        - 수정/삭제 시 검색 결과에 있는 날짜와 제목을 정확히 사용.
        - 신규 생성(create) 시에만 색깔을 파란색, 초록색, 노란색, 빨간색 중에서 랜덤으로 선택하세요.
        - 만약 사용자가 한꺼번에 일정을 수정하라 하려하면 일정 수정은 한번에 하나씩만 된다는식으로 알려줘야함

        [매우 중요한 규칙]
        1. **수정(update) 시**: 사용자가 변경을 요청한 부분(예: 제목)만 바꾸고, **나머지(날짜, 시작/종료 시간, 설명, 색상 등)는 <database_context>의 값을 그대로 events 배열에 넣으세요.**
        2. 사용자가 시간을 말하지 않았다면 절대로 임의로 시간을 바꾸지 마세요. context의 시간 그대로 유지하세요.
        3. 만약 context에 정보가 없어서 알 수 없다면 해당 필드는 json에서 null로 보내세요.
        4. 사용자가 모호하게 가령 수학 일정 지워줘라하면 수학 일정 다 지우는게 아니라 어떤 수학 일정을 지울지 물어보면서 수학 일정 리스트를 보여주세요.

        [JSON 포맷]
        {{
            "type": "create" | "update" | "delete" | "chat",
            "message": "사용자에게 할 말",
            "events": [
                {{
                    "title": "제목",
                    "date": "YYYY-MM-DD (모르면 null)",
                    "start": "HH:MM (모르면 null)",
                    "end": "HH:MM (모르면 null)",
                    "color": "blue" | "green" | "yellow" | "red",
                    "description": "내용"
                }}
            ],
            "target_date": "YYYY-MM-DD (수정 대상 원본 날짜, 모르면 null)",
            "target_title": "수정 대상 원본 제목 (없으면 null)"
        }}
        """

        solver_chain = ChatPromptTemplate.from_messages([
            ("system", solver_system),
            MessagesPlaceholder(variable_name="chat_history"),
            ("user", "{input}")
        ]) | llm | JsonOutputParser()

        ai_result = solver_chain.invoke({
            "today": today_str,
            "current_time": current_time_str,
            "context": found_context if found_context else "관련된 과거 데이터 없음.",
            "chat_history": history_messages,
            "input": user_input
        })

        res_type = ai_result.get("type", "chat")
        ai_msg = ai_result.get("message", "")
        events_data = ai_result.get("events", [])
        target_date_str = ai_result.get("target_date")
        target_title = ai_result.get("target_title")

        # ------------------------------------------------------------------
        # [Step 4] DB 트랜잭션
        # ------------------------------------------------------------------
        user_log = AIChatLog(member_id=member_id, role="user", message=user_input)
        db.add(user_log)
        db.flush()

        response_events = []

        if res_type == "create":
            next_default_hour = 9

            for ev in events_data:
                try:
                    s_date = datetime.strptime(ev['date'], "%Y-%m-%d").date()

                    temp_start = safe_parse_time(ev.get('start'))
                    temp_end = safe_parse_time(ev.get('end'))

                    # 시작 시간이 없으면, 자동 증가 변수(next_default_hour) 사용
                    if temp_start is None:
                        # 23시 넘어가면 09시로 초기화 하거나 23시로 고정
                        if next_default_hour >= 24:
                            next_default_hour = 9

                        s_start = time(next_default_hour, 0)

                        # 다음 루프때는 1시간 뒤로 잡히도록 증가
                        next_default_hour += 1
                    else:
                        s_start = temp_start
                        # 만약 사용자가 시간을 명시했다면, 다음 기본 시간은 그 이후로 설정
                        next_default_hour = s_start.hour + 1

                    # 종료 시간 설정 (시작 시간 + 1시간)
                    if temp_end is None:
                        end_h = s_start.hour + 1
                        if end_h >= 24:
                            s_end = time(23, 59)
                        else:
                            s_end = time(end_h, s_start.minute)
                    else:
                        s_end = temp_end

                except (ValueError, TypeError) as e:
                    # 필수 값이 없으면 스킵
                    print(f"Date/Time Parse Error: {e}")
                    continue

                t_vec = model.encode(ev['title']).tolist()
                d_vec = model.encode(ev['description']).tolist() if ev.get('description') else None

                new_event = ScheduleEvent(
                    member_id=member_id,
                    ai_chat_log_id=user_log.ai_chat_logs_id,
                    title=ev['title'],
                    schedule_date=s_date,
                    start_time=s_start,
                    end_time=s_end,
                    description=ev.get('description', ''),
                    color=ev.get('color', 'blue'),
                    title_embedding=t_vec,
                    description_embedding=d_vec
                )
                db.add(new_event)
                db.flush()
                response_events.append(EventResponse(
                    event_id=new_event.event_id,
                    title=new_event.title,
                    schedule_date=ev['date'],
                    start_time=s_start.strftime("%H:%M") if s_start else "",
                    end_time=s_end.strftime("%H:%M") if s_end else "",
                    color=new_event.color,
                    description=new_event.description
                ))

        elif res_type == "update" and events_data:
            update_data = events_data[0]

            query = db.query(ScheduleEvent).filter(ScheduleEvent.member_id == member_id)

            if target_date_str:
                target_dt = datetime.strptime(target_date_str, "%Y-%m-%d").date()
                query = query.filter(ScheduleEvent.schedule_date == target_dt)

            search_title = target_title if target_title else update_data.get('title')
            if search_title:
                query = query.filter(ScheduleEvent.title.like(f"%{search_title}%"))

            target_event = query.order_by(ScheduleEvent.schedule_date.desc(), ScheduleEvent.start_time.asc()).first()

            if target_event:
                if update_data.get('title'):
                    target_event.title = update_data['title']
                    target_event.title_embedding = model.encode(update_data['title']).tolist()

                if update_data.get('date'):
                    target_event.schedule_date = datetime.strptime(update_data['date'], "%Y-%m-%d").date()

                if update_data.get('start'):
                    target_event.start_time = safe_parse_time(update_data['start'])

                if update_data.get('end'):
                    target_event.end_time = safe_parse_time(update_data['end'])

                if update_data.get('description') is not None:
                    target_event.description = update_data['description']
                    target_event.description_embedding = model.encode(update_data['description']).tolist() if update_data['description'] else None

                if update_data.get('color'):
                    target_event.color = update_data['color']

                response_events.append(EventResponse(
                    event_id=target_event.event_id,
                    title=target_event.title,
                    schedule_date=target_event.schedule_date.strftime("%Y-%m-%d"),
                    start_time=target_event.start_time.strftime("%H:%M"),
                    end_time=target_event.end_time.strftime("%H:%M"),
                    color=target_event.color,
                    description=target_event.description
                ))
            else:
                ai_msg = f"조건에 맞는 일정을 찾을 수 없습니다."

        elif res_type == "delete":
            targets = events_data if events_data else []
            if not targets and (target_date_str or target_title):
                targets.append({"date": target_date_str, "title": target_title})
            if not targets and not target_date_str and not target_title:
                targets = [{}]

            deleted_count = 0
            for ev in targets:
                query = db.query(ScheduleEvent).filter(ScheduleEvent.member_id == member_id)
                del_date_str = ev.get('date') or target_date_str
                del_title = ev.get('title') or target_title

                if del_date_str:
                    del_date = datetime.strptime(del_date_str, "%Y-%m-%d").date()
                    query = query.filter(ScheduleEvent.schedule_date == del_date)

                if del_title:
                    query = query.filter(ScheduleEvent.title.like(f"%{del_title}%"))

                result = query.delete(synchronize_session=False)
                deleted_count += result

            if deleted_count > 0:
                ai_msg = f"요청하신 대로 총 {deleted_count}개의 일정을 삭제했습니다."
            else:
                if not ai_msg:
                    ai_msg = "조건에 맞는 삭제할 일정을 찾지 못했습니다."

        db.add(AIChatLog(member_id=member_id, role="ai", message=ai_msg))
        db.commit()

        return AiResponse(
            type=res_type,
            message=ai_msg,
            events=response_events
        )

    except Exception as e:
        db.rollback()
        print(f"Error process_chat_request: {e}")
        return AiResponse(
            type="chat",
            message=f"오류가 발생했습니다: {str(e)}",
            events=[]
        )

# ------------------------------------------------------------------
# [API] 일반 일정 조회 (GET)
# ------------------------------------------------------------------
@router.get("/events", response_model=List[EventResponse])
def get_schedule_events(
    member_id: int,
    db: Session = Depends(get_db)
):
    events = db.query(ScheduleEvent).filter(ScheduleEvent.member_id == member_id) \
        .order_by(ScheduleEvent.schedule_date.asc(), ScheduleEvent.start_time.asc()).all()
    return [
        EventResponse(
            event_id=e.event_id,
            title=e.title,
            schedule_date=e.schedule_date.strftime("%Y-%m-%d"),
            start_time=e.start_time.strftime("%H:%M"),
            end_time=e.end_time.strftime("%H:%M"),
            color=e.color,
            description=e.description
        ) for e in events
    ]

# ------------------------------------------------------------------
# [API] 수동 조작용 (Manual) - Create, Update, Delete
# ------------------------------------------------------------------
@router.post("/manual/create", response_model=EventResponse)
def create_manual_event(
    req: ManualEventRequest,
    db: Session = Depends(get_db),
    model: SentenceTransformer = Depends(get_embedding_model)
):
    # 벡터 생성 (수동으로 추가해도 검색되어야 하므로 필수)
    t_vec = model.encode(req.title).tolist()
    d_vec = model.encode(req.description).tolist() if req.description else None

    # safe_parse_time 사용하여 24:00 처리
    new_event = ScheduleEvent(
        member_id=req.member_id,
        title=req.title,
        schedule_date=datetime.strptime(req.date, "%Y-%m-%d").date(),
        start_time=safe_parse_time(req.start),
        end_time=safe_parse_time(req.end),
        description=req.description,
        color=req.color,
        title_embedding=t_vec,
        description_embedding=d_vec
    )
    db.add(new_event)
    db.commit()
    db.refresh(new_event)

    return EventResponse(
        event_id=new_event.event_id,
        title=new_event.title,
        schedule_date=new_event.schedule_date.strftime("%Y-%m-%d"),
        start_time=new_event.start_time.strftime("%H:%M"),
        end_time=new_event.end_time.strftime("%H:%M"),
        color=new_event.color,
        description=new_event.description
    )

@router.put("/manual/update", response_model=EventResponse)
def update_manual_event(
    req: ManualEventRequest,
    db: Session = Depends(get_db),
    model: SentenceTransformer = Depends(get_embedding_model)
):
    event = db.query(ScheduleEvent).filter(ScheduleEvent.event_id == req.event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    event.title = req.title
    event.schedule_date = datetime.strptime(req.date, "%Y-%m-%d").date()
    # safe_parse_time 사용하여 24:00 처리
    event.start_time = safe_parse_time(req.start)
    event.end_time = safe_parse_time(req.end)
    event.description = req.description
    event.color = req.color

    # 임베딩 갱신
    event.title_embedding = model.encode(req.title).tolist()
    if req.description:
        event.description_embedding = model.encode(req.description).tolist()
    else:
        event.description_embedding = None

    db.commit()
    return EventResponse(
        event_id=event.event_id,
        title=event.title,
        schedule_date=event.schedule_date.strftime("%Y-%m-%d"),
        start_time=event.start_time.strftime("%H:%M"),
        end_time=event.end_time.strftime("%H:%M"),
        color=event.color,
        description=event.description
    )

@router.delete("/manual/delete/{event_id}")
def delete_manual_event(
    event_id: int,
    db: Session = Depends(get_db)
):
    db.query(ScheduleEvent).filter(ScheduleEvent.event_id == event_id).delete()
    db.commit()
    return {"status": "success"}

@router.get("/check-attended")
def check_attended(
    member: dict = Depends(get_cookies_info),
    db: Session = Depends(get_db)
):
    seat_usage = db.query(SeatUsage).filter(
        SeatUsage.member_id == member["member_id"],
        SeatUsage.is_attended == True
    ).all()
    if not seat_usage:
        raise HTTPException(status_code=404, detail="seat usages not exists")

    return [seat.check_out_time.strftime("%Y-%m-%d") for seat in seat_usage]