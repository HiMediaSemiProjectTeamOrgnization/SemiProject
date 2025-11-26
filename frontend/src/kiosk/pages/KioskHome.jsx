import { useState } from 'react';
import { FaTicketAlt, FaDoorOpen, FaDoorClosed, FaChair } from "react-icons/fa";
import BuyTicket from './BuyTicket';
import KioskHeader from './KioskHeader';

function KioskHome() {
    const [pageStack, setPageStack] = useState(['home']);

    const currentPage = pageStack[pageStack.length - 1];

    const goTo = (page) => {
        setPageStack([...pageStack, page]);
    };

    const goBack = () => {
        if (pageStack.length > 1) {
            setPageStack(pageStack.slice(0, -1));
        }
    };

    if (currentPage === 'buy') return <BuyTicket onBack={goBack} />;

    return (
        <div>
            <KioskHeader showBack={pageStack.length > 1} onBack={goBack} />
            <p>원하시는 서비스를 선택해주세요</p>

            <button onClick={() => goTo('buy')}>
                <FaTicketAlt /> 이용권 구매
            </button>
            <button>
                <FaDoorOpen /> 입실하기
            </button>
            <button>
                <FaDoorClosed /> 퇴실하기
            </button>
            <button>
                <FaChair /> 좌석 현황 조회
            </button>
        </div>
    );
}

export default KioskHome;
