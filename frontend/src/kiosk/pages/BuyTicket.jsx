import { useState } from "react";
import KioskHeader from "./KioskHeader";
import SelectUserType from "./SelectUserType";

function BuyTicket({ onBack }) {
    const [userType, setUserType] = useState(null);

    const handleBack = () => {
        if (userType) {
            setUserType(null);
        } else {
            onBack();
        }
    };

    return (
        <div>
            <KioskHeader showBack={true} onBack={handleBack} />
            
            {!userType && <SelectUserType onSelect={setUserType} />}

            {userType && (
                <div>
                    <h2>티켓 구매 ({userType === 'member' ? '회원' : '비회원'})</h2>
                    {/* 상품 리스트 추가 */}
                </div>
            )}
        </div>
    );
}

export default BuyTicket;
