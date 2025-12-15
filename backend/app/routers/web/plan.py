import json
import os
from datetime import datetime, date
from typing import List

from fastapi import Depends, APIRouter
from sqlalchemy.orm import Session
from sqlalchemy import select

# LangChain
from langchain_openai import ChatOpenAI
from langchain.prompts import ChatPromptTemplate
from langchain.output_parsers import JsonOutputParser
from langchain_core.messages import HumanMessage, AIMessage

# SBERT & Vector
from sentence_transformers import SentenceTransformer
from dotenv import load_dotenv

# DB & Models
from models import AIChatLog, ScheduleEvent
from schemas import AiResponse, EventResponse
from ai_models.sbert import get_embedding_model
from database import get_db

router = APIRouter(prefix="/api/web/plan", tags=["plan"])

load_dotenv()
baseurl = os.getenv("OPENAI_API_BASE_URL")
apikey = os.getenv("OPENAI_API_KEY")

# ------------------------------------------------------------------
# [Helper] 코사인 유사도 검색 함수
# ------------------------------------------------------------------
def search_similar_events(db: Session, member_id: int, query_vector: list, limit: int = 5):
    """
    SBERT 벡터를 이용해 제목/내용이 유사한 일정을 찾습니다.
    """
    # pgvector의 cosine_distance 연산자 (<=>) 사용
    # 제목(title) 또는 설명(description)과 유사한 것 검색
    # 여기서는 편의상 Title 위주로 검색한다고 가정
    stmt = select(ScheduleEvent).filter(
        ScheduleEvent.member_id == member_id
    ).order_by(
        ScheduleEvent.title_embedding.cosine_distance(query_vector)
    ).limit(limit)

    results = db.execute(stmt).scalars().all()

    # 검색 결과를 AI가 읽기 좋은 문자열로 변환
    context_str = ""
    for idx, ev in enumerate(results):
        context_str += f"[{idx+1}] 날짜: {ev.schedule_date}, 제목: {ev.title}, 내용: {ev.description}\n"

    return context_str if context_str else "검색된 관련 일정이 없습니다."

