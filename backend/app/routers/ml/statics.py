from fastapi import APIRouter, HTTPException, Depends, Request
from sqlalchemy.orm import Session
from fastapi.responses import JSONResponse
from fastapi.params import Body
from sqlalchemy.sql import func
import random
from database import get_db
from models import Member, Product, Order, Seat, SeatUsage
from datetime import datetime
from collections import Counter, defaultdict

router = APIRouter(prefix="/statics", tags=["Statistics services"])

# seat type 문자열 함수
def classify_seat_type(seat) :
    if seat.near_window :
        return "창가"
    if seat.corner_seat :
        return "코너"
    if seat.aisle_seat :
        return "통로"
    if seat.isolated :
        return "독립석"
    if seat.near_beverage_table :
        return "음료대 근처"
    if seat.is_center :
        return "중앙"
    return "일반석"

# 리턴 서브 메시지 맵

 
"""좌석 통계 API"""
@router.get("/seats")
def seat_statistics(request : Request, member_id : int, 
                    db : Session = Depends(get_db)) :
    
    # return {'frequently_seat_use' : [
    #       {'seat_id' : 0,
    #       'seat_use_time' : 32.2,
    #       'seat_type' : '창가'},...],
    #        'seat_attr' : {'창가' : 0.28, '통로' : 0.29, ...},
    #        'message' ; '고립석의 비율이 ~~~'}
    
    # 회원번호 조회
    user = db.query(Member.member_id).filter(Member.member_id == member_id, Member.is_deleted_at == False).first()

    # 비회원 및 회원 ID가 1 이하/ db에 존재하지 않는 회원인 경우 에러
    if member_id <= 2 or not user:
        raise HTTPException(status_code=400, detail="유효하지 않은 회원 ID입니다")
    
    # 로그인한 회원 본인이 조회하는 지 확인 여부 (추후 추가)

    # 좌석 통계 데이터
    rows = (
        db.query(SeatUsage, Seat)
        .join(Seat, SeatUsage.seat_id == Seat.seat_id)
        .filter(SeatUsage.member_id == member_id,
                SeatUsage.check_out_time.isnot(None))
        .order_by(SeatUsage.check_in_time.desc())
        .limit(20)
        .all()
        )
    
    # 사용 이력 10회 미만이면 아무것도 반환하지 않음
    total_count = rows.__len__()

    if total_count <= 10 :
        return JSONResponse(
            status_code=200,
            content={
                'frequently_seat_use' : [],
                'seat_attr' : [],
                'message' : {
                    "analysis": "아직 사용량이 적어 좌석을 제시해드릴 수 없어요",
                    "coaching": '더 많은 사용을 통해 취향에 맞는 좌석을 추천해드릴께요'
                }})
    
    # 1) 자주 사용하는 좌석번호 통계
    # seat_id 별 사용 시간 집계
    seat_time_dict = defaultdict(float)
    for usage, seat in rows :
        duration = (usage.check_out_time - usage.check_in_time).total_seconds() / 60.0  # 분 단위
        seat_time_dict[seat.seat_id] += duration
    
    # 사용시간 기준 내림차순 정렬
    sorted_seat_time = sorted(seat_time_dict.items(), key=lambda x: x[1], reverse=True)
    
    # 상위 3개 좌석 정보 추출
    frequently_seat_use = []
    for seat_id, total_time in sorted_seat_time[:3] :
        seat = db.query(Seat).filter(Seat.seat_id == seat_id).first()
        frequently_seat_use.append({
            'seat_id' : seat_id,
            'seat_use_time' : round(total_time, 2),
            'seat_type' : classify_seat_type(seat)
        })            

    # 2) seat attr 비율 계산
    # 비교 여부를 확인하기 위해 최근 / 이전 나누기
    if 10 <= total_count < 20 :
        mid_index = 5
    else :
        mid_index = 10

    recent_rows = rows[:mid_index]
    past_rows = rows[mid_index:mid_index*2]

    # seat type 별 사용 횟수 집계
    recent_counter = Counter([classify_seat_type(seat) for _, seat in recent_rows])
    past_counter = Counter([classify_seat_type(seat) for _, seat in past_rows])

    # seat type 별 비율 계산
    recent_total = sum(recent_counter.values())
    past_total = sum(past_counter.values())

    recent_attr_ratio = {t : recent_counter.get(t, 0) / recent_total for t in recent_counter.keys()}
    past_attr_ratio = {t : past_counter.get(t, 0) / past_total for t in past_counter.keys()}

    # 나의 전체 좌석 속성 비율
    overall_counter = Counter([classify_seat_type(seat) for _, seat in rows])
    overall_total = sum(overall_counter.values())
    overall_attr_ratio = {t : overall_counter.get(t, 0) / overall_total for t in overall_counter.keys()}   
    seat_attr = [{'seat_type' : t, 'ratio' : round(ratio, 2)} for t, ratio in overall_attr_ratio.items()]  

    # 증가폭 작성
    trend = []
    for seat_type in set(list(recent_attr_ratio.keys()) + list(past_attr_ratio.keys())) :
        recent_ratio = recent_attr_ratio.get(seat_type, 0.0)
        past_ratio = past_attr_ratio.get(seat_type, 0.0)
        diff = recent_ratio - past_ratio
        trend.append((seat_type, diff))
    
    # 차이 기준 내림차순
    trend.sort(key=lambda x: x[1], reverse=True)
    top_type, diff = trend[0]
    
    SEAT_TYPE_MESSAGES = {
    "창가석": {
        "analysis": [
            "자연광이 들어오는 밝은 환경을 선호하는 경향이 있어요.",
            "시야가 트인 자리에서 공부할 때 집중 흐름이 더 좋아 보입니다.",
            "개방감이 있는 환경에서 편안함을 느끼는 타입이에요."
        ],
        "coaching": [
            "오늘도 창가에서 상쾌한 분위기로 집중을 시작해보세요.",
            "밝은 환경은 공부 리듬을 안정적으로 유지하는 데 도움이 돼요.",
            "자연광을 활용해 집중력을 자연스럽게 끌어올려보세요."
        ]
    },

    "코너석": {
        "analysis": [
            "방해받지 않는 조용한 공간을 선호하는 편이에요.",
            "주변 움직임이 적은 구석 자리에서 안정감을 느끼는 스타일입니다.",
            "몰입력을 높이기 위해 외부 자극을 최소화하는 패턴을 보이고 있어요."
        ],
        "coaching": [
            "오늘은 차분하게 몰입할 수 있는 코너석이 잘 맞을 것 같아요.",
            "조용한 위치는 집중 유지에 더욱 도움이 됩니다.",
            "코너 자리에서 안정적인 학습 흐름을 만들어보세요."
        ]
    },

    "고립석": {
        "analysis": [
            "외부 자극이 적은 독립적 공간을 선호하는 집중형 타입이에요.",
            "혼자만의 공간에서 학습 효율이 더 높아지는 경향이 있어요.",
            "최근 고립된 환경을 더 자주 선택하는 패턴이 나타나고 있어요."
        ],
        "coaching": [
            "깊은 집중이 필요하다면 고립된 자리에서 시작해보세요.",
            "오늘은 조용한 환경에서 몰입 세션을 만들어보는 것도 좋아요.",
            "방해 요소가 적은 공간에서 집중 퀄리티를 높여보세요."
        ]
    },

    "통로석": {
        "analysis": [
            "이동이 편한 자리를 선호하는 경향이 있어요.",
            "자리 이동을 자주 하거나 잠깐 리프레시가 필요한 패턴이 보여요.",
            "빠른 출입이 가능해 부담 없는 환경을 선호하는 스타일입니다."
        ],
        "coaching": [
            "짧은 휴식을 자주 취한다면 통로석이 잘 맞아요.",
            "오늘도 부담 없이 자리 이동을 할 수 있는 위치에서 시작해보세요.",
            "동선이 편한 자리를 활용해 공부 흐름을 자연스럽게 만들어보세요."
        ]
    },

    "중앙석": {
        "analysis": [
            "적당한 주변 활동이 있는 환경에서 안정감을 느끼는 편이에요.",
            "주변 분위기가 학습 리듬을 잡는 데 도움이 되는 타입입니다.",
            "너무 조용하지 않은 공간에서 집중이 더 잘 이루어질 수 있어요."
        ],
        "coaching": [
            "오늘은 적당한 활기가 있는 자리에서 공부를 시작해보는 건 어떨까요?",
            "중앙의 안정적인 분위기를 활용해 자연스러운 몰입을 만들어보세요.",
            "적당한 주변 소음이 집중 리듬 유지에 도움이 될 수 있어요."
        ]
    },

    "음료바근처": {
        "analysis": [
            "물이나 음료를 자주 이용하는 편으로 보여요.",
            "짧은 리프레시를 자주 하는 학습 패턴이 있습니다.",
            "편의 접근성이 좋은 자리를 선호하는 경향이 있어요."
        ],
        "coaching": [
            "오늘도 부담 없이 리프레시할 수 있는 자리에서 공부를 시작해보세요.",
            "간단히 물을 마시거나 휴식을 취하며 리듬을 잘 유지해보세요.",
            "편의 시설이 가까우면 공부 흐름이 더 안정적으로 유지돼요."
        ]
    },

    "일반석": {
        "analysis": [
            "특정 환경에 크게 구애받지 않는 유연한 학습 스타일이에요.",
            "여러 좌석을 균형 있게 사용하는 패턴을 보이고 있어요.",
            "환경보다는 현재 학습 목표 자체에 더 집중하는 타입입니다."
        ],
        "coaching": [
            "오늘은 원하는 자리에서 편하게 시작해보세요.",
            "유연한 패턴은 다양한 환경에서도 집중력을 유지하는 데 큰 장점이에요.",
            "그날의 컨디션에 맞는 자리를 자유롭게 선택해보세요."
        ]
    }}

    # message 설정
    messages = {
        "analysis": random.choice(SEAT_TYPE_MESSAGES[top_type]["analysis"]),
        "coaching": random.choice(SEAT_TYPE_MESSAGES[top_type]["coaching"])
    }

    

    return JSONResponse(status=200, content={
                'frequently_seat_use' : frequently_seat_use,
                'seat_attr' : recent_attr_ratio,
                'message' : messages})
    


    


