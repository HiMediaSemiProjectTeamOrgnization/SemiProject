import { useState, useEffect } from "react";
import { FaArrowLeft, FaClock } from "react-icons/fa";

function KioskHeader({ backButton=true }) {
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const formattedTime = currentTime.toLocaleTimeString('ko-KR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
    });
    return (
        <header>
            <div>
                {backButton && (
                    <button><FaArrowLeft /></button>
                )}
            </div>
            <div>
                <h1>HIGH STUDY CAFE</h1>
            </div>
            <div>
                <FaClock />
                <span>{formattedTime}</span>
            </div>
        </header>
    )
}

export default KioskHeader