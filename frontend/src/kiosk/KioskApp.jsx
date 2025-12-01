import { useState } from "react";
import { FaTicketAlt, FaSignInAlt, FaSignOutAlt, FaChevronRight } from "react-icons/fa";
import { PiChairBold } from "react-icons/pi";
import KioskHeader from "./components/KioskHeader";
import KioskSelectUser from "./screens/KioskUserSelect";
import KioskLogin from "./screens/KioskLogin";
import KioskTicketList from "./screens/KioskTicketList";
import KioskPhoneInput from "./screens/KioskPhoneInput";
import KioskSeatStatus from "./screens/KioskSeatStatus";

function KioskApp() {
    const [currentPage, setCurrentPage] = useState("home");
    const [userType, setUserType] = useState(null);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [selectedSeat, setSelectedSeat] = useState(null); // 선택된 좌석 상태
    const [memberInfo, setMemberInfo] = useState(null);

    // 홈으로 이동 및 상태 초기화
    const goToHome = () => {
        setCurrentPage("home");
        setUserType(null);
        setSelectedTicket(null);
        setSelectedSeat(null);
        setMemberInfo(null);
    };

    // 구매 프로세스 시작 -> 유저 선택 화면으로
    const goToSelectUser = () => {
        setUserType(null);
        setMemberInfo(null);
        setSelectedTicket(null);
        setSelectedSeat(null);
        setCurrentPage("select-user");
    };

    // 단순 좌석 현황 확인 (구매 X)
    const goToSeatStatusView = () => setCurrentPage("seat-status-view");

    // 1. 유저 유형 선택 처리
    const handleUserSelect = (type) => {
        setUserType(type);
        if (type === "member") {
            setCurrentPage("member-login"); // 회원은 로그인 화면으로
        } else {
            setCurrentPage("seat-status");  // 비회원은 바로 좌석 선택으로
        }
    };

    // 2. 회원 로그인 성공 처리
    const handleLoginSuccess = (memberData) => {
        console.log("로그인 정보 저장:", memberData);
        setMemberInfo(memberData);     
        setCurrentPage("ticket-list");
    };

    // 3. 좌석 선택 처리
    const handleSeatSelect = (seat) => {
        setSelectedSeat(seat);
        console.log("선택된 좌석:", seat);
        setCurrentPage("ticket-list");
    };

    // 4. 티켓 목록에서 "결제하기/다음" 클릭 처리
    const handlePaymentRequest = async (ticket, resultData) => {
        setSelectedTicket(ticket);

        if (userType === "member") {
            // [회원] 이미 TicketList 모달에서 결제가 완료된 상태 (resultData 있음) -> 바로 입실 처리
            if (selectedSeat && resultData) {
                await handleCheckIn(resultData.order_id, memberInfo.phone);
            } else {
                alert("오류: 좌석 정보 또는 결제 정보가 없습니다.");
                goToHome();
            }
        } else {
            // [비회원] 아직 결제 안 함 -> 전화번호 입력 화면으로 이동
            setCurrentPage("phone-input");
        }
    };

    // 5. 비회원 전화번호 입력 및 결제 완료 처리
    const handleNonMemberInfoComplete = async (resultData, phoneNumber) => {
        // [비회원] PhoneInput 모달에서 결제 완료 후 호출됨 -> 입실 처리
        if (selectedSeat && resultData) {
            await handleCheckIn(resultData.order_id, phoneNumber);
        } else {
            alert("오류: 좌석 정보가 없습니다.");
            goToHome();
        }
    };
    
    // [공통] 입실(Check-in) API 호출 함수
    const handleCheckIn = async (orderId, phoneNumber) => {
        try {
            const res = await fetch("/api/kiosk/check-in", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    phone: phoneNumber,
                    seat_id: selectedSeat.seat_id,
                    order_id: orderId
                })
            });

            if (!res.ok) {
                 const errData = await res.json();
                 throw new Error(errData.detail || "입실 처리에 실패했습니다.");
            }
            
            // 성공 시 결과 데이터 받기
            const data = await res.json();
            alert(`[${userType === 'member' ? '회원' : '비회원'}] 결제 및 입실 완료!\n좌석번호: ${data.seat_id}번`);
            goToHome();

        } catch (e) {
            console.error(e);
            alert("결제는 완료되었으나 입실 처리에 실패했습니다.\n관리자에게 문의해주세요.\n사유: " + e.message);
            goToHome();
        }
    };


    // --- 화면 렌더링 분기 ---

    // 1. 유저 유형 선택
    if (currentPage === "select-user") {
        return (
            <KioskSelectUser 
                onBack={goToHome} 
                onSelectMember={() => handleUserSelect("member")}
                onSelectNonMember={() => handleUserSelect("non-member")}
            />
        );
    }

    // 2. 회원 로그인
    if (currentPage === "member-login") {
        return (
            <KioskLogin 
                onBack={goToSelectUser} 
                onLoginSuccess={handleLoginSuccess} 
            />
        );
    }

    // 3. 좌석 선택 (구매 프로세스 중)
    if (currentPage === "seat-status") {
        return (
            <KioskSeatStatus 
                onBack={goToSelectUser} 
                onSeatSelect={handleSeatSelect} 
                excludePeriodType={true} // [중요] 구매 시에는 기간제 좌석 숨김
            />
        );
    }

    // 4. 이용권 선택
    if (currentPage === "ticket-list") {
        return (
            <KioskTicketList 
                onBack={() => {
                    if (userType === "member") {
                        setCurrentPage("member-login");
                    } else {
                        setCurrentPage("seat-status");
                    }
                }}
                userType={userType}
                onPaymentRequest={handlePaymentRequest}
                memberInfo={memberInfo}
            />
        );
    }

    // 5. (비회원) 전화번호 입력 및 결제
    if (currentPage === "phone-input") {
        return (
            <KioskPhoneInput 
                onBack={() => setCurrentPage("ticket-list")} 
                onComplete={handleNonMemberInfoComplete} 
                ticket={selectedTicket}
            />
        );
    }

    // (단순 조회용) 좌석 현황 확인 - 홈 화면 버튼 클릭 시
     if (currentPage === "seat-status-view") {
        return (
            <KioskSeatStatus 
                onBack={goToHome} 
                excludePeriodType={false} // 현황 확인 시에는 모든 좌석 표시
            />
        );
    }

    // 홈 화면
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

                    <button 
                        className="group relative w-80 h-24 rounded-2xl overflow-hidden shadow-xl transition-all duration-200 active:scale-95 border border-white/10 bg-slate-800/50 backdrop-blur-md"
                        onClick={goToSeatStatusView} // 단순 조회 모드 이동
                    >
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
                        // 입실 기능은 현재 별도 구현이 안되어 있어 좌석현황으로 연결하거나, 
                        // QR/전화번호 입실 화면으로 연결할 수 있습니다. 
                        // 여기서는 일단 좌석현황(조회)으로 연결해둡니다.
                        onClick={goToSeatStatusView}
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