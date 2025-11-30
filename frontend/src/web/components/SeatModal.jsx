import { FaClock, FaCheckCircle } from 'react-icons/fa';

function SeatModal({ seat, endTime, onClose }) {
    return (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fadeIn">
            <div className="w-[400px] bg-white border-2 border-slate-300 rounded-[2rem] p-8 flex flex-col items-center shadow-2xl animate-scaleUp">

                <div className="mb-6 drop-shadow-lg text-6xl text-blue-500"><FaClock /></div>

                <h3 className="text-2xl font-bold text-slate-900 mb-3 text-center">{seat}번 자리</h3>

                <p className="text-slate-700 text-lg text-center mb-8 whitespace-pre-line leading-relaxed">예상 종료시간: {endTime ? endTime : "ERROR"}</p>

                <button onClick={onClose} className={` w-full py-4 rounded-xl text-xl font-bold text-white shadow-lg border-t border-white/10 transition-transform active:scale-95  bg-blue-600 hover:bg-blue-500 `} > 닫기 </button>
            </div>
        </div>
    );

}

export default SeatModal;