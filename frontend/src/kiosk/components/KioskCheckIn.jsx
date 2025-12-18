import { useState } from "react";
import KioskLogin from "../screens/KioskLogin";
import KioskSeatStatus from "../screens/KioskSeatStatus";
import KioskAlertModal from "../components/KioskAlertModal"; 

function KioskCheckIn({ onHome }) {
    const [step, setStep] = useState("login");
    const [memberInfo, setMemberInfo] = useState(null);
    const [modal, setModal] = useState({ isOpen: false, title: "", message: "", type: "warning", onOk: null });

    const closeModal = () => {
        setModal(prev => ({ ...prev, isOpen: false }));
        if (modal.onOk) modal.onOk();
    };

    const handleLoginSuccess = (memberData) => {
        setMemberInfo(memberData);
        setStep("seat");
    };

    const handleSeatSelect = async (seat) => {
        if (!seat || !memberInfo) return;
        try {
            const res = await fetch("/api/kiosk/check-in", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ phone: memberInfo.phone, seat_id: seat.seat_id, order_id: null })
            });
            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.detail || "입실 처리에 실패했습니다.");
            }
            const data = await res.json();
            setModal({ isOpen: true, title: "입실 완료", message: `[회원] 입실 완료!\n좌석번호: ${data.seat_id}번`, type: "success", onOk: onHome });
        } catch (e) {
            setModal({ isOpen: true, title: "입실 실패", message: e.message, type: "error", onOk: null });
        }
    };

    return (
        <>
            {step === "login" && (
                <KioskLogin 
                    mode="checkin" // [명시] 입실 모드 전달
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
            <KioskAlertModal isOpen={modal.isOpen} onClose={closeModal} title={modal.title} message={modal.message} type={modal.type} />
        </>
    );
}

export default KioskCheckIn;