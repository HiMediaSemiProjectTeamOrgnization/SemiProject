import { useEffect, useState } from "react";
import { FaClock, FaCheckCircle } from 'react-icons/fa';
import { useNavigate } from "react-router-dom";
import '../styles/TicketList.css';
import SeatSelector from "../components/SeatSelector";

function TicketList() {
    const navigate = useNavigate();

    const [tickets, setTickets] = useState([]); // 이용권 목록 저장
    const [choiceTicket, setChoiceTicket] = useState({}); // 선택된 이용권 저장
    const [activeType, setActiveType] = useState('time'); // 현재 활성화된 타입
    const [selectedId, setSelectedId] = useState(null); // 현재 선택된 티켓의 product_id
    const [seats, setSeats] = useState([]); // 좌석 목록 저장
    const [showSeatSelector, setShowSeatSelector] = useState(false); // 좌석선택 페이지 보여줄지 여부

    useEffect(() => {
        getTicketList();
        getSeats();
    }, []);

    // 이용권 목록 조회
    const getTicketList = async () => {
        const res = await fetch(`/api/web/tickets`);
        const ticketData = await res.json();
        setTickets(ticketData);
    }

    // 좌석 현황 조회
    const getSeats = async () => {
        const res = await fetch(`/api/web/seat`);
        const seatData = await res.json();
        setSeats(seatData);
    };

    const timeTickets = tickets.filter(t => t.type === "시간제");
    const dayTickets = tickets.filter(t => t.type === "기간제");

    // 필터링 (기간제/시간제)
    const handleTicketType = (e) => {
        const value = e.currentTarget.dataset.value;
        setActiveType(value);
        // setSelectedId(null);
        // setChoiceTicket({});
    }

    // 이용권 선택
    const handleClickTicket = (e) => {
        const id = e.currentTarget.dataset.id;
        setSelectedId(id);

        const clickedTicket = tickets.find(ticket => String(ticket.product_id) === id);
        setChoiceTicket(clickedTicket);
    }

    // 구매하기 
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!choiceTicket || Object.keys(choiceTicket).length === 0) {
            alert("구매하실 이용권을 선택하세요");
            return;
        }

        if (!window.confirm("선택하신 이용권은 " + choiceTicket.name + "입니다.\n구매하시겠습니까?")) return;

        if (choiceTicket.type === "기간제") setShowSeatSelector(true);
        else navigate("/web/payment", {
            state: {
                Ticket: choiceTicket
            }
        });
    }

    // 취소 버튼 
    const handleCancel = () => navigate("/web");

    // 기간권 선택일 경우 좌석 선택페이지로 이동
    if (showSeatSelector) return <SeatSelector choiceTicket={choiceTicket} seats={seats} onBack={() => setShowSeatSelector(false)} />


    return (
        <div className="max-w-6xl mx-auto p-6">
            <h2 className="text-4xl font-extrabold text-white mb-6">이용권 선택</h2>

            <div className="flex gap-4 mb-8">
                <button data-value="time" className={`px-6 py-3 rounded-2xl font-semibold transition ${activeType === 'time' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300'}`} onClick={handleTicketType} > 시간권 </button>
                <button data-value="day" className={`px-6 py-3 rounded-2xl font-semibold transition ${activeType === 'day' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300'}`} onClick={handleTicketType} > 기간권 </button>
            </div>

            <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {(activeType === "time" ? timeTickets : dayTickets).map((ticket) => {
                    const isSelected = selectedId === String(ticket.product_id);
                    return (
                        <li key={ticket.product_id}>
                            <button data-id={ticket.product_id} onClick={handleClickTicket} className={`  w-full h-full group relative flex flex-col justify-between p-8 rounded-3xl shadow-xl transition-all duration-200 text-left border cursor-pointer  active:scale-95 ${isSelected ? "bg-slate-800 border-blue-500 ring-2 ring-blue-500 shadow-blue-900/30" : "bg-slate-800 border-slate-700 active:border-blue-500/30"} `}  >
                                <div className={`absolute inset-0 bg-gradient-to-br from-blue-600/10 to-transparent transition-opacity rounded-3xl ${isSelected ? "opacity-100" : "opacity-0"}`}></div>

                                <div className="relative z-10 flex flex-col justify-between h-full">
                                    <div className="flex justify-between items-start mb-4">
                                        <span className={`inline-flex items-center justify-center w-12 h-12 rounded-2xl transition-colors duration-200 ${isSelected ? "bg-blue-500 text-white" : "bg-slate-700/50 text-blue-300"}`}>
                                            <FaClock className="text-xl" />
                                        </span>
                                        <FaCheckCircle className={`text-2xl transition-colors duration-200 ${isSelected ? "text-blue-500" : "text-slate-700"}`} />
                                    </div>

                                    <h3 className={`text-2xl font-bold mb-2 transition-colors duration-200 ${isSelected ? "text-white" : "text-slate-100"}`}>
                                        {ticket.name}
                                    </h3>

                                    <div className="flex items-baseline gap-1 mt-4">
                                        <span className={`text-3xl font-extrabold transition-colors duration-200 ${isSelected ? "text-blue-200" : "text-blue-300"}`}>
                                            {ticket.price.toLocaleString()}
                                        </span>
                                        <span className="text-lg text-slate-400 font-medium">원</span>
                                    </div>
                                </div>
                            </button>
                        </li>
                    );
                })}
            </ul>

            <div className="mt-8 flex justify-between items-center bg-slate-800 p-6 rounded-3xl border border-slate-700 shadow-inner">
                <div>
                    <p className="text-lg text-slate-300">이용 기간: <span className="text-white font-semibold">{choiceTicket.name || '미선택'}</span></p>
                    <p className="text-lg text-slate-300">총 금액: <span className="text-white font-semibold">{choiceTicket.price ? Number(choiceTicket.price).toLocaleString() + "원" : '0원'}</span></p>
                </div>
                <div className="flex gap-4">
                    <button className="px-6 py-3 rounded-2xl bg-red-600 text-white font-semibold cursor-pointer" onClick={handleCancel}>취소하기</button>
                    <button className="px-6 py-3 rounded-2xl bg-blue-600 text-white font-semibold cursor-pointer" onClick={handleSubmit}>구매하기</button>
                </div>
            </div>
        </div>
    )

}

export default TicketList;