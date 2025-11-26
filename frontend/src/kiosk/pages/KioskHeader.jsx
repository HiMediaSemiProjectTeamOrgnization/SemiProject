import { FaArrowLeft } from "react-icons/fa";

function KioskHeader({ showBack = false, onBack }) {
    return (
        <div style={{display: "flex"}}>
            {/* 왼쪽 뒤로가기 */}
            <div style={{ width: "50px" }}>
                {showBack && (
                    <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "20px" }}>
                        <FaArrowLeft />
                    </button>
                )}
            </div>

            {/* 중앙 이름 */}
            <div>
                하이 스터디카페
            </div>

            {/* 오른쪽 회원 이름 */}
            <div>
                <span>나중에 회원 로그인 하면 이름 뜰거임</span>
            </div>
        </div>
    );
}

export default KioskHeader;
