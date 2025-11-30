import { Link, Router } from "react-router-dom";
import SeatStatus from "../components/SeatStatus"

function WebIndex() {
    return (
        <div>
            <h1>좌석 현황</h1>
            <SeatStatus />
            {/* <Link to="/web/ticket" className="mt-6 px-4 py-2 bg-blue-500 text-white rounded" >이용권 목록</Link > */}
        </div>

    )
}

export default WebIndex;