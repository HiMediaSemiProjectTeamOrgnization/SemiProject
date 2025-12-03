import { FaChair, FaClock, FaLock, FaUser } from "react-icons/fa";

function SeatBox({ seat, onClick, tabType = "daily", isSelected = false }) {

    function formatTime(minutes) {
        if (minutes === undefined || minutes === null) return "-";
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        if (h > 0) return `${h}시간 ${m}분`;
        return `${m}분`;
    }

    const colorTheme = tabType === 'period' ? 'violet' : 'emerald';
    let cardStyle = "";
    let content = null;

    if (seat.is_status) {
        cardStyle = `
            bg-${colorTheme}-500/10 border-${colorTheme}-500/50 text-${colorTheme}-400
            hover:bg-${colorTheme}-500 hover:text-white hover:border-${colorTheme}-400 hover:shadow-lg hover:-translate-y-1 cursor-pointer active:scale-95
            border
        `;
        content = (
            <>
                <FaChair className="text-2xl mb-1 opacity-80" />
                <span className="text-lg font-bold">{seat.seat_id}</span>
                <span className="text-[10px] opacity-70">선택 가능</span>
            </>
        );
    } else {
        cardStyle = `border bg-slate-700 border-slate-600 text-slate-400 cursor-not-allowed shadow-inner`;
        content = (
            <>
                <div className="flex justify-between w-full px-3 absolute top-2">
                    <span className="text-xs font-bold opacity-70">{seat.seat_id}</span>
                    <FaLock className="text-[10px] opacity-50" />
                </div>
                <div className="flex flex-col items-center justify-center w-full mt-1 gap-1">
                    <div className="flex items-center gap-1 opacity-90">
                        <FaUser className="text-[10px]" />
                        <span className="text-sm font-bold truncate max-w-[4rem]">
                            {seat.user_name || "사용자"}
                        </span>
                    </div>
                    <div className="bg-slate-800/80 px-2 py-0.5 rounded text-[10px] font-mono border border-slate-600/50 flex items-center gap-1">
                        <FaClock className="text-[9px]" />
                        <span>{formatTime(seat.remaining_time)}</span>
                    </div>
                </div>
            </>
        );
    }

    return (
        <div className={`relative rounded-xl transition-all duration-200 aspect-square`} onClick={() => onClick?.(seat)}>
            {/* overlay like TicketList */}
            <div className={`absolute inset-0 bg-gradient-to-br from-blue-600/10 to-transparent rounded-xl transition-opacity pointer-events-none ${isSelected ? 'opacity-100' : 'opacity-0'}`}></div>

            <div className={`relative rounded-xl h-full w-full p-2 flex flex-col items-center justify-center ${isSelected ? 'bg-slate-800 border-2 border-blue-500 text-white shadow-xl shadow-blue-900/40' : cardStyle}`}>
                {content}
                {isSelected && (
                    <span className="absolute bottom-2 text-[10px] font-bold text-blue-100 bg-blue-600/30 px-2 py-0.5 rounded-full">
                        선택됨
                    </span>
                )}
            </div>
        </div>
    );
}
export default SeatBox;