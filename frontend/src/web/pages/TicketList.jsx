import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import '../styles/TicketList.css'

function TicketList() {
    const [timeTickets, setTimeTickets] = useState([]);
    const [dayTickets, setDayTickets] = useState([]);
    const [choiceTicket, setChoiceTicket] = useState([]);

    const hasFetched = useRef(false);

    const navigate = useNavigate();


    const getTicketList = async () => {
        // console.log("getTicketList 실행");
        const response = await fetch(`http://localhost:8080/api/web/tickets`, {
            method: "GET"
        });

        const ticketData = await response.json();
        const timeTicketData = [];
        const dayTicketData = [];

        ticketData.forEach(ticket => {
            if (ticket.type === "시간제") {
                timeTicketData.push(ticket);
            } else if (ticket.type === "기간제") {
                dayTicketData.push(ticket);
            }
        });

        // 받아온 티켓 데이터 갱신
        setTimeTickets(timeTicketData);
        setDayTickets(dayTicketData);
    }

    // 필터링 (기간제/시간제)
    const handleTicketType = (e) => {
        const value = e.currentTarget.dataset.value;
        // console.log(value);

        document.querySelectorAll(".select-btn").forEach((ticket) => {
            ticket.classList.remove("active");
        })

        if (value == 'time') {
            // console.log("시간제");
            document.querySelector(".select-btn-time").classList.add("active");
        } else {
            document.querySelector(".select-btn-day").classList.add("active");
        }
    }

    // 이용권 선택
    const handleClickTicket = (e) => {
        // 현재 보여주고 있는 필터링 정보 가져오기 (기간제/시간제)
        const showingType = document.querySelector(".select-btn.active")
        // console.log(showingType);

        // 선택한 이용권 표시
        document.querySelectorAll(".ticket-li").forEach((li) => {
            li.classList.remove("active");
        })

        e.currentTarget.classList.add("active");

        // 현재 시간제 이용권을 보고있다면 
        if (showingType.className.includes("time")) {
            // console.log("시간제 보여주는중");

            // 시간제 이용권 정보에서 가져오기
            const clickedTicket = timeTickets.find(ticket => ticket.product_id == e.currentTarget.dataset.id);
            setChoiceTicket(clickedTicket);
        } else {
            // 기간제 이용권 정보에서 가져오기
            const clickedTicket = dayTickets.find(ticket => ticket.product_id == e.currentTarget.dataset.id);
            setChoiceTicket(clickedTicket);
        }
    }

    // 구매하기 
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (choiceTicket.length == 0) {
            alert("구매하실 이용권을 선택하세요");
        } else {
            if (confirm("선택하신 이용권은 " + choiceTicket.name + "입니다.\n구매하시겠습니까?")) {
                // console.log("구매페이지로 이동");
                // 구매페이지로 이동
                navigate("/web/payment", { state: choiceTicket });
            }
        }
        // console.log(choiceTicket);
    }

    const handleCancel = (e) => {
        navigate("/web");
    }

    useEffect(() => {
        if (!hasFetched.current) {
            getTicketList();
            hasFetched.current = true;
        }
    }, []);


    return (
        <div>
            <div className="filter-box">
                <button data-value="time" className="filter-btn btn" onClick={handleTicketType}>시간권</button>
                <button data-value="day" className="filter-btn btn" onClick={handleTicketType}>기간권</button>
            </div>

            <div className="select-btn select-btn-time active">
                <h1>시간권</h1>
                <ul>
                    {timeTickets.map((ticket, idx) => (
                        <li key={idx} data-id={ticket.product_id} className="ticket-li" onClick={handleClickTicket}>
                            <p>{ticket.name}</p>
                            <p>{Number(ticket.price).toLocaleString()}원</p>
                        </li>
                    ))}
                </ul>
            </div>

            <div className="select-btn select-btn-day">
                <h1>기간권</h1>
                <ul>
                    {dayTickets.map((ticket, idx) => (
                        <li key={idx} data-id={ticket.product_id} className="ticket-li" onClick={handleClickTicket}>
                            <p>{ticket.name}</p>
                            <p>{Number(ticket.price).toLocaleString()}원</p>
                        </li>
                    ))}
                </ul>
            </div>

            <div className="result-box">
                <p>이용 기간 {choiceTicket.name}</p>
                <p>총 금액  {choiceTicket?.price ? Number(choiceTicket.price).toLocaleString() + "원" : null}</p>

                <div className="btn-box">
                    <button className="cancel-btn btn" onClick={handleCancel}>취소하기</button>
                    <button className="submit-btn btn" onClick={handleSubmit}>구매하기</button>
                </div>
            </div>

        </div>
    )


}

export default TicketList;