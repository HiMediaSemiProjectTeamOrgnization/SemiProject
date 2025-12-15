import { useEffect, useState } from "react";
import SeatBox from "./SeatBox";
import SeatModal from "./SeatModal"; // SeatModal이 있다고 가정합니다.

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
        // 이미 사용 중인 좌석(is_status가 false)은 클릭 시 모달이 뜨는 로직으로 예상하여 수정
        if (!seat.is_status) {
            getSeatEndTime(seat);
        }
    };

    const getSeatEndTime = async (seat) => {
        try {
            const res = await fetch(`/api/web/seat/endtime/${seat.seat_id}`);
            const data = await res.json();

            const endTime = data.end_time
                ? new Date(data.end_time).toLocaleString("ko-KR")
                : null;

            setSelectedSeat({ seat_id: seat.seat_id, end_time: endTime });
            setModalOpen(true);
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="flex-1 flex flex-col px-4 pb-4 container mx-auto max-w-6xl h-full">

            {/* 전체 배경 및 텍스트 색상 설정 */}
            <main className="flex-1 flex flex-col px-4 pb-4 w-full h-full 
                            bg-[#f0f4f8] dark:bg-slate-900 
                            text-gray-900 dark:text-white transition-colors">

                {/* 헤더 */}
                <div className="flex justify-between items-end mb-4 shrink-0 px-2">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
                            좌석 현황
                        </h2>
                        <p className="text-gray-600 dark:text-slate-400 text-sm mt-1">
                            실시간 좌석 사용 현황을 확인하고 좌석을 선택하세요.
                        </p>
                    </div>

                    {/* 탭 */}
                    <div className="flex bg-slate-200/90 dark:bg-slate-800/90 p-1 rounded-xl 
                                    border border-slate-300 dark:border-slate-700 backdrop-blur">
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

                {/* 좌석 박스 (그리드 컨테이너) */}
                <div className="flex-1 
                                bg-gray-100 dark:bg-slate-800/50 
                                rounded-3xl 
                                border border-gray-200 dark:border-slate-700 
                                p-6 
                                backdrop-blur-sm 
                                shadow-inner dark:shadow-none 
                                relative 
                                overflow-hidden 
                                flex flex-col">

                    {filteredSeats.length === 0 && (
                        <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-slate-500">
                            좌석 데이터가 없습니다.
                        </div>
                    )}

                    {/* 좌석 그리드 */}
                    <div className="grid grid-cols-6 gap-3 w-full h-full content-start overflow-y-auto no-scrollbar">
                        {filteredSeats.map((seat) => (
                            <SeatBox
                                key={seat.seat_id}
                                seat={seat}
                                tabType={activeTab}
                                onClick={() => handleSeatClick(seat)}
                                disableHover={true}
                                hideSelectText={true}
                                disableSelection={true}
                            />
                        ))}
                    </div>

                    {/* Legend */}
                    <div className="mt-5 pt-3 
                                    border-t border-gray-300 dark:border-slate-700 
                                    flex justify-center gap-6 text-xs 
                                    text-gray-600 dark:text-slate-400 shrink-0">
                        <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded bg-${activeTab === "period" ? "violet" : "emerald"}-500`}></div>
                            선택 가능
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded 
                                            bg-slate-300 dark:bg-slate-700 
                                            border border-slate-400 dark:border-slate-600"></div>
                            사용 중
                        </div>
                    </div>
                </div>
                
                {/* 모달 (자리 정보 확인용) */}
                {/* SeatModal은 따로 제공되지 않았으므로 렌더링만 추가합니다 */}
                {modalOpen && selectedSeat && (
                    <SeatModal 
                        seatId={selectedSeat.seat_id} 
                        endTime={selectedSeat.end_time} 
                        onClose={() => setModalOpen(false)} 
                    />
                )}
            </main>
        </div>
    );
}

function TabButton({ isActive, onClick, label, color }) {
    // 탭 버튼의 Light/Dark 모드 스타일을 명확하게 분리
    
    // 활성화된 탭 스타일 (Light & Dark)
    const activeClass =
        color === "violet"
            ? "bg-violet-600 text-white shadow-lg shadow-violet-500/30 dark:shadow-violet-900/40"
            : "bg-emerald-600 text-white shadow-lg shadow-emerald-500/30 dark:shadow-emerald-900/40";

    // 비활성화된 탭 스타일 (Light & Dark)
    const inactiveClass =
        "text-slate-600 dark:text-slate-400 " + // 기본 텍스트 색상
        "hover:text-gray-800 dark:hover:text-white " + // 호버 시 텍스트 색상
        "hover:bg-slate-300/50 dark:hover:bg-slate-700/70 transition"; // 호버 시 배경색

    return (
        <button
            onClick={onClick}
            className={`px-6 py-2 rounded-xl text-sm font-bold transition-all duration-200 ${
                isActive ? activeClass : inactiveClass
            }`}
        >
            {label}
        </button>
    );
}

export default SeatStatus;