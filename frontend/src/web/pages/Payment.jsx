import { useLocation } from "react-router-dom";
import { useEffect, useState } from "react";

function Payments() {
    const location = useLocation();
    const ticket = {
        ...location.state,
        total_amount: location.state.price,
        discount_amount: 0
    };

    const [user, setUser] = useState({
        name: "",
        phone1: "",
        phone2: "",
        phone3: "",
        email: "",
        mileage: 0
    });

    const [point, setPoint] = useState(0);
    const totalPrice = ticket.price - point;

    const getUserData = async () => {
        const response = await fetch(`/api/web/me`, { credentials: 'include' });
        const data = await response.json();
        const [phone1, phone2, phone3] = data.phone.split("-");
        setUser({
            name: data.name,
            email: data.email,
            phone1,
            phone2,
            phone3,
            mileage: data.total_mileage
        });
    };

    useEffect(() => {
        getUserData();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setUser(prev => ({ ...prev, [name]: value }));
    };

    const handlePointChange = (e) => {
        const val = Number(e.target.value);
        if (val <= user.mileage) setPoint(val);
        else alert("사용 가능한 마일리지보다 큰 값은 입력할 수 없습니다.");
    };

    const handleUseAllPoint = () => setPoint(user.mileage);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!user.name || !user.phone1 || !user.phone2 || !user.phone3 || !user.email) alert("이름, 전화번호, 이메일을 모두 입력하세요");

        const ticketData = { ...ticket, discount_amount: point, total_amount: totalPrice };
        const res = await fetch('/api/web/payments', {
            method: "POST",
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user, ticketData }),
        });
        const result = await res.json();
        console.log(result);
    };

    return (
        <div className="max-w-4xl mx-auto p-6 bg-slate-900 rounded-3xl shadow-2xl text-white space-y-6">
            <div className="p-6 bg-slate-800 rounded-2xl border border-slate-700 shadow-inner">
                <h2 className="text-2xl font-bold mb-2">상품 정보</h2>
                <p className="text-lg">[{ticket.type}] {ticket.name}</p>
            </div>

            <div className="p-6 bg-slate-800 rounded-2xl border border-slate-700 shadow-inner">
                <h2 className="text-2xl font-bold mb-4">주문자 정보</h2>
                <form className="flex flex-col gap-4">
                    <input type="text" name="name" placeholder="이름 입력" value={user.name} onChange={handleChange} className="p-3 rounded-xl bg-slate-700 border border-slate-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    <div className="flex gap-2 items-center">
                        <input type="text" name="phone1" value={user.phone1} onChange={handleChange} className="w-16 p-3 rounded-xl bg-slate-700 border border-slate-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        <span>-</span>
                        <input type="text" name="phone2" value={user.phone2} onChange={handleChange} className="w-16 p-3 rounded-xl bg-slate-700 border border-slate-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        <span>-</span>
                        <input type="text" name="phone3" value={user.phone3} onChange={handleChange} className="w-16 p-3 rounded-xl bg-slate-700 border border-slate-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
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
                <p>할인 금액: <span className="font-semibold">{Number(point).toLocaleString()}원</span></p>
                <p>총 금액: <span className="font-semibold">{Number(totalPrice).toLocaleString()}원</span></p>
            </div>

            <button onClick={handleSubmit} className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xl shadow-lg transition-transform active:scale-95" >결제</button>
        </div>
    );
}

export default Payments;