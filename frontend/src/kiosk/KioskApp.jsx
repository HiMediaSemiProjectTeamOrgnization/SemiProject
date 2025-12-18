import { useState } from "react";
import { FaTicketAlt, FaSignInAlt, FaSignOutAlt, FaChevronRight } from "react-icons/fa";
import { PiChairBold } from "react-icons/pi";
import KioskHeader from "./components/KioskHeader";
import KioskSelectUser from "./screens/KioskUserSelect";
import KioskLogin from "./screens/KioskLogin";
import KioskTicketList from "./screens/KioskTicketList";
import KioskPhoneInput from "./screens/KioskPhoneInput";
import KioskSeatStatus from "./screens/KioskSeatStatus";
import KioskCheckIn from "./components/KioskCheckIn";
import KioskCheckOut from "./components/KioskCheckOut";
import KioskAlertModal from "./components/KioskAlertModal"; 

function KioskApp() {
    const [currentPage, setCurrentPage] = useState("home");
    const [userType, setUserType] = useState(null);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [selectedSeat, setSelectedSeat] = useState(null);
    const [memberInfo, setMemberInfo] = useState(null);
    const [paymentResult, setPaymentResult] = useState(null);
    const [modal, setModal] = useState({ isOpen: false, title: "", message: "", type: "warning", onOk: null });

    const closeModal = () => {
        setModal(prev => ({ ...prev, isOpen: false }));
        if (modal.onOk) {
            modal.onOk();
            setModal(prev => ({ ...prev, onOk: null }));
        }
    };

    const goToHome = () => {
        setCurrentPage("home");
        setUserType(null); setSelectedTicket(null); setSelectedSeat(null);
        setMemberInfo(null); setPaymentResult(null);
    };

    const startPurchaseProcess = () => {
        setUserType(null); setMemberInfo(null); setPaymentResult(null);
        setCurrentPage("select-user");
    };

    const handleUserSelect = (type) => {
        setUserType(type);
        if (type === "member") setCurrentPage("member-login");
        else setCurrentPage("seat-status");
    };

    const handleLoginSuccess = (memberData) => {
        setMemberInfo(memberData);
        setCurrentPage("ticket-list");
    };

    const handleSeatSelect = async (seat) => {
        setSelectedSeat(seat);
        if (userType === "member" && paymentResult) {
            await handlePurchaseCheckIn(paymentResult.order_id, memberInfo.phone, seat);
        } else {
            setCurrentPage("ticket-list");
        }
    };

    const handlePaymentRequest = (ticket, resultData) => {
        setSelectedTicket(ticket);
        if (userType === "member") {
            if (resultData) {
                setPaymentResult(resultData);
                setCurrentPage("seat-status");
            } else {
                setModal({ isOpen: true, title: "오류", message: "결제 정보 오류", type: "error" });
            }
        } else {
            setCurrentPage("phone-input");
        }
    };

    const handlePurchaseCheckIn = async (orderId, phoneNumber, targetSeat) => {
        try {
            const res = await fetch("/api/kiosk/check-in", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ phone: phoneNumber, seat_id: targetSeat.seat_id, order_id: orderId })
            });
            if (!res.ok) throw new Error("입실 실패");
            setModal({ isOpen: true, title: "완료", message: `구매와 입실 완료! 좌석: ${targetSeat.seat_id}번`, type: "success", onOk: goToHome });
        } catch (e) {
            setModal({ isOpen: true, title: "실패", message: e.message, type: "error", onOk: goToHome });
        }
    };

    let content = null;
    if (currentPage === "checkin-process") content = <KioskCheckIn onHome={goToHome} />;
    else if (currentPage === "checkout-process") content = <KioskCheckOut onHome={goToHome} />;
    else if (currentPage === "select-user") content = <KioskSelectUser onBack={goToHome} onSelectMember={() => handleUserSelect("member")} onSelectNonMember={() => handleUserSelect("non-member")} />;
    else if (currentPage === "member-login") content = <KioskLogin mode="purchase" onBack={startPurchaseProcess} onLoginSuccess={handleLoginSuccess} />;
    else if (currentPage === "seat-status") content = <KioskSeatStatus memberInfo={memberInfo} onBack={() => (userType === 'member' && paymentResult) ? goToHome() : startPurchaseProcess()} onSeatSelect={handleSeatSelect} excludePeriodType={true} />;
    else if (currentPage === "ticket-list") content = <KioskTicketList onBack={() => userType === "member" ? setCurrentPage("member-login") : setCurrentPage("seat-status")} userType={userType} onPaymentRequest={handlePaymentRequest} memberInfo={memberInfo} />;
    else if (currentPage === "phone-input") content = <KioskPhoneInput onBack={() => setCurrentPage("ticket-list")} onComplete={async (res, phone) => selectedSeat && res ? await handlePurchaseCheckIn(res.order_id, phone, selectedSeat) : goToHome()} ticket={selectedTicket} mode="purchase" />;
    else if (currentPage === "seat-status-view") content = <KioskSeatStatus onBack={goToHome} isViewOnly={true} />;
    else content = (
        <div className="min-h-screen bg-slate-900 flex flex-col font-sans text-white">
            <KioskHeader backButton={false} />
            <main className="flex-1 flex flex-col p-8 gap-10 container mx-auto max-w-6xl justify-center">
                <div className="flex justify-between items-center px-4">
                    <h2 className="text-5xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-200 to-blue-200">Welcome to High Study</h2>
                    <button className="group relative w-80 h-24 rounded-2xl bg-slate-800/50 border border-white/10" onClick={() => setCurrentPage("seat-status-view")}><div className="flex items-center justify-between px-6"><h3 className="text-2xl font-bold">좌석 현황</h3><PiChairBold className="text-xl text-violet-300" /></div></button>
                </div>
                <div className="grid grid-cols-3 gap-8 h-96">
                    <MainActionButton title="이용권 구매" sub="Ticket" icon={<FaTicketAlt />} gradient="from-blue-600 to-blue-800" accentColor="bg-blue-500" onClick={startPurchaseProcess} />
                    <MainActionButton title="입실" sub="Check In" icon={<FaSignInAlt />} gradient="from-emerald-600 to-emerald-800" accentColor="bg-emerald-500" onClick={() => setCurrentPage("checkin-process")} />
                    <MainActionButton title="퇴실" sub="Check Out" icon={<FaSignOutAlt />} gradient="from-rose-600 to-rose-800" accentColor="bg-rose-500" onClick={() => setCurrentPage("checkout-process")} />
                </div>
            </main>
        </div>
    );

    return (<>{content}<KioskAlertModal isOpen={modal.isOpen} onClose={closeModal} title={modal.title} message={modal.message} type={modal.type} /></>);
}

function MainActionButton({ title, sub, icon, gradient, accentColor, onClick }) {
    return (<button onClick={onClick} className={`group relative rounded-3xl bg-gradient-to-br ${gradient} flex flex-col items-center justify-center gap-6 p-8 border border-white/10 active:scale-95 transition-all shadow-2xl`}><div className={`p-8 rounded-full text-5xl ${accentColor} bg-opacity-30 border border-white/20 shadow-lg`}>{icon}</div><div className="text-center"><h3 className="text-4xl font-bold">{title}</h3><p className="text-blue-100/80 text-xl font-medium mt-2 uppercase">{sub}</p></div></button>);
}

export default KioskApp;