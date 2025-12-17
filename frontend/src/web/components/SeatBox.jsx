function SeatBox({
    seat,
    onClick,
    isSelected = false,
    disableSelection = false,
    isViewOnly = false,
    isCheckOutMode = false
}) {

    function formatTime(minutes) {
        if (minutes === undefined || minutes === null) return "-";
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        if (h > 0) return `${h}시간 ${m}분`;
        return `${m}분`;
    }

    const isAvailable = seat.is_status;
    const isFixed = seat.type === "기간제" || seat.type === "fix";

    let base = "w-full h-full rounded-md flex flex-col items-center justify-center transition-all duration-150";

    /* VIEW ONLY 모드 */
    if (isViewOnly) {
        base += isAvailable
            ? isFixed
                ? " bg-gradient-to-br from-[#c0b6ff] to-[#a89af3] border border-[#c0b6ff] text-white"
                : " bg-gradient-to-br from-[#a8c7ff] to-[#8bb3ff] border border-[#a8c7ff] text-[#1A2233]"
            : " bg-gradient-to-br from-[#383e55] to-[#2f3446] border border-[#383e55] text-white";

        return (
            <div className={base} onClick={() => onClick?.(seat)}>
                {isAvailable ? (
                    <span className="text-lg">{seat.seat_id}</span>
                ) : (
                    <div className="flex flex-col items-center text-center leading-tight">
                        <span className="text-xs text-slate-300 dark:text-white">
                            {seat.seat_id}
                        </span>

                        <span className="text-sm font-bold text-white mt-0.5">
                            사용중
                        </span>
                    </div>
                )}
            </div>
        );
    }

    /* CHECKOUT MODE */
    if (isCheckOutMode) {
        if (!isAvailable) {
            base += isSelected
                ? " bg-gradient-to-br from-[#FF5C7A] to-[#FF3F62] text-white ring-2 ring-rose-300 scale-95 shadow-lg"
                : " bg-[#B94163]/40 text-white border border-[#B94163] cursor-pointer active:scale-95 active:brightness-110";
        } else {
            base += " bg-gradient-to-br from-[#383e55] to-[#2f3446] opacity-40 border border-[#202A3E]";
        }
    }

    /* NORMAL MODE */
    else {
        if (isAvailable) {
            if (isSelected && !disableSelection) {
                base += " bg-gradient-to-br from-[#4A6DFF] to-[#6A86FF] text-white shadow-lg ring-2 ring-blue-300 scale-95";
            } else if (disableSelection) {
                base += " bg-gradient-to-br from-[#6B7280] to-[#4B5563] text-gray-300 border border-[#6B7280]";
            } else {
                base += isFixed
                    ? " bg-gradient-to-br from-[#c0b6ff] to-[#a89af3] text-white border border-[#c0b6ff] cursor-pointer active:scale-95 active:brightness-110"
                    : " bg-gradient-to-br from-[#a8c7ff] to-[#8bb3ff] text-[#1A2233] border border-[#a8c7ff] cursor-pointer active:scale-95 active:brightness-110";
            }
        } else {
            base += " bg-gradient-to-br from-[#383e55] to-[#2f3446] border border-[#383e55] text-white";
        }
    }

    return (
        <div
            className={base}
            onClick={() => !disableSelection && onClick?.(seat)}
        >
            {isAvailable ? (
                <span className="text-lg">{seat.seat_id}</span>
            ) : (
                <div className="flex flex-col items-center text-center leading-tight">
                    <span className="text-xs text-slate-300 dark:text-white">
                        {seat.seat_id}
                    </span>

                    <span className="text-sm font-bold text-white mt-0.5">
                        {/* [수정] 사용자 이름이 없을 경우(점검 시) '점검중'으로 표시 */}
                        {seat.user_name || "점검중"}
                    </span>

                    {seat.remaining_time > 0 && (
                        <span className="text-[11px] text-slate-400 dark:text-gray-300 mt-0.5">
                            {formatTime(seat.remaining_time)}
                        </span>
                    )}
                </div>
            )}
        </div>
    );
}

export default SeatBox;