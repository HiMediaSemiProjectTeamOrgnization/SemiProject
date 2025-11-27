import { useState } from "react";
import { FaCheckCircle, FaCreditCard, FaSpinner, FaHome, FaTicketAlt } from "react-icons/fa";

function Payment({ onBack, onHome, onReselect, product, phoneNumber, pin, onComplete }) {
    const [status, setStatus] = useState("ready");

    const handlePay = () => {
        setStatus("processing");
        setTimeout(() => {
            setStatus("success");
            setTimeout(() => {
                onComplete();
            }, 2000);
        }, 2000);
    };

    return (
        <div>
            
            {status === "ready" && (
                <div>
                    <div>
                        <h2>결제 정보를 확인해주세요</h2>
                    </div>
                    <div>
                        <div>
                            <span>상품명</span>
                            <span>{product.name}</span>
                        </div>
                        <div>
                            <span>전화번호</span>
                            <span>{phoneNumber}</span>
                        </div>
                        <div>
                            <span>결제 금액</span>
                            <span>{Number(product.price).toLocaleString()}원</span>
                        </div>
                    </div>
                    <div>
                        <button onClick={handlePay}>
                            <FaCreditCard /> 카드 결제하기
                        </button>
                        
                        <button onClick={onReselect}>
                            <FaTicketAlt /> 이용권 다시 선택
                        </button>

                        <button onClick={onHome}>
                            <FaHome /> 취소하고 메인으로 돌아가기
                        </button>
                    </div>
                </div>
            )}

            {status === "processing" && (
                <div>
                    <FaSpinner />
                    <h2>결제가 진행 중입니다</h2>
                    <p>카드를 뽑지 말고 잠시만 기다려주세요.</p>
                </div>
            )}

            {status === "success" && (
                <div>
                    <FaCheckCircle />
                    <h2>결제가 완료되었습니다!</h2>
                    <p>잠시 후 메인 화면으로 이동합니다.</p>
                </div>
            )}
        </div>
    );
}

export default Payment;
