import { FaArrowLeft, FaClock } from "react-icons/fa";

function KioskHeader({ showBack = false, onBack }) {
    const currentTime = new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });

    return (
        <header>
            <div>
                {showBack && (
                    <button onClick={onBack}>
                        <FaArrowLeft />
                    </button>
                )}
            </div>

            <div>
                <h1>HIGH STUDY CAFE</h1>
                <span>Premium Lounge</span>
            </div>

            <div>
                <FaClock />
                <span>{currentTime}</span>
            </div>
        </header>
    );
}

export default KioskHeader;
