import { useEffect, useState } from "react";
import SeatBox from "./SeatBox";
import SeatModal from "./SeatModal";

function SeatStatus() {

    const [seats, setSeats] = useState([]);
    const [activeTab, setActiveTab] = useState("daily");
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedSeat, setSelectedSeat] = useState(null);

    useEffect(() => {
        const fetchSeats = async () => {
            try {
                const res = await fetch(`/api/web/seat`);
                if (!res.ok) throw new Error("좌석 정보를 불러올 수 없습니다.");
                const data = await res.json();
                setSeats(data);
            } catch (err) {
                console.error(err);
            }
        };

        fetchSeats();
    }, []);

    const filteredSeats = seats.filter(seat => {
        if (activeTab === "daily") return seat.type === "free";
        if (activeTab === "period") return seat.type === "fix";
        return true;
    });

    const handleTabChange = (tab) => {
        setActiveTab(tab);
    };

    const handleSeatClick = (seat) => {
        if (seat.is_status) {
            getSeatEndTime(seat);
        }
    };

    // 좌석별 종료시간 조회함수
    const getSeatEndTime = async (seat) => {
        try {
            const res = await fetch(`/api/web/seat/endtime/${seat.seat_id}`);
            const data = await res.json();

            const endTime = data.end_time ? new Date(data.end_time).toLocaleString('ko-KR') : null
            setSelectedSeat({ seat_id: seat.seat_id, end_time: endTime });
            setModalOpen(true);
        } catch (err) {
            console.error(err);
        }
    }

    return (
        <div className="w-full h-screen bg-slate-900 flex flex-col font-sans text-white select-none overflow-hidden">

            <main className="flex-1 flex flex-col px-4 pb-4 w-full h-full bg-slate-900">

                <div className="flex justify-between items-end mb-4 shrink-0 px-2">
                    <div>
                        <h2 className="text-3xl font-bold text-white tracking-tight">
                            좌석 현황
                        </h2>
                        <p className="text-slate-400 text-sm mt-1">
                            실시간 좌석 사용 현황을 확인하고 좌석을 선택하세요.
                        </p>
                    </div>

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
                        />
                    </div>
                </div>

                <div className="flex-1 bg-slate-800/50 rounded-3xl border border-white/5 p-6 backdrop-blur-sm relative shadow-inner overflow-hidden flex flex-col">

                    {filteredSeats.length === 0 && (
                        <div className="flex-1 flex items-center justify-center text-slate-500">
                            좌석 데이터가 없습니다.
                        </div>
                    )}

                    <div className="grid grid-cols-6 gap-3 w-full h-full content-start overflow-y-auto no-scrollbar">
                        {filteredSeats.map((seat) => (
                            <SeatBox
                                key={seat.seat_id}
                                seat={seat}
                                tabType={activeTab}
                                onClick={() => handleSeatClick(seat)}
                            />
                        ))}
                    </div>

                    <div className="mt-4 pt-3 border-t border-white/5 flex justify-center gap-6 text-xs text-slate-400 shrink-0">
                        <div className="flex items-center gap-2"><div className={`w-3 h-3 rounded bg-${activeTab === 'period' ? 'violet' : 'emerald'}-500`}></div>선택 가능</div>
                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-slate-700 border border-slate-600"></div>사용 중</div>
                    </div>
                </div>
            </main>

            {/* 모달 영역 */}
            {modalOpen && selectedSeat && (
                <SeatModal
                    seat={selectedSeat.seat_id}
                    endTime={selectedSeat.end_time}
                    onClose={() => setModalOpen(false)}
                />
            )}
        </div>
    );
}

function TabButton({ isActive, onClick, label, color }) {
    const activeClass = color === 'violet'
        ? "bg-violet-600 text-white shadow-lg shadow-violet-900/50"
        : "bg-emerald-600 text-white shadow-lg shadow-emerald-900/50";

    const inactiveClass = "text-slate-400 hover:text-white hover:bg-slate-700";

    const finalClass = isActive ? activeClass : inactiveClass;

    return (
        <button
            onClick={onClick}
            className={`
                px-6 py-2 rounded-lg text-sm font-bold transition-all duration-200
                ${finalClass}
            `}
        >
            {label}
        </button>
    );
}

export default SeatStatus;
