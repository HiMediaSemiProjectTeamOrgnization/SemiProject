import { useState } from 'react';
import { FaTicketAlt, FaDoorOpen, FaDoorClosed, FaChair, FaMap } from "react-icons/fa";
import BuyTicket from './BuyTicket';
import KioskHeader from './KioskHeader';

function KioskHome() {
    const [pageStack, setPageStack] = useState(['home']);
    const currentPage = pageStack[pageStack.length - 1];

    const goTo = (page) => setPageStack([...pageStack, page]);
    
    const goBack = () => {
        if (pageStack.length > 1) setPageStack(pageStack.slice(0, -1));
    };

    const goHome = () => {
        setPageStack(['home']);
    };

    if (currentPage === 'buy') return <BuyTicket onBack={goBack} onHome={goHome} />;

    const MenuCard = ({ title, subTitle, icon: Icon, onClick, color }) => (
        <button onClick={onClick}>
            <div></div>
            <div>
                <Icon />
            </div>
            <h3>{title}</h3>
            <p>{subTitle}</p>
        </button>
    );

    return (
        <div>
            <KioskHeader showBack={pageStack.length > 1} onBack={goBack} />
            
            <main>
                <div>
                    <div>
                        <h2>Welcome to HIGH STUDY CAFE</h2>
                        <p>최상의 집중력을 위한 프리미엄 학습 공간입니다.</p>
                    </div>
                    <div>
                         <span>쾌적한 학습 환경 🌿</span>
                    </div>
                </div>

                <div>
                    <MenuCard 
                        title="이용권 구매" 
                        subTitle="일일 / 시간 / 기간권" 
                        icon={FaTicketAlt} 
                        onClick={() => goTo('buy')} 
                        color="bg-blue-600"
                    />
                    <MenuCard 
                        title="입실하기" 
                        subTitle="QR / 전화번호 입장" 
                        icon={FaDoorOpen} 
                        onClick={() => {}} 
                        color="bg-green-600"
                    />
                    <MenuCard 
                        title="퇴실하기" 
                        subTitle="이용 종료 및 외출" 
                        icon={FaDoorClosed} 
                        onClick={() => {}} 
                        color="bg-orange-600"
                    />
                </div>

                <button onClick={() => {}}>
                    <div>
                        <div>
                            <FaChair />
                        </div>
                        <div>
                            <h3>실시간 좌석 현황 보기</h3>
                            <p>현재 이용 가능한 좌석을 미리 확인하세요</p>
                        </div>
                    </div>
                    <div>
                        조회하기
                    </div>
                </button>

            </main>
        </div>
    );
}

export default KioskHome;
