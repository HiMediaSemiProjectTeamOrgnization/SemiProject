from fastapi import APIRouter
from fastapi import Body, HTTPException
from fastapi.requests import Request
from fastapi.responses import JSONResponse
from vision.schemas.schemas import SeatEvent
import base64

router=APIRouter(prefix="/camera", tags=["감지 상태 업데이트"])

WEB_SERVER_HOST = "http://localhost:8000"


@router.post("/checkin")
def check_in(request : Request,
             seat_id : int = Body(...),
             usage_id : int = Body(...)) :
    """ 웹으로 부터 입실 여부 수신 받는 api """
    seat_manager = request.app.state.seat_manager
    camera_manager = request.app.state.camera_manager
    # 카메라 찾기
    camera_id = camera_manager.seat_to_camera_map.get(seat_id)

    if camera_id is None :
        return JSONResponse(status_code=400, content={
        "status" : False,
        "message" : f'not seat {seat_id} to camera'
    })

    seat_manager.handle_web_checkin(seat_id, usage_id)

    return JSONResponse(status_code=200, content={
        "status" : True,
        "message" : f'seat {seat_id} tracking started'
    })

@router.post("/checkout")
def checkout(request : Request,
             seat_id : int = Body(...),
             usage_id : int = Body(...)) :
    """웹으로 부터 퇴실 여부 수신 받는 api"""
    seat_manager = request.app.state.seat_manager
    camera_manager = request.app.state.camera_manager

    camera_id = camera_manager.seat_to_camera_map.get(seat_id)

    if camera_id is None :
        return JSONResponse(status_code=400, content={
        "status" : False,
        "message" : f'not seat {seat_id} to camera'
    })
    
    # 결과 저장소 초기화
    with seat_manager.result_lock :
        seat_manager.lost_item_results[usage_id] = {
            "done" : False,
            "seat_id" : seat_id,
            "usage_id" : usage_id
        }
    
    # 유실물 감지 시작
    seat_manager.handle_web_checkout(seat_id, usage_id)

    return JSONResponse(status_code=202, content={
        "status" : True,
        "message" : f'seat {seat_id} lostitem tracking start',
        "job_id" : usage_id
    })    

@router.post("/event")
def checktime_event(request : Request,
                    payload : dict) :
   
    if payload["event_type"] == "CHECK_OUt" :
        r = request.post(f"{WEB_SERVER_HOST}/ai/checktime", json=payload, timeout=2)
        
        if r.status_code != 200 :
            raise HTTPException(status_code=500, detail="예기치 못한 오류 발생")
        
        return JSONResponse(200, content={"status" : True,
                                          "message" : "Success"})


@router.get("/lost-item/result/{job_id}")
def lost_item_result(request : Request, job_id : int) :
    """ usage_id 기준 유실물 조회 """
    seat_manager = request.app.state.seat_manager

    with seat_manager.result_lock :
        result = seat_manager.lost_item_results.get(job_id)

    if result is None :
        return JSONResponse(status_code=404, content={"message" : "usage_id not found"})
    
    return JSONResponse(status_code=200,
                        content={
                            "status" : True,
                            "result" : result
                        })

