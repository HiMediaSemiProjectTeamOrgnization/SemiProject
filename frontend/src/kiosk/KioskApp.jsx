import { useState } from "react";
import { FaTicketAlt, FaSignInAlt, FaSignOutAlt, FaChevronRight } from "react-icons/fa";
import { PiChairBold } from "react-icons/pi";
import KioskHeader from "./components/KioskHeader";
import KioskSelectUser from "./screens/KioskUserSelect";
import KioskLogin from "./screens/KioskLogin";
import KioskTicketList from "./screens/KioskTicketList";
import KioskPhoneInput from "./screens/KioskPhoneInput";

function KioskApp() {
    const [currentPage, setCurrentPage] = useState("home");
    const [userType, setUserType] = useState(null);
    const [selectedTicket, setSelectedTicket] = useState(null);

    const goToHome = () => {
        setCurrentPage("home");
        setUserType(null);
        setSelectedTicket(null);
    };

    // 1. 이용권 구매 클릭 -> 유저 선택
    const goToSelectUser = () => setCurrentPage("select-user");

    // 2. 유저 유형 선택 처리
    const handleUserSelect = (type) => {
        setUserType(type);
        if (type === "member") {
            setCurrentPage("member-login"); // 회원은 로그인 화면으로
        } else {
            setCurrentPage("ticket-list");  // 비회원은 바로 티켓 목록으로
        }
    };

    // 3. 회원 로그인 성공 처리
    const handleLoginSuccess = () => {
        // 로그인 정보 저장 로직 필요
        setCurrentPage("ticket-list"); // 로그인 성공 후 티켓 목록으로
    };

    // 4. 티켓 목록에서 "결제하기" 클릭 처리
    const handlePaymentRequest = (ticket) => {
        setSelectedTicket(ticket);

        if (userType === "member") {
            // 회원은 TicketList에서 결제까지 완료하고 여기로 옴
            alert(`[회원] ${ticket.name} 결제 및 등록 완료!`);
            goToHome();
        } else {
            // 비회원은 아직 결제 안 함 -> 전화번호 입력 화면으로 이동
            setCurrentPage("phone-input");
        }
    };

    // 5. 비회원 전화번호 입력 및 결제 완료 처리
    const handleNonMemberInfoComplete = (phoneNumber) => {
        // 비회원은 PhoneInput에서 결제까지 완료하고 여기로 옴
        console.log("비회원 정보:", phoneNumber, "선택 티켓:", selectedTicket);
        // 최종 데이터베이스 저장 로직 (API 호출)
        alert(`[비회원] ${selectedTicket.name}\n번호: ${phoneNumber}\n이용권 발급이 완료되었습니다.`);
        goToHome();
    };

    // --- 화면 렌더링 분기 ---
    if (currentPage === "select-user") {
        return (
            <KioskSelectUser 
                onBack={goToHome} 
                onSelectMember={() => handleUserSelect("member")}
                onSelectNonMember={() => handleUserSelect("non-member")}
            />
        );
    }

    if (currentPage === "member-login") {
        return (
            <KioskLogin 
                onBack={goToSelectUser} 
                onLoginSuccess={handleLoginSuccess} 
            />
        );
    }

    if (currentPage === "ticket-list") {
        return (
            <KioskTicketList 
                onBack={goToSelectUser} 
                userType={userType}
                onPaymentRequest={handlePaymentRequest}
            />
        );
    }

    if (currentPage === "phone-input") {
        return (
            <KioskPhoneInput 
                onBack={() => setCurrentPage("ticket-list")} 
                onComplete={handleNonMemberInfoComplete} 
                ticket={selectedTicket}
            />
        );
    }

    return (
        <div className="min-h-screen bg-slate-900 flex flex-col select-none overflow-hidden font-sans text-white">
            <KioskHeader backButton={false} />

            <main className="flex-1 flex flex-col p-8 gap-10 container mx-auto max-w-6xl justify-center">
                <div className="flex justify-between items-center px-4">
                    <div className="text-left">
                        <h2 className="text-5xl font-extrabold mb-2 py-2 pr-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-200 via-white to-blue-200 tracking-tight">
                            Welcome to High Study
                        </h2>
                        <p className="text-xl text-slate-400 font-light">
                            <span className="text-blue-300 font-medium">원하시는 서비스를 선택해 주십시오.</span>
                        </p>
                    </div>

                    <button className="group relative w-80 h-24 rounded-2xl overflow-hidden shadow-xl transition-all duration-200 active:scale-95 border border-white/10 bg-slate-800/50 backdrop-blur-md">
                        <div className="absolute inset-0 bg-gradient-to-r from-violet-600/10 to-transparent group-active:from-violet-600/30 transition-all"></div>
                        <div className="relative h-full flex items-center justify-between px-6 z-10">
                            <div className="flex flex-col items-start gap-1">
                                <h3 className="text-2xl font-bold text-white tracking-tight group-active:text-violet-200 transition-colors">
                                    좌석 현황 확인
                                </h3>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-violet-500/20 flex items-center justify-center border border-violet-500/30 shadow-inner group-active:bg-violet-500 group-active:text-white transition-all">
                                    <PiChairBold className="text-xl text-violet-300 group-active:text-white" />
                                </div>
                                <FaChevronRight className="text-slate-500 text-sm group-active:translate-x-1 transition-transform" />
                            </div>
                        </div>
                    </button>
                </div>

                <div className="grid grid-cols-3 gap-8 h-96">
                    <MainActionButton 
                        title="이용권 구매" 
                        sub="Ticket"
                        icon={<FaTicketAlt />} 
                        gradient="from-blue-600 to-blue-800"
                        accentColor="bg-blue-500"
                        onClick={goToSelectUser} 
                    />
                    <MainActionButton 
                        title="입실" 
                        sub="Check In"
                        icon={<FaSignInAlt />} 
                        gradient="from-emerald-600 to-emerald-800"
                        accentColor="bg-emerald-500"
                    />
                    <MainActionButton 
                        title="퇴실" 
                        sub="Check Out"
                        icon={<FaSignOutAlt />} 
                        gradient="from-rose-600 to-rose-800"
                        accentColor="bg-rose-500"
                    />
                </div>
            </main>

            <footer className="p-6 text-center text-slate-500 text-sm font-light">
                <span className="inline-block px-3 py-1 rounded-full bg-slate-800 border border-slate-700">
                    High Study Cafe System ⓒ Team CUBE
                </span>
            </footer>
        </div>
    );
}

function MainActionButton({ title, sub, icon, gradient, accentColor, onClick  }) {
    return (
        <button 
            onClick={onClick}
            className={`
                group relative rounded-3xl overflow-hidden shadow-2xl 
                flex flex-col items-center justify-center gap-6
                bg-gradient-to-br ${gradient} border border-white/10
                transition-all duration-200 ease-out
                active:scale-95 active:brightness-110
            `}
        >
            <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent opacity-40 pointer-events-none"></div>
            <div className={`
                relative p-8 rounded-full text-5xl text-white shadow-lg
                ${accentColor} bg-opacity-30 backdrop-blur-sm border border-white/20
                group-active:scale-110 transition-transform duration-200
            `}>
                {icon}
            </div>
            <div className="relative z-10 text-center">
                <h3 className="text-4xl font-bold text-white tracking-wide drop-shadow-md">{title}</h3>
                <p className="text-blue-100/80 text-xl font-medium mt-2 uppercase tracking-wider">{sub}</p>
            </div>
        </button>
    );
}

export default KioskApp;