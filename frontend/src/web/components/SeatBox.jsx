import { FaChair, FaLock, FaTools, FaUser } from "react-icons/fa";

function SeatBox({
    seat,
    onClick,
    tabType = "daily",
    isSelected = false,
    disableHover = false,
    disableSelection = false,
    simpleMode = false
}) {

    // 기간제: violet, 시간제: emerald
    const colorTheme = tabType === "period" ? "violet" : "emerald";

    /** -----------------------------
     * 상태 결정 로직
     * -----------------------------*/
    const isOccupied = seat.hasOwnProperty('is_occupied') ? seat.is_occupied : (!seat.is_status);
    const isAvailable = seat.is_status && !isOccupied;
    const isDisabled = !seat.is_status && !isOccupied;

    /** -----------------------------
     * 스타일 정의
     * -----------------------------*/
    const availableSeatClass = `
        bg-white dark:bg-slate-700
        border border-slate-300 dark:border-slate-600
        text-slate-700 dark:text-slate-300
        ${!disableHover ? `
            hover:bg-slate-50 dark:hover:bg-slate-600 
            hover:border-${colorTheme}-400 dark:hover:border-${colorTheme}-400 
            hover:text-${colorTheme}-600 dark:hover:text-${colorTheme}-300
            hover:shadow-md hover:-translate-y-0.5
        ` : ""}
    `;

    // 사용 중: 진한 배경색
    const busySeatClass = `
        bg-slate-600 dark:bg-slate-500
        border border-slate-500 dark:border-slate-400
        text-white
        shadow-inner
        opacity-100
    `;

    // 점검/불가
    const disabledSeatClass = `
        bg-slate-800 dark:bg-slate-900
        border border-slate-700 dark:border-slate-800
        text-slate-600 dark:text-slate-700
        cursor-not-allowed
    `;

    let cardStyle = isAvailable ? availableSeatClass : (isDisabled ? disabledSeatClass : busySeatClass);

    return (
        <div
            className="relative rounded-lg transition-all duration-300 aspect-square"
            onClick={() => onClick?.(seat)}
        >
            {/* 선택 오버레이 */}
            {!disableSelection && (
                <div className={`absolute inset-0 rounded-lg pointer-events-none transition-opacity bg-blue-500/30 ${isSelected ? "opacity-100" : "opacity-0"}`}></div>
            )}

            <div
                className={`
                    relative rounded-lg h-full w-full flex flex-col items-center justify-center overflow-hidden
                    transition-all duration-200
                    ${isSelected && !disableSelection ? 'bg-blue-600 border-blue-400 text-white shadow-lg scale-95' : cardStyle}
                `}
            >
                {/* [수정됨] Simple Mode에서도 상태별 UI 분기 */}
                {isDisabled ? (
                    // 점검중
                    <>
                        <span className="absolute top-1 left-1.5 text-[10px] font-bold opacity-50">{seat.seat_id}</span>
                        <FaTools className="text-lg opacity-40" />
                    </>
                ) : isOccupied ? (
                    // 사용중: 이름 표시
                    <>
                        {/* 좌석 번호: 좌측 상단 작게 */}
                        <span className="absolute top-1 left-1.5 text-[10px] font-bold opacity-60">
                            {seat.seat_id}
                        </span>
                        
                        {/* 유저 이름: 중앙 배치 (크기 확보) */}
                        <div className="flex flex-col items-center justify-center mt-2 w-full px-1">
                            <span className="text-[11px] font-bold truncate w-full text-center leading-tight">
                                {seat.user_name || "사용자"}
                            </span>
                             {/* 작은 아이콘 장식 (선택사항) */}
                             {/* <FaUser className="text-[8px] mt-0.5 opacity-50" /> */}
                        </div>
                    </>
                ) : (
                    // 사용가능: 의자 아이콘 + 큰 번호
                    <>
                        <span className="text-lg font-bold leading-none mb-0.5">{seat.seat_id}</span>
                        <FaChair className={`text-[12px] opacity-40 ${isAvailable ? `group-hover:text-${colorTheme}-500` : ''}`} />
                    </>
                )}
            </div>
        </div>
    );
}

export default SeatBox;