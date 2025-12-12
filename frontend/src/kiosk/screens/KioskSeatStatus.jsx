import { useState, useEffect } from "react";
import { PiChairBold } from "react-icons/pi";
import { FaDoorOpen } from "react-icons/fa";
import axios from "axios";
import KioskHeader from "../components/KioskHeader";

const FLOOR_PLAN = [
  [1,0,21,22,23,24,25,26,27,28,29,30,0,51,52],
  [2,0,0,0,0,0,0,0,0,0,0,0,0,53,54],
  [3,0,31,32,33,34,35,0,41,42,43,44,45,55,56],
  [4,0,36,37,38,39,40,0,46,47,48,49,50,57,58],
  [5,0,0,0,0,0,0,0,0,0,0,0,0,59,60],
  [6,0,61,62,63,64,65,0,71,72,73,74,75,0,0],
  [7,0,66,67,68,69,70,0,76,77,78,79,80,0,91],
  [8,0,0,0,0,0,0,0,0,0,0,0,0,0,92],
  [9,0,11,12,13,14,15,0,81,82,83,84,85,0,93],
  [10,0,16,17,18,19,20,0,86,87,88,89,90,0,94],
  [0,0,0,0,0,0,0,-1,95,96,97,98,99,100,0],
];

const KioskSeatStatus = ({
  onBack,
  onSeatSelect,
  excludePeriodType = false,
  isCheckOutMode = false,
  isViewOnly = false,
}) => {

  const [seats, setSeats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSeatId, setSelectedSeatId] = useState(null);

  // 남은시간 HH:MM:SS 변환
  const formatTime = (sec) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return [
      h.toString().padStart(2, "0"),
      m.toString().padStart(2, "0"),
      s.toString().padStart(2, "0"),
    ].join(":");
  };

  // 좌석 데이터 요청 + remaining_time(분)을 초로 변환
  const fetchSeats = async () => {
    try {
      const res = await axios.get("/api/kiosk/seats");

      const withSeconds = res.data.map((s) => ({
        ...s,
        remaining_seconds: s.remaining_time ? s.remaining_time * 60 : 0,
      }));

      setSeats(withSeconds);
      setLoading(false);
    } catch {
      setSeats([]);
      setLoading(false);
    }
  };

  useEffect(() => { fetchSeats(); }, []);

  // 1초마다 remaining_seconds 감소
  useEffect(() => {
    const timer = setInterval(() => {
      setSeats((prev) =>
        prev.map((s) => {
          if (!s.remaining_seconds || s.remaining_seconds <= 0) return s;
          return { ...s, remaining_seconds: s.remaining_seconds - 1 };
        })
      );
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const getSeat = (id) => seats.find((s) => s.seat_id === id);

  const formatName = (name) => {
    if (!name) return "사용중";
    if (name === "비회원") return "비회원";
    return name.length <= 2 ? `${name[0]}*` : `${name[0]}*${name[name.length - 1]}`;
  };

  const pressEffect = "active:scale-95 active:brightness-110";

  // ---------------------------------------------
  // 좌석 렌더링
  // ---------------------------------------------
  const renderSeat = (seatId) => {

    // 출입문
    if (seatId === -1) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center">
          <FaDoorOpen className="w-7 h-7 text-slate-400 opacity-70" />
        </div>
      );
    }

    if (seatId === 0) return <div />;

    const seat = getSeat(seatId);
    if (!seat) return <div className="rounded-md bg-[#1C2437]" />;

    const isAvailable = seat.is_status;
    const isFixed = seat.type === "기간제" || seat.type === "fix";
    const isSelected = selectedSeatId === seatId;

    let base =
      "w-full h-full rounded-md flex flex-col items-center justify-center transition-all duration-150";

    // VIEW ONLY (좌석 현황 보기 모드)
    if (isViewOnly) {
      base += isAvailable
        ? isFixed
          ? " bg-gradient-to-br from-[#c0b6ff] to-[#a89af3] border border-[#c0b6ff] text-white"
          : " bg-gradient-to-br from-[#a8c7ff] to-[#8bb3ff] border border-[#a8c7ff] text-[#1A2233]"
        : " bg-gradient-to-br from-[#383e55] to-[#2f3446] border border-[#383e55] text-[#8E97A8]";

      return (
        <div className={base}>
          {isAvailable ? (
            <span className="text-lg">{seatId}</span>
          ) : (
             <div className="flex flex-col items-center text-center leading-tight">
                <span className="text-xs text-slate-300">{seatId}</span>
                <span className="text-sm font-bold text-white mt-0.5">
                  {formatName(seat.user_name)}
                </span>
                
                {seat.remaining_seconds > 0 && (
                  <span className="text-[11px] text-slate-400 mt-0.5">
                    {formatTime(seat.remaining_seconds)}
                  </span>
                )}
             </div>
          )}
        </div>
      );
    }

    // CHECKOUT MODE (퇴실 모드)
    if (isCheckOutMode) {
      if (!isAvailable) {
        base += isSelected
          ? " bg-gradient-to-br from-[#FF5C7A] to-[#FF3F62] text-white ring-2 ring-rose-300 scale-95 shadow-lg"
          : " bg-[#B94163]/40 text-[#FF8FA5] border border-[#B94163] cursor-pointer " + pressEffect;
      } else {
        base += " bg-gradient-to-br from-[#383e55] to-[#2f3446] opacity-40 border border-[#202A3E]";
      }
    }

    // NORMAL MODE (입실/구매 모드)
    else {
      if (isAvailable) {
        if (isSelected) {
          base +=
            " bg-gradient-to-br from-[#4A6DFF] to-[#6A86FF] text-white shadow-lg ring-2 ring-blue-300 scale-95";
        } else {
          base += isFixed
            ? " bg-gradient-to-br from-[#c0b6ff] to-[#a89af3] text-white border border-[#c0b6ff] cursor-pointer " + pressEffect
            : " bg-gradient-to-br from-[#a8c7ff] to-[#8bb3ff] text-[#1A2233] border border-[#a8c7ff] cursor-pointer " + pressEffect;
        }
      } else {
        base += " bg-gradient-to-br from-[#383e55] to-[#2f3446] border border-[#383e55] text-[#8E97A8]";
      }
    }

    return (
      <div
        className={base}
        onClick={() => {
          setSelectedSeatId(seatId);
          if (isCheckOutMode) {
            if (!isAvailable) onSeatSelect(seat);
          } 
          else {
            if (isAvailable) onSeatSelect(seat);
          }
        }}
      >
        {isAvailable ? (
          <span className="text-lg">{seatId}</span>
        ) : (
          <div className="flex flex-col items-center text-center leading-tight">
            <span className="text-xs text-slate-300">{seatId}</span>

            <span className="text-sm font-bold text-white mt-0.5">
              {formatName(seat.user_name)}
            </span>

            {seat.remaining_seconds > 0 && (
              <span className="text-[11px] text-slate-400 mt-0.5">
                {formatTime(seat.remaining_seconds)}
              </span>
            )}
          </div>
        )}
      </div>
    );
  };

  // ---------------------------------------------
  // 타이틀 텍스트 결정 로직
  // ---------------------------------------------
  let titleText = "이용하실 좌석을 선택해주세요";
  if (isCheckOutMode) titleText = "퇴실하실 좌석을 선택해주세요";
  if (isViewOnly) titleText = "좌석 현황";

  // ---------------------------------------------
  // UI 출력
  // ---------------------------------------------
  return (
    <div className="flex flex-col h-screen w-full bg-slate-900 text-white select-none overflow-hidden">
      <KioskHeader backButton={true} onBack={onBack} />
      <div className="w-full relative flex items-center justify-start mt-6 mb-4 pl-4">
        <h2 className="text-2xl font-extrabold text-white drop-shadow-md flex items-center gap-2">
            <PiChairBold className="text-[26px] text-violet-300" />
            <span>{titleText}</span>
        </h2>
        <div
          className="absolute right-4 flex items-center gap-4 
          bg-[#1C2437]/80 border border-[#2A3347] rounded-full 
          px-6 py-2 shadow-md shadow-black/20"
        >
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded" style={{ background: "#a8c7ff" }}></div>
            <span className="text-sm text-[#E9F0FF]">자유석</span>
          </div>

          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded" style={{ background: "#c0b6ff" }}></div>
            <span className="text-sm text-[#F0F6FF]">고정석</span>
          </div>

          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded" style={{ background: "#383e55" }}></div>
            <span className="text-sm text-[#8E97A8]">사용중</span>
          </div>
        </div>
      </div>

      {/* GRID */}
      <main className="flex-1 px-4 pb-6">
        <div
          className="w-full h-full grid rounded-2xl border border-[#2A3347] p-3 shadow-lg shadow-black/20"
          style={{
            gridTemplateColumns: `repeat(${FLOOR_PLAN[0].length}, 1fr)`,
            gridTemplateRows: `repeat(${FLOOR_PLAN.length}, 1fr)`,
            gap: "6px",
          }}
        >
          {loading ? (
            <div className="col-span-full flex justify-center items-center">
              <div className="animate-spin h-10 w-10 border-4 border-slate-700 border-t-blue-400 rounded-full" />
            </div>
          ) : (
            FLOOR_PLAN.map((row, r) =>
              row.map((id, c) => <div key={`${r}-${c}`}>{renderSeat(id)}</div>)
            )
          )}
        </div>
      </main>
    </div>
  );
};

export default KioskSeatStatus;