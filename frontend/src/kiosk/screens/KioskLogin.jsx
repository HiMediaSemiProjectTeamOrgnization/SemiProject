import { useState } from "react";
import KioskHeader from "../components/KioskHeader";
import KioskAlertModal from "../components/KioskAlertModal"; // 모달 컴포넌트 import
import { FaDeleteLeft, FaCheck } from "react-icons/fa6";

function KioskLogin({ onBack, onLoginSuccess }) {
    const [phoneNumber, setPhoneNumber] = useState("");
    const [pin, setPin] = useState("");
    const [focusTarget, setFocusTarget] = useState("phone");

    // 모달 상태 관리
    const [modal, setModal] = useState({
        isOpen: false,
        title: "",
        message: "",
        type: "warning"
    });

    // 모달 닫기 함수
    const closeModal = () => {
        setModal(prev => ({ ...prev, isOpen: false }));
    };

    // 키패드 입력 처리
    const handleNumClick = (num) => {
        if (focusTarget === "phone") {
            if (phoneNumber.length < 8) {
                const newPhone = phoneNumber + num;
                setPhoneNumber(newPhone);
                if (newPhone.length === 8) {
                    setFocusTarget("pin");
                }
            }
        } else {
            if (pin.length < 4) setPin(prev => prev + num);
        }
    };

    const handleDelete = () => {
        if (focusTarget === "phone") {
            setPhoneNumber(prev => prev.slice(0, -1));
        } else {
            if (pin.length === 0) {
                setFocusTarget("phone");
                setPhoneNumber(prev => prev.slice(0, -1));
            } else {
                setPin(prev => prev.slice(0, -1));
            }
        }
    };

    const handleLogin = () => {
        if (phoneNumber.length < 8 || pin.length < 4) {
            setModal({
                isOpen: true,
                title: "입력 정보 확인",
                message: "전화번호와 PIN 번호를\n모두 입력해 주세요.",
                type: "warning"
            });
            return;
        }
        // 임시
        console.log(`로그인 시도: 010-${phoneNumber.slice(0,4)}-${phoneNumber.slice(4,8)} / PIN: ${pin}`);
        onLoginSuccess();
    };

    return (
        <div className="min-h-screen bg-slate-900 flex flex-col font-sans text-white select-none">
            <KioskHeader backButton={true} onBack={onBack} />

            <main className="flex-1 flex flex-col items-center justify-center p-8 gap-10">
                <div className="text-center space-y-2">
                    <h2 className="text-4xl font-bold text-white">회원 로그인</h2>
                    <p className="text-slate-400">휴대폰 번호와 PIN 번호를 입력해 주세요.</p>
                </div>
                
                {/* 입력 필드 영역 */}
                <div className="flex flex-col gap-6 w-full max-w-lg">
                    {/* 전화번호 입력 */}
                    <div 
                        onClick={() => setFocusTarget("phone")}
                        className={`
                            flex items-center justify-center bg-slate-800 h-20 rounded-2xl border-2 transition-all cursor-pointer shadow-inner
                            ${focusTarget === "phone" ? "border-blue-500 ring-2 ring-blue-500/20" : "border-slate-700"}
                        `}
                    >
                        <span className="text-3xl text-slate-400 font-medium">010</span>
                        <span className="text-2xl text-slate-600 mx-4 font-light">-</span>
                        
                        {/* 가운데 번호 4자리 */}
                        <div className="w-24 text-center">
                            <span className={`text-3xl font-bold tracking-widest ${phoneNumber.length > 0 ? "text-white" : "text-slate-700"}`}>
                                {phoneNumber.slice(0, 4).padEnd(4, ' ')}
                            </span>
                        </div>

                        <span className="text-2xl text-slate-600 mx-4 font-light">-</span>
                        
                        {/* 마지막 번호 4자리 */}
                        <div className="w-24 text-center">
                            <span className={`text-3xl font-bold tracking-widest ${phoneNumber.length > 4 ? "text-white" : "text-slate-700"}`}>
                                {phoneNumber.slice(4, 8).padEnd(4, ' ')}
                            </span>
                        </div>
                    </div>

                    {/* PIN 번호 입력 */}
                    <div 
                        onClick={() => setFocusTarget("pin")}
                        className={`
                            flex items-center justify-between bg-slate-800 h-20 px-8 rounded-2xl border-2 transition-all cursor-pointer shadow-inner
                            ${focusTarget === "pin" ? "border-blue-500 ring-2 ring-blue-500/20" : "border-slate-700"}
                        `}
                    >
                        <span className="text-xl text-slate-400 font-medium">PIN 번호 (4자리)</span>
                        <span className="text-5xl font-bold tracking-[1.5rem] text-white h-10 mt-[-10px]">
                            {"•".repeat(pin.length)}
                        </span>
                    </div>
                </div>

                {/* 키패드 */}
                <div className="grid grid-cols-3 gap-4 w-full max-w-md mt-2">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                        <KeypadButton key={num} onClick={() => handleNumClick(num)}>{num}</KeypadButton>
                    ))}
                    <KeypadButton onClick={handleDelete} color="bg-rose-900/50 border-rose-800 text-rose-200 active:bg-rose-800">
                        <FaDeleteLeft />
                    </KeypadButton>
                    <KeypadButton onClick={() => handleNumClick(0)}>0</KeypadButton>
                    <KeypadButton onClick={handleLogin} color="bg-blue-600 border-blue-500 text-white active:bg-blue-500">
                        <FaCheck />
                    </KeypadButton>
                </div>
            </main>

            {/* 모달 컴포넌트 렌더링 */}
            <KioskAlertModal 
                isOpen={modal.isOpen}
                onClose={closeModal}
                title={modal.title}
                message={modal.message}
                type={modal.type}
            />
        </div>
    );
}

function KeypadButton({ children, onClick, color = "bg-slate-800 border-slate-700 text-white active:bg-slate-700" }) {
    return (
        <button 
            onClick={onClick}
            className={`
                h-20 text-3xl font-bold rounded-2xl border shadow-lg
                flex items-center justify-center transition-all duration-100 active:scale-95
                ${color}
            `}
        >
            {children}
        </button>
    );
}

export default KioskLogin;