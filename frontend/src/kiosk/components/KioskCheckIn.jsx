import { useState } from "react";
import KioskLogin from "../screens/KioskLogin";
import KioskSeatStatus from "../screens/KioskSeatStatus";
import KioskAlertModal from "../components/KioskAlertModal"; // [추가]

function KioskCheckIn({ onHome }) {
    const [step, setStep] = useState("login");
    const [memberInfo, setMemberInfo] = useState(null);
    
    // [추가] 모달 상태
    const [modal, setModal] = useState({ isOpen: false, title: "", message: "", type: "warning", onOk: null });

    const closeModal = () => {
        setModal(prev => ({ ...prev, isOpen: false }));
        if (modal.onOk) modal.onOk(); // 확인 버튼 클릭 시 콜백 실행
    };

    const handleLoginSuccess = (memberData) => {
        console.log("로그인 정보 저장:", memberData);
        setMemberInfo(memberData);
        setStep("seat");
    };

    const handleSeatSelect = async (seat) => {
        if (!seat || !memberInfo) return;

        try {
            const res = await fetch("/api/kiosk/check-in", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    phone: memberInfo.phone,
                    seat_id: seat.seat_id,
                    order_id: null
                })
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.detail || "입실 처리에 실패했습니다.");
            }

            const data = await res.json();
            // [수정] alert -> modal
            setModal({
                isOpen: true,
                title: "입실 완료",
                message: `[회원] 입실 완료!\n좌석번호: ${data.seat_id}번\n즐거운 공부 되세요!`,
                type: "success",
                onOk: onHome // 확인 누르면 홈으로
            });

        } catch (e) {
            console.error(e);
            // [수정] alert -> modal
            setModal({
                isOpen: true,
                title: "입실 실패",
                message: e.message,
                type: "error",
                onOk: onHome
            });
        }
    };

    return (
        <>
            {step === "login" && (
                <KioskLogin 
                    onBack={onHome} 
                    onLoginSuccess={handleLoginSuccess} 
                />
            )}

            {step === "seat" && (
                <KioskSeatStatus 
                    onBack={() => setStep("login")}
                    onSeatSelect={handleSeatSelect}
                    excludePeriodType={false} 
                    memberInfo={memberInfo}   
                />
            )}

            {/* [추가] 모달 컴포넌트 */}
            <KioskAlertModal 
                isOpen={modal.isOpen}
                onClose={closeModal}
                title={modal.title}
                message={modal.message}
                type={modal.type}
            />
        </>
    );
}

export default KioskCheckIn;