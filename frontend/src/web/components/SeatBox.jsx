import { FaChair, FaClock, FaLock, FaUser } from "react-icons/fa";

function SeatBox({
    seat,
    onClick,
    tabType = "daily",
    isSelected = false,
    disableHover = false,
    hideSelectText = false,
    disableSelection = false
}) {

    function formatTime(minutes) {
        if (minutes === undefined || minutes === null) return "-";
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        if (h > 0) return `${h}시간 ${m}분`;
        return `${m}분`;
    }

    // 기간제: violet (고정석), 시간제: emerald (자유석)
    const colorTheme = tabType === "period" ? "violet" : "emerald";

    /** -----------------------------
     * 사용 가능 좌석 스타일
     * -----------------------------*/
    const availableSeatClass = `
        // --- Light Mode ---
        bg-white 
        border border-slate-300
        text-gray-800
        ${!disableHover ? `
            hover:bg-gray-50 
            hover:border-slate-400 
            hover:shadow-lg 
            hover:-translate-y-0.5
        ` : ""}
        
        // --- Dark Mode ---
        dark:bg-slate-800/70 
        dark:border-slate-700
        dark:text-slate-200
        ${!disableHover ? `
            dark:hover:bg-slate-700/50 
            dark:hover:border-${colorTheme}-400 
            dark:hover:text-${colorTheme}-300 
            dark:hover:shadow-lg 
            dark:hover:-translate-y-0.5
        ` : ""}
    `;

    /** -----------------------------
     * 사용 중 좌석 스타일
     * -----------------------------*/
    const busySeatClass = `
        // --- Light Mode ---
        bg-slate-100 
        border border-slate-300 
        text-slate-500 
        shadow-inner

        // --- Dark Mode ---
        dark:bg-slate-800 
        dark:border-slate-700 
        dark:text-slate-500 
        cursor-not-allowed 
        dark:shadow-inner
    `;

    /** -----------------------------
     * 시트 컨텐츠 결정
     * -----------------------------*/
    let content = null;
    let cardStyle = seat.is_status ? availableSeatClass : busySeatClass;

    if (seat.is_status) {
        // 사용 가능 좌석 컨텐츠
        content = (
            <>
                {/* 텍스트 색상을 동적으로 처리 */}
                <FaChair className={`text-2xl mb-1 opacity-80 text-${colorTheme}-500 dark:text-slate-200`} />
                <span className="text-lg font-bold">{seat.seat_id}</span>
                {!hideSelectText && (
                    <span className="text-[10px] opacity-60">
                        선택 가능
                    </span>
                )}
            </>
        );
    } else {
        // 사용 중 좌석 컨텐츠
        content = (
            <>
                {/* 상단 좌석 ID 및 잠금 아이콘 */}
                <div className="flex justify-between w-full px-3 absolute top-2">
                    <span className="text-xs font-bold opacity-70">
                        {seat.seat_id}
                    </span>
                    <FaLock className="text-[10px] opacity-50" />
                </div>

                {/* 사용자 정보 및 잔여 시간 */}
                <div className="flex flex-col items-center justify-center w-full mt-1 gap-1">
                    <div className="flex items-center gap-1 opacity-90">
                        <FaUser className="text-[10px]" />
                        <span className="text-sm font-bold truncate max-w-[4rem]">
                            {seat.user_name || "사용자"}
                        </span>
                    </div>

                    {/* 잔여 시간 박스 */}
                    <div className="
                        px-2 py-0.5 rounded text-[10px] font-mono flex items-center gap-1 
                        bg-slate-300/50 dark:bg-slate-800/90 
                        border border-slate-400/50 dark:border-slate-600/50
                        text-slate-600 dark:text-slate-400
                    ">
                        <FaClock className="text-[9px]" />
                        <span>{formatTime(seat.remaining_time)}</span>
                    </div>
                </div>
            </>
        );
    }

    return (
        <div
            className="relative rounded-xl transition-all duration-300 aspect-square"
            onClick={() => onClick?.(seat)}
        >
            {/* 선택 오버레이 (좌석 선택 시 전체를 덮는 푸른색 오버레이) */}
            {!disableSelection && (
                <div
                    className={`
                        absolute inset-0 rounded-xl pointer-events-none transition-opacity
                        // Dark/Light Mode 모두에서 사용
                        bg-blue-600/10 dark:bg-blue-800/20 
                        ${isSelected ? "opacity-100" : "opacity-0"}
                    `}
                ></div>
            )}

            {/* 메인 카드 */}
            <div
                className={`
                    relative rounded-xl h-full w-full p-2 flex flex-col items-center justify-center 
                    transition-all duration-300
                    ${
                        isSelected && !disableSelection
                            ? `
                                // 선택된 상태는 Dark/Light 모드에서 파란색 계열로 강조
                                bg-gradient-to-br from-blue-500/80 to-blue-700/80 
                                border-2 border-blue-500 
                                text-white 
                                shadow-xl shadow-blue-500/40 
                                dark:shadow-blue-800/40
                            `
                            : cardStyle
                    }
                `}
            >
                {content}

                {/* 선택됨 표시 뱃지 */}
                {!disableSelection && isSelected && (
                    <span className="absolute bottom-2 text-[10px] font-bold text-white bg-blue-600/70 px-2 py-0.5 rounded-full">
                        선택됨
                    </span>
                )}
            </div>
        </div>
    );
}

export default SeatBox;