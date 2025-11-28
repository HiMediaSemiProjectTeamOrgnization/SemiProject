import { useLocation } from "react-router-dom";
import "../styles/Payment.css"
import { useEffect, useState } from "react";

function Payments() {


    const location = useLocation();
    const ticket = {
        ...location.state,
        total_amount: location.state.price,
        discount_amount: 0
    };
    const [user, setUser] = useState({
        "name": "",
        "phone1": "",
        "phone2": "",
        "phone3": "",
        "email": "",
        "mileage": 0
    })

    // 로그인한 유저 정보 가져오기
    const getUserData = async () => {
        const response = await fetch(`http://localhost:8080/api/web/me`, {
            credentials: 'include'
        });

        const data = await response.json();
        const phone1 = data.phone.split("-")[0];
        const phone2 = data.phone.split("-")[1];
        const phone3 = data.phone.split("-")[2];

        setUser(prev => ({
            ...prev,
            name: data.name,
            email: data.email,
            phone1: phone1,
            phone2: phone2,
            phone3: phone3,
            mileage: data.total_mileage
        }))
    }

    useEffect(() => {
        getUserData();
    }, []);

    const handleNameChange = (e) => {
        setUser({ ...user, name: e.target.value });
    }

    const handleEmailChange = (e) => {
        setUser({ ...user, email: e.target.value });
    }

    const handlePhoneChange = (e) => {
        const { name, value } = e.target;

        setUser((user) => ({
            ...user,
            [name]: value
        }))
    }

    const handlePoint = (e) => {
        // console.log(user.mileage);
        const pointInput = document.querySelector(".point-input");
    }

    const handleSubmit = async (e) => {
        e.preventDefault();

        const response = await fetch('http://localhost:8080/api/web/payments', {
            method: "POST",
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ user, ticket }),
        });

    }

    return (
        <div>
            <div className="info-box ticket-info-box">
                <h1>상품 정보</h1>
                <p>{ticket.name} / {ticket.type}</p>
            </div>

            <div className="info-box user-info-box">
                <h1>주문자 정보</h1>
                <form className="user-info-form">
                    <input type="text" placeholder="이름 입력" value={user.name} onChange={handleNameChange} />
                    <div className="user-phone-box">
                        <input type="text" name="phone1" className="phone-first" value={user.phone1} onChange={handlePhoneChange} />
                        <span className="dash">-</span>
                        <input type="text" name="phone2" className="phone-second" value={user.phone2} onChange={handlePhoneChange} />
                        <span className="dash">-</span>
                        <input type="text" name="phone3" className="phone-thrid" value={user.phone3} onChange={handlePhoneChange} />
                    </div>
                    <input type="text" placeholder="이메일" value={user.email} onChange={handleEmailChange} />

                </form>
            </div>

            <div className="info-box discount-info-box">
                <h1>포인트 사용</h1>
                <p>사용가능 포인트 : {user.mileage}</p>

                <button onClick={handlePoint}>전액사용</button>
                <input type="number" className="point-input" value={ticket.discount_amount}/><span>원</span>
            </div>


            <p>상품 금액: {Number(ticket.price).toLocaleString()}원</p>
            <p>할인 금액: {Number(ticket.discount_amount).toLocaleString()}</p>
            <p>총 금액 : {Number(ticket.total_amount).toLocaleString()}원</p>

            <button onClick={handleSubmit}>결제테스트</button>

        </div >

    )
}

export default Payments;