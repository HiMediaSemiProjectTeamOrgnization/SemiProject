import { useState } from "react";
import KioskSeatStatus from "../screens/KioskSeatStatus";
import KioskPhoneInput from "../screens/KioskPhoneInput";
import KioskPinInput from "../screens/KioskPinInput";
import KioskAlertModal from "./KioskAlertModal"; // [추가]

function KioskCheckOut({ onHome }) {
    const [step, setStep] = useState("seat"); 
    const [selectedSeat, setSelectedSeat] = useState(null);
    
    // [추가] 모달 상태
    const [modal, setModal] = useState({ isOpen: false, title: "", message: "", type: "warning", onOk: null });

    const closeModal = () => {
        setModal(prev => ({ ...prev, isOpen: false }));
        if (modal.onOk) modal.onOk();
    };

    const handleSeatSelect = (seat) => {
        setSelectedSeat(seat);
        setStep("auth");
    };

    const handleCheckOutComplete = async (authData) => {
        if (!selectedSeat) {
            // [수정] alert -> setModal
            setModal({
                isOpen: true,
                title: "오류",
                message: "선택된 좌석 정보가 없습니다.",
                type: "error",
                onOk: onHome
            });
            return;
        }

        const payload = {
            seat_id: selectedSeat.seat_id,
            phone: typeof authData === 'string' ? authData : null, 
            pin: typeof authData === 'number' ? authData : null    
        };

        try {
            const res = await fetch("/api/kiosk/check-out", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.detail || "퇴실 처리에 실패했습니다.");
            }

            const data = await res.json();
            
            // [수정] alert -> setModal (성공)
            setModal({
                isOpen: true,
                title: "퇴실 완료",
                message: `이용 시간: ${data.time_used_minutes}분\n잔여 시간: ${data.remaining_time_minutes}분\n안녕히 가세요!`,
                type: "success",
                onOk: onHome
            });

        } catch (e) {
            console.error(e);
            // [수정] alert -> setModal (실패)
            setModal({
                isOpen: true,
                title: "퇴실 실패",
                message: e.message,
                type: "error"
            });
        }
    };

    return (
        <>
            {step === "seat" && (
                <KioskSeatStatus 
                    onBack={onHome}
                    onSeatSelect={handleSeatSelect}
                    excludePeriodType={false}
                    isCheckOutMode={true} 
                />
            )}

            {step === "auth" && (
                selectedSeat?.role === 'guest' ? (
                    <KioskPhoneInput 
                        onBack={() => setStep("seat")}
                        onComplete={(res, phone) => handleCheckOutComplete(phone)}
                        mode="checkout"
                    />
                ) : (
                    <KioskPinInput 
                        onBack={() => setStep("seat")}
                        onComplete={(pin) => handleCheckOutComplete(pin)}
                    />
                )
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

export default KioskCheckOut;