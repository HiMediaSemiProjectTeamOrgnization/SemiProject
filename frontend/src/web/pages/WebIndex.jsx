import { Link, Router } from "react-router-dom";
import SeatStatus from "../components/SeatStatus"

function WebIndex() {
    return (
        <div>
            <h1>좌석 현황</h1>
            <SeatStatus />
        </div>

    )
}

export default WebIndex;