import { useState } from "react";
import { useNavigate } from "react-router-dom";
import SeatBox from "./SeatBox";

function SeatSelector({ choiceTicket, seats, onBack }) {
    const navigate = useNavigate();

    const [selectedSeat, setSelectedSeat] = useState(null);
    const fixedSeats = (seats || []).filter((s) => s.type === "fix");

    const handleSeatClick = (seat) => {
        if (seat?.is_status) setSelectedSeat(seat);
    };

    const handleSubmit = () => {
        if (!selectedSeat) alert("좌석을 선택하세요");
        else {
            navigate("/web/payment", {
                state: {
                    Ticket: choiceTicket,
                    SelectSeat: selectedSeat
                }
            });
        }
    };

    return (
        <div className="flex-1 flex flex-col px-4 pb-4 container mx-auto max-w-6xl h-full">
            <main className="flex-1 flex flex-col px-4 pb-6 w-full h-full">
                <div className="flex justify-between items-end mb-4 shrink-0 px-2">
                    <div>
                        <h2 className="text-3xl font-bold text-white tracking-tight">좌석 선택</h2>
                        <p className="text-slate-400 text-sm mt-1">고정석을 선택해 주세요.</p>
                    </div>
                </div>

                <div className="flex-1 bg-slate-800/50 rounded-3xl border border-white/5 p-6 backdrop-blur-sm relative shadow-inner overflow-hidden flex flex-col">
                    {fixedSeats.length === 0 ? (
                        <div className="flex-1 flex items-center justify-center text-slate-500">좌석 데이터가 없습니다.</div>
                    ) : (
                        <div className="grid grid-cols-6 gap-3 w-full h-full content-start overflow-y-auto no-scrollbar">
                            {fixedSeats.map((seat) => (
                                <SeatBox
                                    key={seat.seat_id}
                                    seat={seat}
                                    tabType={"period"}
                                    onClick={handleSeatClick}
                                    isSelected={selectedSeat?.seat_id === seat.seat_id}
                                />
                            ))}
                        </div>
                    )}

                    <div className="mt-4 pt-3 border-t border-white/5 flex justify-center gap-6 text-xs text-slate-400 shrink-0">
                        <div className="flex items-center gap-2"><div className={`w-3 h-3 rounded bg-violet-500`}></div>선택 가능</div>
                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-slate-700 border border-slate-600"></div>사용 중</div>
                    </div>
                </div>

                {/* 버튼은 선택된 좌석이 있을 때만 하단 고정으로 표시 */}
                {/* 기존 위치의 버튼 제거 */}
            </main>

            {selectedSeat && (
                <div className="fixed left-1/2 transform -translate-x-1/2 z-50 w-full px-4" style={{ bottom: 30 }}>
                    <div className="max-w-6xl mx-auto bg-slate-800 p-4 rounded-3xl border border-slate-700 shadow-inner flex items-center justify-between gap-4">
                        <div>
                            <p className="text-sm text-slate-300">선택된 좌석</p>
                            <p className="text-lg font-semibold text-white">{selectedSeat.seat_id}</p>
                        </div>

                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => {
                                        if (onBack) onBack();
                                        else navigate('/web/ticket');
                                    }}
                                    className="px-6 py-3 rounded-2xl bg-red-600 text-white font-semibold cursor-pointer"
                                >
                                    이전
                                </button>

                                <button
                                    onClick={handleSubmit}
                                    className="px-6 py-3 rounded-2xl bg-blue-600 text-white font-semibold shadow hover:bg-blue-700"
                                >
                                    다음
                                </button>
                            </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default SeatSelector;
