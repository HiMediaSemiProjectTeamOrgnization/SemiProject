function SeatBox({ seat, onClick, isSelected }) {

    // seat.is_status에 따라 색상 결정
    const getSeatStyle = () => {
        if (!seat.is_status) return "bg-red-200 border-red-400 text-red-700";
        return "bg-green-100 border-green-400 text-green-700";
    };

    return (
        <div className={`w-16 h-12 rounded-xl flex items-center justify-center text-lg font-semibold border transition cursor-pointer  ${getSeatStyle()} ${isSelected ? "ring-2 ring-blue-500" : ""}`} onClick={() => onClick?.(seat)} >
            {seat.seat_id}
        </div>
    );
}

export default SeatBox;