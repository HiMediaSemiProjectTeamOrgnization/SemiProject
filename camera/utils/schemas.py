from enum import Enum
from pydantic import BaseModel
from datetime import datetime

class SeatEventType(str, Enum) :
    CHECK_IN = "CHECK_IN"
    CHECK_OUt = "CHECK_OUt"

class SeatEvent(BaseModel) :
    seat_id : int
    event_type : SeatEventType
    detected_at : datetime
    usage_id : int | None = None
    camera_id : str | None = None
    items : list | None = None
