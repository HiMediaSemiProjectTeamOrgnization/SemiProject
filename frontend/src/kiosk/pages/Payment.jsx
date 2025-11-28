import { useState } from "react";
import { FaCheckCircle, FaCreditCard, FaSpinner, FaHome, FaTicketAlt } from "react-icons/fa";

function Payment({ onBack, onHome, onReselect, product, phoneNumber, pin, onComplete }) {
    const [status, setStatus] = useState("ready"); // ready, processing, success, error
    const [orderInfo, setOrderInfo] = useState(null); // 주문 정보 저장
    const [errorMessage, setErrorMessage] = useState("");
    const API_BASE_URL = "http://localhost:8080/api/kiosk";

    const handlePay = async () => {
        if (!product || !phoneNumber) return;

        setStatus("processing");
        setErrorMessage("");

        try {
            const body = {
                phone: phoneNumber,
                product_id: product.product_id,
                // 회원일 경우에만 pin을 포함
                ...(pin && { pin: pin }), 
            };
            
            // 1. 이용권 구매 API 호출
            const purchaseRes = await fetch(`${API_BASE_URL}/purchase`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            const purchaseData = await purchaseRes.json();

            if (!purchaseRes.ok) {
                // API에서 발생한 오류 메시지 사용
                const detail = purchaseData.detail || "결제 중 알 수 없는 오류가 발생했습니다. (오류 코드: " + purchaseRes.status + ")";
                throw new Error(detail);
            }
            
            setOrderInfo(purchaseData);

            // 2. 결제 완료 처리 시뮬레이션
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            setStatus("success");
            
            // 3. 2초 후 메인으로 이동
            setTimeout(() => {
                onComplete();
            }, 2000);

        } catch (error) {
            console.error("결제 실패:", error.message);
            setErrorMessage(error.message);
            setStatus("error");
        }
    };
    
    // 결제 성공 화면
    const SuccessView = () => (
        <div className="text-center p-8 bg-white rounded-lg shadow-lg">
            <FaCheckCircle className="text-green-500 text-6xl mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-gray-800 mb-2">결제가 완료되었습니다!</h2>
            <p className="text-gray-600 mb-6">잠시 후 메인 화면으로 이동합니다.</p>
            
            {orderInfo && (
                <div className="bg-green-50 p-4 rounded-lg text-left inline-block border border-green-200">
                    <p className="font-semibold text-green-700 mb-2">✅ 주문 정보</p>
                    <p className="text-gray-700">상품: <span className="font-bold">{orderInfo.product_name}</span></p>
                    <p className="text-gray-700">금액: <span className="font-bold">{Number(orderInfo.price).toLocaleString()}원</span></p>
                    <p className="text-gray-700">주문번호: {orderInfo.order_id}</p>
                </div>
            )}
        </div>
    );

    // 결제 오류 화면
    const ErrorView = () => (
        <div className="text-center p-8 bg-white rounded-lg shadow-lg">
            <FaCheckCircle className="text-red-500 text-6xl mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-gray-800 mb-2">결제 실패</h2>
            <p className="text-red-600 font-bold mb-4 border border-red-300 bg-red-50 p-3 rounded-md">{errorMessage}</p>
            <p className="text-gray-600 mb-6">결제 정보를 다시 확인하거나 메인으로 돌아가주세요.</p>
            <div className="flex flex-col space-y-3">
                <button 
                    onClick={() => setStatus("ready")}
                    className="bg-blue-600 text-white text-lg py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors"
                >
                    <FaCreditCard className="inline-block mr-2" /> 다시 결제 시도
                </button>
                <button 
                    onClick={onHome}
                    className="bg-gray-500 text-white text-lg py-3 rounded-lg font-bold hover:bg-gray-600 transition-colors"
                >
                    <FaHome className="inline-block mr-2" /> 메인으로 돌아가기
                </button>
            </div>
        </div>
    );
    
    // Ready View
    const ReadyView = () => (
        <div>
            <div className="text-center">
                <h2 className="text-3xl font-bold text-gray-800 mb-6">결제 정보를 확인해주세요</h2>
            </div>
            <div className="border p-6 rounded-lg mb-8 bg-white shadow-sm">
                <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600 font-medium">상품명</span>
                    <span className="text-gray-800 font-semibold">{product.name}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600 font-medium">전화번호</span>
                    <span className="text-gray-800 font-semibold">{phoneNumber}</span>
                </div>
                {pin && (
                    <div className="flex justify-between py-2 border-b">
                        <span className="text-gray-600 font-medium">PIN</span>
                        <span className="text-gray-800 font-semibold">●●●●</span>
                    </div>
                )}
                <div className="flex justify-between py-2 mt-4">
                    <span className="text-2xl text-gray-800 font-bold">결제 금액</span>
                    <span className="text-2xl text-blue-600 font-bold">{Number(product.price).toLocaleString()}원</span>
                </div>
            </div>
            <div className="space-y-3">
                <button 
                    onClick={handlePay}
                    className="w-full bg-blue-600 text-white text-xl py-4 rounded-lg font-bold hover:bg-blue-700 transition-colors"
                >
                    <FaCreditCard className="inline-block mr-2" /> 카드 결제하기
                </button>
                
                <button 
                    onClick={onReselect}
                    className="w-full bg-gray-200 text-gray-700 text-lg py-3 rounded-lg font-bold hover:bg-gray-300 transition-colors"
                >
                    <FaTicketAlt className="inline-block mr-2" /> 이용권 다시 선택
                </button>

                <button 
                    onClick={onHome}
                    className="w-full bg-red-500 text-white text-lg py-3 rounded-lg font-bold hover:bg-red-600 transition-colors"
                >
                    <FaHome className="inline-block mr-2" /> 취소하고 메인으로 돌아가기
                </button>
            </div>
        </div>
    );

    return (
        <div className="p-8 max-w-lg mx-auto bg-gray-50 min-h-screen flex items-center justify-center">
            <div className="w-full">
                
                {status === "ready" && <ReadyView />}

                {status === "processing" && (
                    <div className="text-center p-8 bg-white rounded-lg shadow-lg">
                        <FaSpinner className="text-blue-500 text-6xl mx-auto mb-4 animate-spin" />
                        <h2 className="text-3xl font-bold text-gray-800 mb-2">결제가 진행 중입니다</h2>
                        <p className="text-gray-600">카드를 뽑지 말고 잠시만 기다려주세요.</p>
                    </div>
                )}

                {status === "success" && <SuccessView />}
                {status === "error" && <ErrorView />}

            </div>
        </div>
    );
}

export default Payment;