import { useEffect, useState, useRef } from "react"; // <--- useRef 추가
import { FaCreditCard, FaSpinner, FaCheckCircle, FaHome } from "react-icons/fa";

function KioskPaymentModal({ isOpen, onClose, ticket, onPaymentComplete }) {
    const [paymentState, setPaymentState] = useState("ready"); // ready -> processing -> done
    const [countdown, setCountdown] = useState(5); // 카운트다운 상태
    const timerRef = useRef(null); // <--- 타이머 ID 관리를 위해 useRef 추가

       const completedRef = useRef(false);

    useEffect(() => {
        if (isOpen) {
            setPaymentState("ready");
            setCountdown(5);
            completedRef.current = false;   // 🔥 모달이 열릴 때 플래그 초기화

            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
        }
    }, [isOpen]);

    useEffect(() => {
        if (paymentState === "done") {
            timerRef.current = setInterval(() => {
                setCountdown(prev => {
                    if (prev <= 1) {
                        clearInterval(timerRef.current);
                        timerRef.current = null;

                        // 🔥 중복 실행 방지
                        if (!completedRef.current) {
                            completedRef.current = true;
                            onPaymentComplete();
                        }

                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }

        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
        };
    }, [paymentState, onPaymentComplete]);

    // 카드 투입 시뮬레이션
    const handleInsertCard = () => {
        setPaymentState("processing");
        
        // 2초 후 결제 완료 상태로 변경
        setTimeout(() => {
            setPaymentState("done");
        }, 2000);
    };

      const handleGoMain = () => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }

        // 🔥 이미 한 번 실행했으면 무시
        if (completedRef.current) return;

        completedRef.current = true;   // 실행 플래그 설정
        onPaymentComplete();
    };

    if (!isOpen || !ticket) return null;

    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/90 backdrop-blur-md animate-fadeIn">
            <div className="w-full max-w-md bg-slate-800 rounded-[2.5rem] border border-slate-600 p-10 flex flex-col items-center text-center shadow-2xl relative overflow-hidden">
                
                {/* 닫기/취소 버튼 (결제 준비 상태일 때만 표시) */}
                {paymentState === "ready" && (
                    <button 
                        onClick={onClose}
                        className="absolute top-6 right-6 text-slate-400 hover:text-white transition-colors"
                    >
                        취소
                    </button>
                )}

                <h3 className="text-xl text-slate-400 font-medium mb-2">결제 금액</h3>
                <div className="text-5xl font-extrabold text-white mb-10 tracking-tight">
                    {ticket.price.toLocaleString()}<span className="text-2xl text-blue-400 ml-1">원</span>
                </div>

                <div className="w-full bg-slate-700/50 rounded-3xl p-8 mb-8 border border-slate-600/50 min-h-[18rem] flex flex-col items-center justify-center transition-all duration-300">
                    
                    {/* 1. 결제 준비 */}
                    {paymentState === "ready" && (
                        <div className="animate-bounceIn flex flex-col items-center">
                            <FaCreditCard className="text-7xl text-blue-400 mb-6 drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
                            <p className="text-xl font-bold text-white mb-2">신용카드를 넣어주세요</p>
                            <p className="text-slate-400 text-sm">삼성페이 / LG페이 가능</p>
                            
                            <button 
                                onClick={handleInsertCard}
                                className="mt-8 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold shadow-lg active:scale-95 transition-all"
                            >
                                [ 시뮬레이션: 카드 투입 ]
                            </button>
                        </div>
                    )}

                    {/* 2. 결제 진행 중 */}
                    {paymentState === "processing" && (
                        <div className="flex flex-col items-center">
                            <FaSpinner className="text-6xl text-blue-500 animate-spin mb-6" />
                            <p className="text-xl font-bold text-white">결제 승인 중입니다...</p>
                            <p className="text-slate-400 text-sm mt-2">카드를 제거하지 마세요.</p>
                        </div>
                    )}

                    {/* 3. 결제 완료 및 카운트다운 */}
                    {paymentState === "done" && (
                        <div className="flex flex-col items-center animate-scaleUp w-full">
                            <FaCheckCircle className="text-7xl text-emerald-500 mb-4 drop-shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
                            <p className="text-3xl font-bold text-white mb-1">결제 완료</p>
                            <p className="text-slate-400 text-sm mb-6">이용권이 발급되었습니다.</p>
                            
                            {/* 카운트다운 표시 */}
                            <div className="bg-slate-800/80 rounded-2xl py-3 px-6 mb-4 border border-slate-600 w-full">
                                <p className="text-slate-300 font-medium">
                                    <span className="text-2xl font-bold text-blue-400 mr-1">{countdown}</span>
                                    초 후 메인으로 이동합니다
                                </p>
                            </div>

                            {/* 즉시 이동 버튼 */}
                            <button 
                                onClick={handleGoMain}
                                className="flex items-center gap-2 px-6 py-3 bg-slate-600 hover:bg-slate-500 text-white rounded-xl font-bold transition-all active:scale-95 shadow-md w-full justify-center"
                            >
                                <FaHome className="text-lg" />
                                처음으로
                            </button>
                        </div>
                    )}
                </div>

                <div className="text-slate-500 text-sm font-medium tracking-wide">
                    {ticket.name}
                </div>
            </div>
        </div>
    );
}

export default KioskPaymentModal;