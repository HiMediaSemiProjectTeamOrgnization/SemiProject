import { useLocation, useNavigate } from "react-router-dom";
import { FaCheckCircle, FaHome } from "react-icons/fa";

function PaymentSuccess() {
    const location = useLocation();
    const navigate = useNavigate();
    const { ticket, seat, order } = location.state;

    return (
        <div className="w-full min-h-screen flex flex-col justify-center items-center bg-slate-900 p-6 text-white">

            {/* 완료 아이콘 & 메시지 */}
            <div className="flex flex-col items-center mb-8">
                {/* 아이콘 색상을 에메랄드 대신 바이올렛으로 변경하여 다크 테마와 모던하게 어울리게 함 */}
                <FaCheckCircle className="text-9xl text-violet-500 mb-4 drop-shadow-[0_0_20px_rgba(139,92,246,0.5)]" />
                <h1 className="text-4xl font-extrabold text-white tracking-tight mb-2">결제가 완료되었습니다!</h1>
                <p className="text-slate-400 text-lg">이용권이 정상적으로 발급되었습니다.</p>
            </div>

            {/* 주문 정보 */}
            {/* 배경을 어둡게, 둥근 모서리를 줄여 모던한 느낌을 강조, 그림자를 미니멀하게 변경 */}
            <div className="w-full max-w-md bg-slate-800 rounded-xl shadow-xl p-6 mb-8 border border-slate-700 flex flex-col space-y-4">
                {/* 텍스트 색상을 대비되게 변경 */}
                <div className="flex justify-between text-slate-300">
                    <span>티켓정보</span>
                    <span className="font-semibold text-white">[{ticket.type}] {ticket.name}</span>
                </div>
                {seat && (
                    <div className="flex justify-between text-slate-300">
                        <span>좌석</span>
                        <span className="font-semibold text-white">{seat.seat_id}</span>
                    </div>
                )}
                <div className="flex justify-between text-slate-300">
                    <span>티켓가격</span>
                    <span className="font-semibold text-white">{Number(ticket.price).toLocaleString()}원</span>
                </div>
                <div className="flex justify-between text-slate-300">
                    <span>사용 마일리지</span>
                    <span className="font-semibold text-violet-400">{Number(ticket.price - order.payment_amount).toLocaleString()}원</span>
                </div>
                {/* 구분선 색상 변경 및 최종 결제 금액 강조 */}
                <div className="border-t border-slate-700 pt-4 flex justify-between text-white font-extrabold text-xl">
                    <span>총 결제금액</span>
                    <span className="text-violet-400">{Number(order.payment_amount).toLocaleString()}원</span>
                </div>
            </div>

            <button onClick={() => navigate("/web")} className="flex items-center gap-2 px-8 py-3 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-bold shadow-lg shadow-violet-900/50 transition-all duration-200 active:scale-[0.98] active:shadow-none" >
                <FaHome />
                메인으로 돌아가기
            </button>
        </div>
    );
}

export default PaymentSuccess;
