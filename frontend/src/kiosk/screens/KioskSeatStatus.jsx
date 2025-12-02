import { useEffect, useState } from "react";
import KioskHeader from "../components/KioskHeader";
import KioskAlertModal from "../components/KioskAlertModal"; // [추가]
import { FaChair, FaClock, FaCheck, FaLock, FaUser } from "react-icons/fa";

function KioskSeatStatus({ onBack, onSeatSelect, excludePeriodType = false, isCheckOutMode = false, memberInfo }) {
    const [seats, setSeats] = useState([]);
    const [activeTab, setActiveTab] = useState("daily"); 
    
    // [추가] 모달 상태
    const [modal, setModal] = useState({ isOpen: false, title: "", message: "", type: "warning" });
    const closeModal = () => setModal(prev => ({ ...prev, isOpen: false }));

    const canAccessPeriodTab = !memberInfo || isCheckOutMode || memberInfo.has_period_pass;

    useEffect(() => {
        if (!canAccessPeriodTab && activeTab === 'period') {
            setActiveTab('daily');
        }
    }, [canAccessPeriodTab, activeTab]);

    useEffect(() => {
        const fetchSeats = async () => {
            try {
                const res = await fetch("/api/kiosk/seats");
                if (!res.ok) throw new Error("좌석 정보를 불러올 수 없습니다.");
                const data = await res.json();
                data.sort((a, b) => a.seat_id - b.seat_id);
                setSeats(data);
            } catch (err) {
                console.error(err);
            }
        };

        fetchSeats(); 
        const interval = setInterval(fetchSeats, 10000); 
        return () => clearInterval(interval);
    }, []);

    const filteredSeats = seats.filter(seat => {
        if (activeTab === "daily") return seat.type !== "기간제";
        if (activeTab === "period") return seat.type === "기간제";
        return true;
    });

    const handleTabChange = (tab) => {
        if (tab === 'period' && !canAccessPeriodTab) {
            return; 
        }
        setActiveTab(tab);
    };

    const handleSeatClick = (seat) => {
        if (!onSeatSelect) return;

        if (isCheckOutMode) {
            if (!seat.is_status) {
                onSeatSelect(seat);
            } else {
                // [수정] alert -> setModal
                setModal({
                    isOpen: true,
                    title: "선택 불가",
                    message: "빈 좌석은 퇴실할 수 없습니다.\n사용 중인 본인의 좌석을 선택해 주세요.",
                    type: "warning"
                });
            }
        } else {
            if (seat.is_status) {
                onSeatSelect(seat);
            } else {
                // [수정] alert -> setModal
                setModal({
                    isOpen: true,
                    title: "선택 불가",
                    message: "현재 사용 중인 좌석입니다.\n다른 좌석을 선택해 주세요.",
                    type: "warning"
                });
            }
        }
    };

    const pageTitle = isCheckOutMode ? "퇴실 좌석 선택" : (onSeatSelect ? "좌석 선택" : "좌석 현황");
    const pageDesc = isCheckOutMode 
        ? "사용 중인 본인의 좌석을 선택해 주세요."
        : (activeTab === 'daily' ? '자유석(1일 이용)' : '기간제 지정석') + " 구역입니다.";

    return (
        <div className="h-screen bg-slate-900 flex flex-col font-sans text-white select-none overflow-hidden">
            <KioskHeader backButton={true} onBack={onBack} />

            <main className="flex-1 flex flex-col px-4 pb-4 container mx-auto max-w-6xl h-full">
                
                <div className="flex justify-between items-end mb-4 shrink-0 px-2">
                    <div>
                        <h2 className="text-3xl font-bold text-white tracking-tight">
                            {pageTitle}
                        </h2>
                        <p className="text-slate-400 text-sm mt-1">
                            {pageDesc}
                        </p>

                        {memberInfo && !isCheckOutMode && (
                            <div className="mt-3 inline-flex items-center gap-4 bg-slate-800 border border-blue-500/30 px-5 py-2.5 rounded-xl shadow-lg animate-fadeIn">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
                                        <FaUser className="text-sm" />
                                    </div>
                                    <span className="text-lg font-bold text-white">
                                        {memberInfo.name}<span className="text-sm text-slate-400 font-normal ml-1">님</span>
                                    </span>
                                </div>
                                <div className="w-px h-4 bg-slate-600"></div>
                                <div className="flex items-center gap-2 text-blue-300">
                                    <FaClock />
                                    <span className="text-sm">잔여 시간</span>
                                    <span className="text-xl font-mono font-bold text-white tracking-wide">
                                        {formatTime(memberInfo.saved_time_minute)}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>

                    {!excludePeriodType && (
                        <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700 gap-1">
                            <TabButton 
                                isActive={activeTab === "daily"} 
                                onClick={() => handleTabChange("daily")}
                                label="자유석 (Daily)"
                                color="emerald"
                            />
                            <TabButton 
                                isActive={activeTab === "period"} 
                                onClick={() => handleTabChange("period")}
                                label="기간제석 (Period)"
                                color="violet"
                                disabled={!canAccessPeriodTab} 
                            />
                        </div>
                    )}
                </div>

                <div className="flex-1 bg-slate-800/50 rounded-3xl border border-white/5 p-6 backdrop-blur-sm relative shadow-inner overflow-hidden flex flex-col">
                    
                    {filteredSeats.length === 0 && (
                        <div className="flex-1 flex items-center justify-center text-slate-500">
                            좌석 데이터가 없습니다.
                        </div>
                    )}

                    <div className="grid grid-cols-6 gap-3 w-full h-full content-start overflow-y-auto no-scrollbar">
                        {filteredSeats.map((seat) => (
                            <SeatCard 
                                key={seat.seat_id} 
                                seat={seat}
                                tabType={activeTab}
                                onClick={() => handleSeatClick(seat)}
                                clickable={!!onSeatSelect && (isCheckOutMode ? !seat.is_status : seat.is_status)}
                            />
                        ))}
                    </div>
                    
                    <div className="mt-4 pt-3 border-t border-white/5 flex justify-center gap-6 text-xs text-slate-400 shrink-0">
                        <div className="flex items-center gap-2"><div className={`w-3 h-3 rounded bg-${activeTab === 'period' ? 'violet' : 'emerald'}-500`}></div>선택 가능</div>
                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-slate-700 border border-slate-600"></div>사용 중</div>
                    </div>
                </div>
            </main>

            {/* [추가] 모달 컴포넌트 */}
            <KioskAlertModal 
                isOpen={modal.isOpen}
                onClose={closeModal}
                title={modal.title}
                message={modal.message}
                type={modal.type}
            />
        </div>
    );
}

// ... TabButton, formatTime, SeatCard (이전과 동일하므로 생략하지 않고, 전체 코드 유지를 위해 아래 포함) ...

function TabButton({ isActive, onClick, label, color, disabled }) {
    const activeClass = color === 'violet' 
        ? "bg-violet-600 text-white shadow-lg shadow-violet-900/50" 
        : "bg-emerald-600 text-white shadow-lg shadow-emerald-900/50";
    
    const disabledClass = "opacity-40 cursor-not-allowed bg-slate-800 text-slate-500";
    const inactiveClass = "text-slate-400 hover:text-white hover:bg-slate-700";

    let finalClass = "";
    if (disabled) finalClass = disabledClass;
    else if (isActive) finalClass = activeClass;
    else finalClass = inactiveClass;

    return (
        <div className="relative group">
            <button
                onClick={onClick}
                className={`
                    px-6 py-2 rounded-lg text-sm font-bold transition-all duration-200
                    ${finalClass}
                `}
            >
                {label}
            </button>

            {disabled && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max px-3 py-2 bg-slate-900 text-white text-xs font-medium rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 border border-slate-700">
                    기간제 회원만 선택하실 수 있습니다.
                    <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-900"></div>
                </div>
            )}
        </div>
    );
}

function formatTime(minutes) {
    if (minutes === undefined || minutes === null) return "-";
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h > 0) return `${h}시간 ${m}분`;
    return `${m}분`;
}

