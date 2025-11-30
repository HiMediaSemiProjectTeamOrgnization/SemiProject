import { useState } from "react";
import { useNavigate } from "react-router-dom";
import SeatBox from "../components/SeatBox"

function SeatSelector({ choiceTicket, seats }) {
    const navigate = useNavigate();

    const [selectedSeat, setSelectedSeat] = useState(null);

    // 좌석 구분
    const fixedSeats = seats.filter((s) => s.type === "fix");
    const freeSeats = seats.filter((s) => s.type === "free");

    const handleSeatClick = (seat) => {
        if (seat.is_status) setSelectedSeat(seat);
    };

    const handleSubmit = () => {
        if (!selectedSeat) {
            alert("좌석을 선택하세요");
            return;
        }

        alert("날짜 선택창으로 이동");
    };

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <h2 className="text-xl font-bold mb-2">고정석</h2>
            <div className="grid grid-cols-10 gap-3 mb-8">
                {fixedSeats.map((seat) => (
                    <SeatBox key={seat.seat_id} seat={seat} onClick={handleSeatClick} isSelected={selectedSeat?.seat_id === seat.seat_id} />
                ))}
            </div>

            <h2 className="text-xl font-bold mb-2">자유석</h2>
            <div className="grid grid-cols-10 gap-3 mb-4">
                {freeSeats.map((seat) => (
                    <SeatBox key={seat.seat_id} seat={seat} onClick={handleSeatClick} isSelected={selectedSeat?.seat_id === seat.seat_id} />
                ))}
            </div>
            <button className="mt-6 px-4 py-2 bg-blue-500 text-white rounded" onClick={handleSubmit}>다음</button>

        </div>
    );
}

export default SeatSelector;
