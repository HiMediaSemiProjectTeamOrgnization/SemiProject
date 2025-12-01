import { useEffect, useState } from "react";
import KioskHeader from "../components/KioskHeader";
import { FaChair, FaClock, FaCheck, FaLock } from "react-icons/fa";

function KioskSeatStatus({ onBack, onSeatSelect, excludePeriodType = false }) {
    const [seats, setSeats] = useState([]);
    const [activeTab, setActiveTab] = useState("daily"); // 'daily' | 'period'

    useEffect(() => {
        async function loadSeats() {
            try {
                const res = await fetch("/api/kiosk/seats");
                if (!res.ok) throw new Error("좌석 정보를 불러올 수 없습니다.");
                const data = await res.json();
                
                // 좌석 ID 정렬
                data.sort((a, b) => a.seat_id - b.seat_id);
                setSeats(data);
            } catch (err) {
                console.error(err);
                setSeats([]);
            }
        }
        loadSeats();
    }, []);

    // 탭에 따라 좌석 필터링
    const filteredSeats = seats.filter(seat => {
        if (activeTab === "daily") return seat.type !== "기간제";
        if (activeTab === "period") return seat.type === "기간제";
        return true;
    });

    // 탭 변경 핸들러
    const handleTabChange = (tab) => {
        setActiveTab(tab);
    };

    return (
        <div className="h-screen bg-slate-900 flex flex-col font-sans text-white select-none overflow-hidden">
            <KioskHeader backButton={true} onBack={onBack} />

            {/* 메인 컨텐츠 영역 (Flex로 남은 공간 꽉 채움) */}
            <main className="flex-1 flex flex-col px-4 pb-4 container mx-auto max-w-6xl h-full">
                
                {/* 상단: 타이틀 & 탭 메뉴 */}
                <div className="flex justify-between items-end mb-4 shrink-0 px-2">
                    <div>
                        <h2 className="text-3xl font-bold text-white tracking-tight">
                            {onSeatSelect ? "좌석 선택" : "좌석 현황"}
                        </h2>
                        <p className="text-slate-400 text-sm mt-1">
                            {activeTab === 'daily' ? '자유석(1일 이용)' : '기간제 지정석'} 구역입니다.
                        </p>
                    </div>

                    {/* 탭 버튼 그룹 */}
                    {!excludePeriodType && (
                        <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700">
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
                            />
                        </div>
                    )}
                </div>

                {/* 좌석 그리드 컨테이너 */}
                {/* flex-1로 남은 높이를 모두 차지하게 하고, 내부에서 좌석 개수에 따라 grid가 배치됨 */}
                <div className="flex-1 bg-slate-800/50 rounded-3xl border border-white/5 p-6 backdrop-blur-sm relative shadow-inner overflow-hidden flex flex-col">
                    
                    {/* 좌석이 없을 경우 안내 */}
                    {filteredSeats.length === 0 && (
                        <div className="flex-1 flex items-center justify-center text-slate-500">
                            좌석 데이터가 없습니다.
                        </div>
                    )}

                    {/* 그리드: 화면 꽉 채우기 (auto-fit 사용) */}
                    <div className="grid grid-cols-6 gap-3 w-full h-full content-start overflow-y-auto no-scrollbar">
                        {filteredSeats.map((seat) => (
                            <SeatCard 
                                key={seat.seat_id} 
                                seat={seat}
                                tabType={activeTab}
                                onClick={() => {
                                    if (!onSeatSelect) return;
                                    if (seat.is_status) onSeatSelect(seat);
                                    else alert("현재 사용 중인 좌석입니다.");
                                }}
                                clickable={!!onSeatSelect && seat.is_status}
                            />
                        ))}
                    </div>
                    
                    {/* 하단 범례 */}
                    <div className="mt-4 pt-3 border-t border-white/5 flex justify-center gap-6 text-xs text-slate-400 shrink-0">
                        <div className="flex items-center gap-2"><div className={`w-3 h-3 rounded bg-${activeTab === 'period' ? 'violet' : 'emerald'}-500`}></div>선택 가능</div>
                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-slate-700 border border-slate-600"></div>사용 중</div>
                    </div>
                </div>
            </main>
        </div>
    );
}

// 탭 버튼 컴포넌트
function TabButton({ isActive, onClick, label, color }) {
    const activeClass = color === 'violet' 
        ? "bg-violet-600 text-white shadow-lg shadow-violet-900/50" 
        : "bg-emerald-600 text-white shadow-lg shadow-emerald-900/50";
    
    return (
        <button
            onClick={onClick}
            className={`
                px-6 py-2 rounded-lg text-sm font-bold transition-all duration-200
                ${isActive ? activeClass : "text-slate-400 hover:text-white hover:bg-slate-700"}
            `}
        >
            {label}
        </button>
    );
}

// 개별 좌석 카드
function SeatCard({ seat, onClick, clickable, tabType }) {
    // 1. 색상 테마 결정 (탭에 따라 다름)
    const colorTheme = tabType === 'period' ? 'violet' : 'emerald';
    
    // 2. 상태별 스타일
    let cardStyle = "";
    let content = null;

    // 임의의 남은 시간 데이터 (백엔드 연결 전 Mocking)
    // 실제로는 seat.remaining_time 등을 사용
    const remainingTime = seat.remaining_time || "02:30"; 

    if (seat.is_status) {
        // [사용 가능]
        cardStyle = `
            bg-${colorTheme}-500/10 border-${colorTheme}-500/50 text-${colorTheme}-400
            ${clickable ? `hover:bg-${colorTheme}-500 hover:text-white hover:border-${colorTheme}-400 hover:shadow-lg hover:-translate-y-1 cursor-pointer active:scale-95` : ""}
            border
        `;
        content = (
            <>
                <FaChair className="text-2xl mb-1 opacity-80" />
                <span className="text-lg font-bold">{seat.seat_id}</span>
                {clickable && <span className="text-[10px] opacity-70">터치하여 선택</span>}
            </>
        );
    } else {
        // [사용 중]
        cardStyle = "bg-slate-700/40 border-slate-600 text-slate-500 cursor-not-allowed opacity-80";
        content = (
            <>
                <div className="flex justify-between w-full px-2 absolute top-2">
                    <span className="text-sm font-bold opacity-50">{seat.seat_id}</span>
                    <FaLock className="text-xs opacity-40" />
                </div>
                
                {/* 남은 시간 표시 */}
                <div className="flex flex-col items-center mt-2">
                    <span className="text-[10px] uppercase tracking-wider mb-0.5">Time Left</span>
                    <div className="flex items-center gap-1 bg-slate-800 px-2 py-1 rounded text-slate-300 border border-slate-600">
                        <FaClock className="text-[10px]" />
                        <span className="text-xs font-mono font-bold">{remainingTime}</span>
                    </div>
                </div>
            </>
        );
    }

    return (
        <div 
            onClick={onClick}
            className={`
                relative rounded-xl flex flex-col items-center justify-center p-2 transition-all duration-200 shadow-md aspect-square
                ${cardStyle}
            `}
        >
            {content}
        </div>
    );
}

export default KioskSeatStatus;