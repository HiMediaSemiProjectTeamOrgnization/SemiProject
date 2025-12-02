import { useLocation, useNavigate } from "react-router-dom";
import { FaCheckCircle, FaHome } from "react-icons/fa";

function PaymentSuccess() {
    const location = useLocation();
    const navigate = useNavigate();
    const { ticket, seat, order } = location.state;

    return (
        <div className="w-full min-h-screen flex flex-col justify-center items-center bg-gradient-to-b from-blue-50 to-blue-100 p-6">

            {/* 완료 아이콘 & 메시지 */}
            <div className="flex flex-col items-center mb-8">
                <FaCheckCircle className="text-9xl text-emerald-500 mb-4 drop-shadow-[0_0_20px_rgba(16,185,129,0.5)]" />
                <h1 className="text-4xl font-bold text-slate-800 mb-2">결제가 완료되었습니다!</h1>
                <p className="text-slate-600 text-lg">이용권이 정상적으로 발급되었습니다.</p>
            </div>

            {/* 주문 정보 */}
            <div className="w-full max-w-md bg-white rounded-2xl shadow-md p-6 mb-8 border border-slate-200 flex flex-col space-y-4">
                <div className="flex justify-between text-gray-700">
                    <span>티켓정보</span>
                    <span className="font-medium">[{ticket.type}] {ticket.name}</span>
                </div>
                {seat && (
                    <div className="flex justify-between text-gray-700">
                        <span>좌석</span>
                        <span className="font-medium">{seat.name}</span>
                    </div>
                )}
                <div className="flex justify-between text-gray-700">
                    <span>티켓가격</span>
                    <span className="font-medium">{Number(ticket.price).toLocaleString()}원</span>
                </div>
                <div className="flex justify-between text-gray-700">
                    <span>사용 마일리지</span>
                    <span className="font-medium">{Number(ticket.price - order.payment_amount).toLocaleString()}원</span>
                </div>
                <div className="border-t border-slate-200 pt-4 flex justify-between text-gray-900 font-semibold text-lg">
                    <span>총 결제금액</span>
                    <span>{Number(order.payment_amount).toLocaleString()}원</span>
                </div>
            </div>

            {/* 메인으로 돌아가기 버튼 */}
            <button onClick={() => navigate("/web")} className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold shadow-md transition-all active:scale-95" >
                <FaHome />
                메인으로 돌아가기
            </button>
        </div>
    );
}

export default PaymentSuccess;
