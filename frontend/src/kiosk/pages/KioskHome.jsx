import '../styles/Kiosk.css'
import { FaTicketAlt, FaDoorOpen, FaDoorClosed, FaChair } from "react-icons/fa";

function KioskHome() {
    return (
        <div className="kiosk-container">
            <h1 className="kiosk-title">하이 스터디카페</h1>
            <p className="kiosk-sub">원하시는 서비스를 선택해주세요</p>

            {/* 상단 버튼 그룹 */}
            <div className="top-button-group">
                <button className="kiosk-btn color-gradient-blue">
                    <FaTicketAlt className="btn-icon" />
                    이용권 구매
                </button>

                <button className="kiosk-btn color-gradient-green">
                    <FaDoorOpen className="btn-icon" />
                    입실하기
                </button>

                <button className="kiosk-btn color-gradient-red">
                    <FaDoorClosed className="btn-icon" />
                    퇴실하기
                </button>
            </div>

            {/* 좌석 현황 버튼 */}
            <button className="kiosk-btn seat-btn color-gradient-purple">
                <FaChair className="btn-icon" />
                좌석 현황 조회
            </button>
        </div>
    )
}

export default KioskHome;