function SeatCard({ seat, onClick, clickable, tabType }) {
    const colorTheme = tabType === 'period' ? 'violet' : 'emerald';
    let cardStyle = "";
    let content = null;

    if (seat.is_status) {
        cardStyle = `
            bg-${colorTheme}-500/10 border-${colorTheme}-500/50 text-${colorTheme}-400
            ${clickable ? `hover:bg-${colorTheme}-500 hover:text-white hover:border-${colorTheme}-400 hover:shadow-lg hover:-translate-y-1 cursor-pointer active:scale-95` : ""}
            border
        `;
        content = (
            <>
                <FaChair className="text-2xl mb-1 opacity-80" />
                <span className="text-lg font-bold">{seat.seat_id}</span>
                {clickable && <span className="text-[10px] opacity-70">선택 가능</span>}
            </>
        );
    } else {
        const activeStyle = clickable 
            ? "border-rose-500/50 bg-rose-500/10 cursor-pointer hover:bg-rose-500 hover:text-white active:scale-95 hover:shadow-lg hover:-translate-y-1" 
            : "bg-slate-700 border-slate-600 text-slate-400 cursor-not-allowed shadow-inner";

        cardStyle = `border ${activeStyle}`;
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
                    {clickable && <span className="text-[10px] text-rose-400 font-bold mt-1">퇴실 선택</span>}
                </div>
            </>
        );
    }
    return (
        <div onClick={onClick} className={`relative rounded-xl flex flex-col items-center justify-center p-2 transition-all duration-200 aspect-square ${cardStyle}`}>
            {content}
        </div>
    );
}

export default KioskSeatStatus;