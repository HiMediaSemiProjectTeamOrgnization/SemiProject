import { useState } from "react";
import KioskSeatStatus from "../screens/KioskSeatStatus";
import KioskPhoneInput from "../screens/KioskPhoneInput";
import KioskPinInput from "../screens/KioskPinInput";
import KioskAlertModal from "./KioskAlertModal";

function KioskCheckOut({ onHome }) {
    const [step, setStep] = useState("seat"); 
    const [selectedSeat, setSelectedSeat] = useState(null);
    
    // 로딩 상태 (좌석 촬영 및 AI 분석 대기용)
    const [isLoading, setIsLoading] = useState(false);

    // 모달 상태
    const [modal, setModal] = useState({ 
        isOpen: false, 
        title: "", 
        message: "", 
        type: "warning", 
        imageUrl: null, 
        onOk: null,
        confirmText: null, // 강제 퇴실 버튼 텍스트
        onConfirm: null    // 강제 퇴실 실행 함수
    });

    const closeModal = () => {
        setModal(prev => ({ ...prev, isOpen: false }));
        if (modal.onOk) modal.onOk();
    };

    const handleSeatSelect = (seat) => {
        setSelectedSeat(seat);
        setStep("auth");
    };

    /**
     * 퇴실 요청 함수
     * @param {string|number} authData - 전화번호(string) 또는 PIN(number)
     * @param {boolean} forceCheckOut - 강제 퇴실 여부 (true면 짐 감지 무시)
     */
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

        // 1. 로딩 시작
        setIsLoading(true);

        const payload = {
            seat_id: selectedSeat.seat_id,
            phone: typeof authData === 'string' ? authData : null, 
            pin: typeof authData === 'number' ? authData : null,
            force: forceCheckOut // [핵심] 강제 퇴실 여부 전송
        };

        try {
            const res = await fetch("/api/kiosk/check-out", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            // 2. 응답 처리 (실패 시)
            if (!res.ok) {
                const errData = await res.json();
                
                // [CASE 1] 짐 감지 에러 (code가 DETECTED)
                if (errData.detail && typeof errData.detail === "object" && errData.detail.code === "DETECTED") {
                     setModal({
                        isOpen: true,
                        title: "짐이 감지되었습니다",
                        message: errData.detail.message + "\n\n그래도 퇴실하시겠습니까?", // 안내 메시지 추가
                        imageUrl: errData.detail.image_url, // 감지된 사진 URL
                        type: "error",
                        
                        // [핵심] '확인했습니다' 버튼 설정
                        confirmText: "확인했습니다 (퇴실하기)",
                        onConfirm: () => {
                            // 버튼 클릭 시 force=true로 다시 요청
                            handleCheckOutComplete(authData, true);
                        }
                    });
                    setIsLoading(false); // 여기서 리턴하므로 로딩 수동 종료
                    return; 
                }

                // [CASE 2] 일반 에러
                throw new Error(errData.detail || "퇴실 처리에 실패했습니다.");
            }

            // 3. 성공 시 처리
            const data = await res.json();
            
            setModal({
                isOpen: true,
                title: "퇴실 완료",
                message: `이용 시간: ${data.time_used_minutes}분\n잔여 시간: ${data.remaining_time_minutes}분\n안녕히 가세요!`,
                type: "success",
                onOk: onHome,
                onConfirm: null // 성공 시에는 확인 버튼 하나만
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
            // 4. 로딩 종료 (성공이든 실패든 무조건 실행, 위에서 return한 경우 제외)
            setIsLoading(false);
        }
    };

    return (
        <>
            {/* 로딩 오버레이: AI 분석 중일 때 화면을 막음 */}
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

            {/* 모달 컴포넌트 */}
            <KioskAlertModal 
                isOpen={modal.isOpen}
                onClose={closeModal}
                title={modal.title}
                message={modal.message}
                type={modal.type}
                imageUrl={modal.imageUrl}
                onConfirm={modal.onConfirm}     // 강제 퇴실 함수 전달
                confirmText={modal.confirmText} // 버튼 텍스트 전달
            />
        </>
    );
}

export default KioskCheckOut;