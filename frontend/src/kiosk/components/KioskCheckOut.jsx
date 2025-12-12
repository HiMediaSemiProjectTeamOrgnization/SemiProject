import { useState } from "react";
import KioskSeatStatus from "../screens/KioskSeatStatus";
import KioskPhoneInput from "../screens/KioskPhoneInput";
import KioskPinInput from "../screens/KioskPinInput";
import KioskAlertModal from "./KioskAlertModal";

// 시간 포맷팅 헬퍼 함수
const formatTime = (minutes) => {
    if (minutes === undefined || minutes === null) return "-";
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    
    if (h > 0) return `${h}시간 ${m}분`;
    return `${m}분`;
};

function KioskCheckOut({ onHome }) {
    const [step, setStep] = useState("seat"); 
    const [selectedSeat, setSelectedSeat] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    // 모달 상태
    const [modal, setModal] = useState({ 
        isOpen: false, 
        title: "", 
        message: "", 
        type: "warning", 
        imageUrl: null, 
        onOk: null,
        confirmText: null, 
        onConfirm: null    
    });

    const closeModal = () => {
        setModal(prev => ({ ...prev, isOpen: false }));
        if (modal.onOk) modal.onOk();
    };

    const handleSeatSelect = (seat) => {
        setSelectedSeat(seat);
        setStep("auth");
    };

    const handleCheckOutComplete = async (authData, forceCheckOut = false) => {
        if (!selectedSeat) {
            setModal({
                isOpen: true,
                title: "오류",
                message: "선택된 좌석 정보가 없습니다.",
                type: "error",
                onOk: onHome
            });
            return;
        }

        setIsLoading(true);

        const payload = {
            seat_id: selectedSeat.seat_id,
            phone: typeof authData === 'string' ? authData : null, 
            pin: typeof authData === 'number' ? authData : null,
            force: forceCheckOut 
        };

        try {
            const res = await fetch("/api/kiosk/check-out", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const errData = await res.json();
                
                if (errData.detail && typeof errData.detail === "object" && errData.detail.code === "DETECTED") {
                     setModal({
                        isOpen: true,
                        title: "짐이 감지되었습니다",
                        message: errData.detail.message + "\n\n그래도 퇴실하시겠습니까?",
                        imageUrl: errData.detail.image_url, 
                        type: "error",
                        confirmText: "확인했습니다 (퇴실하기)",
                        onConfirm: () => {
                            handleCheckOutComplete(authData, true);
                        }
                    });
                    setIsLoading(false); 
                    return; 
                }

                throw new Error(errData.detail || "퇴실 처리에 실패했습니다.");
            }

            const data = await res.json();
            
            // ------------------------------------------------------------------
            // [수정] 출석 여부에 따른 메시지 분기 처리
            // ------------------------------------------------------------------
            let resultMessage = `이용 시간: ${formatTime(data.time_used_minutes)}\n잔여 시간: ${formatTime(data.remaining_time_minutes)}`;

            // 1. 이번에 새로 출석 인정된 경우
            if (data.is_attended) {
                const today = new Date().toLocaleDateString('ko-KR', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                });
                resultMessage += `\n\n📅 ${today} 출석 완료!`;
            } 
            // 2. 이미 출석 기록이 있는 경우 (1시간 이상 이용했으나 중복인 경우)
            else if (data.already_attended) {
                resultMessage += `\n\n✅ 이미 출석되었습니다.`;
            }

            resultMessage += `\n안녕히 가세요!`;

            setModal({
                isOpen: true,
                title: "퇴실 완료",
                message: resultMessage,
                type: "success",
                onOk: onHome,
                onConfirm: null 
            });

        } catch (e) {
            console.error(e);
            setModal({
                isOpen: true,
                title: "퇴실 실패",
                message: e.message,
                type: "error",
                onConfirm: null
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            {isLoading && (
                <div style={{
                    position: "fixed",
                    top: 0, left: 0,
                    width: "100%", height: "100%",
                    backgroundColor: "rgba(0,0,0,0.6)",
                    zIndex: 9999,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white",
                    fontSize: "1.5rem",
                    fontWeight: "bold",
                    backdropFilter: "blur(5px)"
                }}>
                    <div className="text-6xl mb-4 animate-bounce">📷</div>
                    <div className="text-2xl">좌석을 확인하고 있습니다...</div>
                    <div className="text-lg mt-4 font-normal text-gray-300">
                        (두고 가는 짐이 없는지 확인 중)
                    </div>
                </div>
            )}

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

            <KioskAlertModal 
                isOpen={modal.isOpen}
                onClose={closeModal}
                title={modal.title}
                message={modal.message}
                type={modal.type}
                imageUrl={modal.imageUrl}
                onConfirm={modal.onConfirm}     
                confirmText={modal.confirmText} 
            />
        </>
    );
}

export default KioskCheckOut;