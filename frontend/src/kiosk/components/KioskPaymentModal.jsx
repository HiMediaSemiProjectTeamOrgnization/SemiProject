import { useEffect, useState } from "react";
import { FaCreditCard, FaSpinner, FaCheckCircle, FaHome, FaExclamationCircle } from "react-icons/fa";

// ticket: 선택한 이용권 정보
// memberInfo: 회원 정보 (회원일 경우)
// phoneNumber: 입력한 전화번호 (비회원일 경우)
// onPaymentComplete: 결제 완료 후 실행될 함수 (결제 데이터 전달)
function KioskPaymentModal({ isOpen, onClose, ticket, memberInfo, phoneNumber, onPaymentComplete }) {
    const [paymentState, setPaymentState] = useState("ready"); // ready -> processing -> done -> error
    const [countdown, setCountdown] = useState(5);
    const [errorMessage, setErrorMessage] = useState("");
    const [resultData, setResultData] = useState(null); // 결제 결과 데이터 저장

    // 모달 초기화
    useEffect(() => {
        if (isOpen) {
            setPaymentState("ready");
            setCountdown(5);
            setErrorMessage("");
            setResultData(null);
        }
    }, [isOpen]);

    // 카운트다운 로직
    useEffect(() => {
        let timer;
        if (paymentState === "done") {
            timer = setInterval(() => {
                setCountdown((prev) => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        handleGoMain(); // 0초 되면 자동 이동
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [paymentState]);

    // [핵심] 결제 진행 (카드 투입 시 호출)
    const handleInsertCard = async () => {
        setPaymentState("processing");

        try {
            // 1. 요청 데이터 구성
            const payload = {
                product_id: ticket.product_id,
                member_id: memberInfo ? memberInfo.member_id : 1, // 회원이면 ID, 비회원이면 1 (Guest)
                phone: phoneNumber || null // 비회원이면 전화번호, 회원이면 null
            };

            console.log("결제 요청 데이터:", payload); // 디버깅용 로그

            // 2. API 호출
            // [수정] http://localhost:8000 을 명시하여 백엔드로 요청을 보냅니다.
            const response = await fetch("http://localhost:8000/api/kiosk/purchase", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (!response.ok) {
                // 백엔드에서 보낸 에러 메시지(detail)가 있으면 보여줌
                throw new Error(data.detail || `결제 실패 (오류코드: ${response.status})`);
            }

            // 3. 성공 처리
            // 너무 빨리 끝나면 어색하므로 최소 1초 대기 (UX)
            setTimeout(() => {
                setResultData(data); // 결과 데이터 저장
                setPaymentState("done");
            }, 1000);

        } catch (error) {
            console.error("Payment Error:", error);
            // 에러 메시지 상태 업데이트
            setErrorMessage(error.message || "서버와 연결할 수 없습니다.");
            setPaymentState("error");
        }
    };

    // 완료 후 메인/상위 컴포넌트로 이동
    const handleGoMain = () => {
        if (onPaymentComplete && resultData) {
            onPaymentComplete(resultData); // 결과 데이터를 상위로 전달
        } else if (onPaymentComplete) {
            onPaymentComplete();
        }
    };

    // 에러 발생 시 재시도
    const handleRetry = () => {
        setPaymentState("ready");
        setErrorMessage("");
    };

    if (!isOpen || !ticket) return null;

    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/90 backdrop-blur-md animate-fadeIn">
            <div className="w-full max-w-md bg-slate-800 rounded-[2.5rem] border border-slate-600 p-10 flex flex-col items-center text-center shadow-2xl relative overflow-hidden">
                
                {/* 닫기 버튼 (준비/에러 상태일 때만) */}
                {(paymentState === "ready" || paymentState === "error") && (
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

                    {/* 3. 결제 완료 */}
                    {paymentState === "done" && (
                        <div className="flex flex-col items-center animate-scaleUp w-full">
                            <FaCheckCircle className="text-7xl text-emerald-500 mb-4 drop-shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
                            <p className="text-3xl font-bold text-white mb-1">결제 완료</p>
                            <p className="text-slate-400 text-sm mb-6">이용권이 발급되었습니다.</p>
                            
                            <div className="bg-slate-800/80 rounded-2xl py-3 px-6 mb-4 border border-slate-600 w-full">
                                <p className="text-slate-300 font-medium">
                                    <span className="text-2xl font-bold text-blue-400 mr-1">{countdown}</span>
                                    초 후 메인으로 이동합니다
                                </p>
                            </div>

                            <button 
                                onClick={handleGoMain}
                                className="flex items-center gap-2 px-6 py-3 bg-slate-600 hover:bg-slate-500 text-white rounded-xl font-bold transition-all active:scale-95 shadow-md w-full justify-center"
                            >
                                <FaHome className="text-lg" />
                                처음으로
                            </button>
                        </div>
                    )}

                    {/* 4. 에러 발생 */}
                    {paymentState === "error" && (
                        <div className="flex flex-col items-center animate-bounceIn">
                            <FaExclamationCircle className="text-7xl text-rose-500 mb-6" />
                            <p className="text-xl font-bold text-white mb-2">결제 실패</p>
                            <p className="text-rose-300 text-sm mb-6 whitespace-pre-wrap">{errorMessage}</p>
                            
                            <button 
                                onClick={handleRetry}
                                className="px-6 py-3 bg-slate-600 hover:bg-slate-500 text-white rounded-xl font-bold shadow-lg active:scale-95 transition-all"
                            >
                                다시 시도
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