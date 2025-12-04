import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

function Payments() {
    const location = useLocation();
    const navigate = useNavigate();

    const { Ticket, SelectSeat } = location.state;
    const [selectedFixedSeat, setSelectedFixedSeat] = useState(SelectSeat ? true : false);
    const ticket = { ...Ticket };
    const [point, setPoint] = useState(0);
    const totalPrice = ticket.price - point;
    const [user, setUser] = useState({
        name: "",
        phone1: "",
        phone2: "",
        phone3: "",
        email: "",
        mileage: 0
    });

    const getUserData = async () => {
        const response = await fetch(`/api/web/me`, { credentials: 'include' });
        const data = await response.json();
        setUser({
            name: data.name,
            email: data.email,
            phone: data.phone,
            mileage: data.total_mileage
        });
    };

    useEffect(() => {
        getUserData();
    }, []);

    // 사용자 정보 수정함수
    const handleChange = (e) => {
        const { name, value } = e.target;
        setUser(prev => ({ ...prev, [name]: value }));
    };

    // 전화번호 포맷팅 함수
    const handlePhoneChange = (e) => {
        const value = e.target.value.replace(/[^0-9]/g, '');

        let formattedPhone = '';
        if (value.length <= 3) {
            formattedPhone = value;
        } else if (value.length <= 7) {
            formattedPhone = `${value.slice(0, 3)}-${value.slice(3)}`;
        } else {
            formattedPhone = `${value.slice(0, 3)}-${value.slice(3, 7)}-${value.slice(7, 11)}`;
        }

        setUser(prev => ({ ...prev, phone: formattedPhone }));
    }
    // 마일리지 사용
    const handlePointChange = (e) => {
        const val = Number(e.target.value);
        if (val < 0) return;
        else if (val <= user.mileage) setPoint(val);
        else alert("사용 가능한 마일리지보다 큰 값은 입력할 수 없습니다.");
    };

    // 마일리지 전액사용
    const handleUseAllPoint = () => {
        if (ticket.price > user.mileage) setPoint(user.mileage);
        else setPoint(ticket.price);
    }

    // 결제요청
    const handleSubmit = async (e) => {
        e.preventDefault();

        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
        const nameRegex = /^[가-힣A-Za-z]{2,20}$/
        const phoneRegex = /^01[016789]-\d{3,4}-\d{4}$/


        if (!nameRegex.test(user.name)) {
            alert("유효한 이름을 입력하세요.");
            return;
        }

        if (!phoneRegex.test(user.phone)) {
            alert("유효한 전화번호를 입력하세요. (010-1234-5678)");
            return;
        }

        if (!emailRegex.test(user.email)) {
            alert("유효한 이메일 주소를 입력하세요.");
            return;
        }

        const ticketData = { ...ticket, total_amount: totalPrice };
        const resData = { user, ticketData }

        if (SelectSeat) resData.SelectSeat = SelectSeat

        const res = await fetch('/api/web/payments', {
            method: "POST",
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(resData),
        });

        if (res.ok) {
            const result = await res.json();
            navigate("/web/payment/success", {
                state: {
                    ticket: ticket,
                    seat: SelectSeat,
                    order: result
                }
            })
        } else {
            const errorData = await res.json();
            alert(errorData.detail);
            navigate("/web/ticket");
        }


    };

    return (
        <div className="max-w-4xl mx-auto p-6 bg-slate-900 rounded-3xl shadow-2xl text-white space-y-6">
            <div className="p-6 bg-slate-800 rounded-2xl border border-slate-700 shadow-inner">
                <h2 className="text-2xl font-bold mb-2">상품 정보</h2>
                <p className="text-lg">[{ticket.type}] {ticket.name}</p>
            </div>

            {selectedFixedSeat && (
                <div className="p-6 bg-slate-800 rounded-2xl border border-slate-700 shadow-inner">
                    <h2 className="text-2xl font-bold mb-2">좌석 정보</h2>
                    <p className="text-lg">선택한 좌석 : {SelectSeat.seat_id}번</p>
                </div>
            )}


            <div className="p-6 bg-slate-800 rounded-2xl border border-slate-700 shadow-inner">
                <h2 className="text-2xl font-bold mb-4">주문자 정보</h2>
                <form className="flex flex-col gap-4">
                    <input type="text" name="name" placeholder="이름 입력" value={user.name} onChange={handleChange} className="p-3 rounded-xl bg-slate-700 border border-slate-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    <input
                        type="tel" // 모바일에서 숫자 키패드 활성화
                        name="phone"
                        placeholder="전화번호 입력 (010-1234-5678)"
                        value={user.phone}
                        onChange={handlePhoneChange} // 단일 핸들러 함수 필요
                        maxLength={13} // 하이픈 포함 최대 길이 (010-XXXX-XXXX)
                        className="p-3 rounded-xl bg-slate-700 border border-slate-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input type="text" name="email" placeholder="이메일" value={user.email} onChange={handleChange} className="p-3 rounded-xl bg-slate-700 border border-slate-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </form>
            </div>

            <div className="p-6 bg-slate-800 rounded-2xl border border-slate-700 shadow-inner">
                <h2 className="text-2xl font-bold mb-2">포인트 사용</h2>
                <p className="text-lg mb-2">
                    사용가능 포인트: <span className="font-semibold">{Number(user.mileage).toLocaleString()}점</span>
                </p>
                <div className="flex items-center gap-2">
                    <button onClick={handleUseAllPoint} className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 transition text-white font-semibold">전액사용</button>
                    <input type="number" className="p-2 rounded-xl bg-slate-700 border border-slate-600 text-white w-24 text-right" value={point} onChange={handlePointChange} />
                    <span>원</span>
                </div>
            </div>

            <div className="p-6 bg-slate-800 rounded-2xl border border-slate-700 shadow-inner text-lg space-y-1">
                <p>상품 금액: <span className="font-semibold">{Number(ticket.price).toLocaleString()}원</span></p>
                <p>사용 마일리지: <span className="font-semibold">{Number(point).toLocaleString()}원</span></p>
                <p>총 결제 금액: <span className="font-semibold">{Number(totalPrice).toLocaleString()}원</span></p>
            </div>

            <button onClick={handleSubmit} className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xl shadow-lg transition-transform active:scale-95">결제</button>
        </div>
    );
}

export default Payments;