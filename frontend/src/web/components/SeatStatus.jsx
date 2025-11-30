import { useEffect, useState } from "react";
import SeatBox from "../components/SeatBox"
import SeatModal from "../components/SeatModal";

function SeatStatus() {

    const [seats, setSeats] = useState([]);
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedSeat, setSelectedSeat] = useState(null);

    const getSeatStatus = async () => {
        const res = await fetch(`/api/web/seat`);
        const data = await res.json();
        setSeats(data);
    };

    useEffect(() => {
        getSeatStatus();
    }, []);

    const fixedSeats = seats.filter(s => s.type === "fix");
    const freeSeats = seats.filter(s => s.type === "free");

    // 좌석별 종료시간 조회함수
    const handleClick = async (seat) => {
        if (!seat.is_status) {
            const res = await fetch(`/api/web/seat/endtime/${seat.seat_id}`);
            const data = await res.json();

            const endTime = data.end_time ? new Date(data.end_time).toLocaleString('ko-KR') : null
            setSelectedSeat({ seat_id: seat.seat_id, end_time: endTime });
            setModalOpen(true);
        }
    }

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <h2 className="text-xl font-bold mb-2">고정석</h2>
            <div className="grid grid-cols-10 gap-3 mb-8">
                {fixedSeats.map(seat => (
                    <SeatBox key={seat.seat_id} seat={seat} onClick={handleClick} />
                ))}
            </div>

            <h2 className="text-xl font-bold mb-2">자유석</h2>
            <div className="grid grid-cols-10 gap-3">
                {freeSeats.map(seat => (
                    <SeatBox key={seat.seat_id} seat={seat} onClick={handleClick} />
                ))}
            </div>

            {modalOpen && selectedSeat && (
                <SeatModal seat={selectedSeat.seat_id} endTime={selectedSeat.end_time} onClose={() => setModalOpen(false)} />
            )}
        </div>
    );
}

export default SeatStatus;