# ------------------------------------------------------------------
# [Main API] 채팅 프로세싱
# ------------------------------------------------------------------
@router.post("/chat", response_model=AiResponse)
async def process_chat_request(
        member_id: int,
        user_input: str,
        db: Session = Depends(get_db),
        model: SentenceTransformer = Depends(get_embedding_model)
) -> AiResponse:

    # 1. LLM 초기화
    llm = ChatOpenAI(
        api_key=apikey,
        model="gpt-4o",
        base_url=baseurl,
        temperature=0
    )
    today_str = date.today().strftime("%Y-%m-%d")

    # ------------------------------------------------------------------
    # [Step 1] 의도 파악 (Router)
    # "검색이 필요한가?"를 먼저 판단합니다.
    # ------------------------------------------------------------------
    router_system = f"""
    당신은 스터디 플래너의 두뇌입니다. 오늘 날짜: {today_str}
    사용자의 입력을 보고 **다음 단계**를 결정하세요.

    [판단 기준]
    1. 'search': 사용자가 과거 일정에 대해 묻거나, 날짜를 명시하지 않고 "아까 그거 수정해줘", "수학 일정 지워줘" 처럼 모호하게 말할 때.
    2. 'direct': 날짜와 할 일이 명확한 '생성' 요청이거나, 단순한 인사말일 때.

    [응답 포맷 (JSON)]
    {{
        "decision": "search" | "direct",
        "search_query": "검색할 키워드 (decision이 search일 때 필수)"
    }}
    """

    router_chain = ChatPromptTemplate.from_messages([
        ("system", router_system),
        ("user", "{input}")
    ]) | llm | JsonOutputParser()

    try:
        # 1차 API 호출
        router_res = router_chain.invoke({"input": user_input})
        decision = router_res.get("decision", "direct")
        search_query = router_res.get("search_query", "")

        # ------------------------------------------------------------------
        # [Step 2] 필요 시 벡터 검색 (Body Action)
        # ------------------------------------------------------------------
        found_context = ""

        if decision == "search" and search_query:
            # SBERT 임베딩
            query_vec = model.encode(search_query).tolist()
            # DB 코사인 유사도 검색
            found_context = search_similar_events(db, member_id, query_vec)
            # (디버깅용 출력)
            print(f"🔍 검색 수행: '{search_query}' -> 결과:\n{found_context}")

        # ------------------------------------------------------------------
        # [Step 3] 최종 행동 결정 (Solver)
        # 검색 결과(Context)를 포함해서 최종 JSON을 만듭니다.
        # ------------------------------------------------------------------
        solver_system = f"""
        당신은 스터디 플래너 AI입니다. 오늘 날짜: {today_str}
        사용자 요청을 처리하여 JSON을 반환하세요.

        [참고 정보 (DB 검색 결과)]
        {found_context if found_context else "참고할 과거 데이터 없음 (새로 생성하거나 일반 대화하세요)"}

        [행동 분류]
        - 'create': 일정 생성 (9일 제한).
        - 'update': 일정 수정. **검색 결과**를 보고 사용자가 말한 '그거'가 무엇인지 추론해서 날짜와 제목을 확정하세요.
        - 'delete': 일정 삭제. **검색 결과**를 보고 삭제할 대상의 정확한 날짜를 target_date에 넣으세요.
        - 'chat': 일반 대화 또는 검색 결과에 대한 답변.

        [JSON 포맷]
        {{
            "type": "create" | "update" | "delete" | "chat",
            "message": "답변 메시지",
            "events": [ ... (create/update용) ... ],
            "target_date": "YYYY-MM-DD",
            "target_title": "제목 (update/delete 필터링용)"
        }}
        """

        solver_chain = ChatPromptTemplate.from_messages([
            ("system", solver_system),
            ("user", "{input}")
        ]) | llm | JsonOutputParser()

        # 2차 API 호출 (최종 결과 생성)
        ai_result = solver_chain.invoke({"input": user_input})

        # ... (이하 결과 파싱 및 DB 저장 로직은 기존과 동일) ...
        res_type = ai_result.get("type", "chat")
        ai_msg = ai_result.get("message", "")
        events_data = ai_result.get("events", [])
        target_date_str = ai_result.get("target_date")
        target_title = ai_result.get("target_title")

        # [DB 트랜잭션 시작]
        # 유저 로그 저장
        user_log = AIChatLog(member_id=member_id, role="user", message=user_input)
        db.add(user_log)
        db.flush()

        response_events = []

        # [CREATE]
        if res_type == "create":
            for ev in events_data:
                # 임베딩 생성 & 저장
                t_vec = model.encode(ev['title']).tolist()
                d_vec = model.encode(ev.get('description', '')).tolist() if ev.get('description') else None

                new_event = ScheduleEvent(
                    member_id=member_id,
                    ai_chat_log_id=user_log.ai_chat_logs_id,
                    title=ev['title'],
                    schedule_date=datetime.strptime(ev['date'], "%Y-%m-%d").date(),
                    start_time=datetime.strptime(ev['start'], "%H:%M").time(),
                    end_time=datetime.strptime(ev['end'], "%H:%M").time(),
                    description=ev.get('description', ''),
                    color=ev.get('color', 'blue'),
                    title_embedding=t_vec,
                    description_embedding=d_vec
                )
                db.add(new_event)
                db.flush()
                # 응답 추가
                response_events.append(EventResponse(
                    event_id=new_event.event_id,
                    title=new_event.title,
                    schedule_date=ev['date'],
                    start_time=ev['start'],
                    end_time=ev['end'],
                    color=new_event.color,
                    description=new_event.description
                ))

        # [UPDATE] - 검색 결과 덕분에 정확한 날짜/제목을 알 수 있음
        elif res_type == "update" and events_data:
            update_data = events_data[0]
            target_dt = datetime.strptime(update_data['date'], "%Y-%m-%d").date()

            # 검색 조건
            query = db.query(ScheduleEvent).filter(
                ScheduleEvent.member_id == member_id,
                ScheduleEvent.schedule_date == target_dt
            )
            # AI가 target_title을 줬으면 그걸로 찾고, 아니면 업데이트할 제목으로 찾음
            search_title = target_title if target_title else update_data['title']
            query = query.filter(ScheduleEvent.title.like(f"%{search_title}%"))

            target_event = query.first()

            if target_event:
                # 업데이트 및 임베딩 재계산
                target_event.title = update_data['title']
                target_event.start_time = datetime.strptime(update_data['start'], "%H:%M").time()
                target_event.end_time = datetime.strptime(update_data['end'], "%H:%M").time()
                target_event.description = update_data.get('description', '')
                target_event.color = update_data.get('color', 'blue')

                target_event.title_embedding = model.encode(update_data['title']).tolist()
                target_event.description_embedding = model.encode(update_data['description']).tolist() if update_data.get('description') else None

                response_events.append(EventResponse(
                    event_id=target_event.event_id,
                    title=target_event.title,
                    schedule_date=update_data['date'],
                    start_time=update_data['start'],
                    end_time=update_data['end'],
                    color=target_event.color,
                    description=target_event.description
                ))

        # [DELETE]
        elif res_type == "delete":
            if target_date_str:
                del_date = datetime.strptime(target_date_str, "%Y-%m-%d").date()
                query = db.query(ScheduleEvent).filter(
                    ScheduleEvent.member_id == member_id,
                    ScheduleEvent.schedule_date == del_date
                )
                if target_title:
                    query = query.filter(ScheduleEvent.title.like(f"%{target_title}%"))
                query.delete(synchronize_session=False)

        db.add(AIChatLog(member_id=member_id, role="ai", message=ai_msg))
        db.commit()

        return AiResponse(
            type=res_type,
            message=ai_msg,
            events=response_events
        )

    except Exception as e:
        db.rollback()
        print(f"Error: {e}")
        return AiResponse(
            type="chat",
            message="오류가 발생했습니다.",
            events=[]
        )