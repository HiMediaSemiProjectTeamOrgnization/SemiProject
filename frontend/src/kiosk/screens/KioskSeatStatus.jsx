import { useEffect, useState } from "react";
import KioskHeader from "../components/KioskHeader";
import { FaChair } from "react-icons/fa";

function KioskSeatStatus({ onBack, onSeatSelect, excludePeriodType = false }) {
  const [seats, setSeats] = useState([]);

  useEffect(() => {
    async function loadSeats() {
      try {
        const res = await fetch("/api/kiosk/seats");
        if (!res.ok) throw new Error("좌석 정보를 불러올 수 없습니다.");
        const data = await res.json();
        
        // [수정 1] 좌석 ID 기준 오름차순 정렬 (상태가 변해도 위치 고정)
        // 사용 중인 좌석이 맨 뒤로 가는 문제를 해결합니다.
        data.sort((a, b) => a.seat_id - b.seat_id);
        
        setSeats(data);
      } catch (err) {
        console.error(err);
        setSeats([]);
      }
    }

    loadSeats();
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col font-sans text-white select-none">
      <KioskHeader backButton={true} onBack={onBack} />

      <main className="flex-1 flex flex-col items-center p-8 container mx-auto max-w-6xl">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-5xl font-extrabold tracking-tight">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-200 via-white to-blue-200">
              {onSeatSelect ? "좌석 선택" : "좌석 현황"}
            </span>
          </h2>
          <p className="text-xl text-slate-400 font-light">
            {onSeatSelect ? "이용하실 좌석을 선택해 주세요." : "현재 좌석 상태를 확인합니다."}
          </p>
        </div>

        <div className="grid grid-cols-10 gap-4 w-full max-w-6xl">
          {seats.map((seat) => {
            // [수정 2] 기간제 좌석 숨김 처리
            // 아예 제거(filter)하면 뒤의 좌석이 앞으로 밀리므로,
            // '보이지 않게(invisible)' 처리하여 자리(Grid Cell)는 유지합니다.
            const isHidden = excludePeriodType && seat.type === "기간제";

            if (isHidden) {
                // 자리는 차지하되 보이지 않음 (위치 고정 목적)
                return <div key={seat.seat_id} className="invisible p-4"></div>;
            }

            return (
                <SeatCard 
                  key={seat.seat_id} 
                  seat={seat} 
                  onClick={() => {
                    if (!onSeatSelect) return; 

                    if (seat.is_status) {
                      onSeatSelect(seat);
                    } else {
                        alert("이미 사용 중인 좌석입니다.");
                    }
                  }}
                  clickable={!!onSeatSelect} 
                />
            );
          })}
        </div>
      </main>
    </div>
  );
}

// 개별 좌석 카드 (디자인 유지)
function SeatCard({ seat, onClick, clickable }) {
  let colorClass = "";
  
  if (seat.is_status) {
      // 사용 가능
      const baseColor = seat.type === "기간제" ? "bg-blue-500" : "bg-green-500";
      if (clickable) {
          colorClass = `${baseColor} hover:brightness-110 cursor-pointer active:scale-95`;
      } else {
          colorClass = `${baseColor}`;
      }
  } else {
      // 사용 중
      colorClass = "bg-red-500 opacity-70 cursor-not-allowed";
  }

  return (
    <div
      onClick={onClick} 
      className={`relative flex flex-col items-center justify-center p-4 rounded-xl font-bold text-white transition-all shadow-lg ${colorClass}`}
    >
      <FaChair className="text-3xl mb-2" />
      <div>#{seat.seat_id}</div>
      <div className="text-sm">{seat.type}</div>
      <div className="text-xs mt-1">
        {seat.is_status ? "사용 가능" : "사용 중"}
      </div>
    </div>
  );
}

export default KioskSeatStatus;