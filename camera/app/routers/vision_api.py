from fastapi import APIRouter
from fastapi import Body, HTTPException
from fastapi.requests import Request
from fastapi.responses import JSONResponse
import base64

router=APIRouter(prefix="/camera", tags=["감지 상태 업데이트"])

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
    
    seat_manager = request.app.state.seat_manager
    camera_manager = request.app.state.camera_manager

    camera_id = camera_manager.seat_to_camera_map.get(seat_id)

    if camera_id is None :
        return JSONResponse(status_code=400, content={
        "status" : False,
        "message" : f'not seat {seat_id} to camera'
    })
    
    seat_manager.handle_web_checkout(seat_id, usage_id)

    return JSONResponse(status_code=200, content={
        "status" : True,
        "message" : f'seat {seat_id} tracking stop'
    })    

@router.get("/status")
def camera_status(request : Request) :
    camera_manager = request.app.state.camera_manager

    return camera_manager.get_status()

@router.get("/seat_states")
def seat_states(request : Request) :
    seat_manager = request.app.state.seat_manager

    return seat_manager.get_seat_states()

@router.post("/camera_events")
def handle_camera_event(event : dict) :
    img_url = None
    img_base64 = event["image_base64"]
    file_path = f'./seat.jpg' 
    if event["event_type"] == "LOST_ITEM" and img_base64 :
        try :
            img_btyes = base64.b64decode(img_base64)
            with open(file_path, "wb") as f :
                f.write(img_btyes)
        except Exception as e :
            return
        
    return file_path