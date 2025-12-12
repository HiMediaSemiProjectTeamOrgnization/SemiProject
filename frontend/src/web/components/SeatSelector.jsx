import { useState } from "react";
import { useNavigate } from "react-router-dom";
import SeatBox from "./SeatBox";

function SeatSelector({ choiceTicket, seats, onBack }) {
    const navigate = useNavigate();

    const [selectedSeat, setSelectedSeat] = useState(null);
    const fixedSeats = (seats || []).filter((s) => s.type === "fix");

    const handleSeatClick = (seat) => {
        // 좌석이 선택 가능한 상태(is_status: true)일 때만 선택
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
        // 전체 배경 및 기본 텍스트 색상 설정
        <div className="flex-1 flex flex-col px-4 pb-4 container mx-auto max-w-6xl h-full 
                        bg-[#f0f4f8] dark:bg-slate-900 text-gray-900 dark:text-gray-100 transition-colors">

            <main className="flex-1 flex flex-col px-4 pb-6 w-full h-full relative">

                {/* 헤더 */}
                <div className="flex justify-between items-end mb-4 shrink-0 px-2">
                    <div>
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
                            좌석 선택
                        </h2>
                        <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">
                            고정석을 선택해 주세요.
                        </p>
                    </div>
                </div>

                {/* 좌석 박스 전체 (스크롤 컨테이너) */}
                <div className="
                    flex-1 
                    bg-gray-100 dark:bg-slate-800 // 배경색 조정
                    rounded-3xl 
                    border border-gray-200 dark:border-white/5 
                    p-6 
                    backdrop-blur-sm 
                    relative 
                    shadow-lg dark:shadow-none // 다크 모드에서 그림자 조정
                    overflow-hidden 
                    flex flex-col
                ">
                    {fixedSeats.length === 0 ? (
                        <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-slate-500">
                            좌석 데이터가 없습니다.
                        </div>
                    ) : (
                        <div className="
                            grid grid-cols-6 gap-3 
                            w-full h-full 
                            content-start 
                            overflow-y-auto 
                            no-scrollbar
                        ">
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

                    {/* 좌석 Legend */}
                    <div className="mt-4 pt-3 border-t border-gray-300 dark:border-slate-700 
                                    flex justify-center gap-6 text-xs 
                                    text-gray-600 dark:text-slate-400 shrink-0">
                        <div className="flex items-center gap-2">
                            {/* 선택 가능 (다크 모드에서도 동일한 색상 사용) */}
                            <div className="w-3 h-3 rounded bg-violet-500"></div>선택 가능
                        </div>
                        <div className="flex items-center gap-2">
                            {/* 사용 중 (다크 모드에서 더 진한 회색) */}
                            <div className="w-3 h-3 rounded bg-slate-300 dark:bg-slate-700 
                                            border border-slate-400 dark:border-slate-600">
                            </div>
                            사용 중
                        </div>
                    </div>
                </div>

                {/* 선택 시 하단 고정 버튼 (Floating Action Box) */}
                {selectedSeat && (
                    <div
                        className="absolute left-1/2 transform -translate-x-1/2 z-50 w-full px-4"
                        style={{ bottom: "5px" }}
                    >
                        <div className="
                            max-w-6xl mx-auto 
                            bg-white dark:bg-slate-800 // 배경색 조정
                            p-4 
                            rounded-3xl 
                            border border-gray-300 dark:border-slate-700 // 경계선 조정
                            shadow-xl dark:shadow-2xl dark:shadow-slate-700/50 // 다크 모드 그림자 강조
                            flex items-center justify-between gap-4
                        ">
                            <div>
                                <p className="text-sm text-gray-600 dark:text-slate-300">선택된 좌석</p>
                                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                                    {selectedSeat.seat_id}
                                </p>
                            </div>

                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => {
                                        if (onBack) onBack();
                                        else navigate('/web/ticket');
                                    }}
                                    className="px-6 py-3 rounded-2xl 
                                               bg-red-600 text-white font-semibold cursor-pointer
                                               hover:bg-red-700 transition"
                                >
                                    이전
                                </button>

                                <button
                                    onClick={handleSubmit}
                                    className="px-6 py-3 rounded-2xl 
                                               bg-blue-600 text-white font-semibold shadow 
                                               hover:bg-blue-700 transition"
                                >
                                    다음
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

export default SeatSelector;