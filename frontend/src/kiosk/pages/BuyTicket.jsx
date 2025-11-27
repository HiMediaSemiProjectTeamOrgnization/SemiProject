import { useEffect, useState } from "react";
import KioskHeader from "./KioskHeader";
import SelectUserType from "./SelectUserType";
import PaymentPage from "./Payment";
import StepProductList from "../components/StepProductList";
import StepPhoneInput from "../components/StepPhoneInput";
import StepPinInput from "../components/StepPinInput";

function BuyTicket({ onBack, onHome }) {
    const [steps, setSteps] = useState(["selectUserType"]);
    const [userType, setUserType] = useState(null);
    const [products, setProducts] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState(null);

    const [phoneNumber, setPhoneNumber] = useState("010-");
    const [pin, setPin] = useState("");
    const [loading, setLoading] = useState(false);

    const currentStep = steps[steps.length - 1];

    const goNext = (next) => setSteps([...steps, next]);

    const goBack = () => {
        if (steps.length > 1) {
            const stepToExit = steps[steps.length - 1];
            if (stepToExit === 'enterPhone') setPhoneNumber("010-");
            if (stepToExit === 'enterPin') setPin("");
            setSteps(steps.slice(0, -1));
        } else {
            onBack();
        }
    };

    const handleReselect = () => {
        setPhoneNumber("010-");
        setPin("");
        setSteps(['selectUserType', 'selectProduct']);
    };

    useEffect(() => {
        if (userType) {
            setLoading(true);
            setTimeout(() => {
                setProducts([
                    { product_id: 1, name: '2시간 이용권', price: 3000 },
                    { product_id: 2, name: '4시간 이용권', price: 5000 },
                    { product_id: 3, name: '6시간 이용권', price: 7000 },
                    { product_id: 4, name: '12시간 이용권', price: 10000 },
                ]);
                setLoading(false);
            }, 500);
        }
    }, [userType]);

    const getStepTitle = () => {
        switch (currentStep) {
            case 'selectUserType': return '회원 유형 선택';
            case 'selectProduct': return '이용권 선택';
            case 'enterPhone': return '전화번호 입력';
            case 'enterPin': return '비밀번호 설정';
            default: return '';
        }
    }

    const Container = ({ children }) => (
        <div>
            <h2>{getStepTitle()}</h2>
            {children}
        </div>
    );

    return (
        <div>
            <KioskHeader 
                showBack={currentStep !== 'payment'} 
                onBack={goBack} 
            />

            {currentStep !== 'payment' && (
                <div>
                    <div 
                        style={{ width: `${(steps.length / 5) * 100}%` }}
                    />
                </div>
            )}

            {currentStep === "selectUserType" && (
                <Container>
                    <SelectUserType onSelect={(type) => {
                        setUserType(type);
                        goNext("selectProduct");
                    }} />
                </Container>
            )}

            {currentStep === "selectProduct" && (
                <Container>
                    <StepProductList
                        products={products}
                        loading={loading}
                        onSelect={(p) => {
                            setSelectedProduct(p);
                            goNext("enterPhone");
                        }}
                    />
                </Container>
            )}

            {currentStep === "enterPhone" && (
                <Container>
                    <StepPhoneInput 
                        value={phoneNumber}
                        onChange={setPhoneNumber}
                        isMember={userType === 'member'}
                        onNext={() => {
                            if (userType === "member") goNext("enterPin");
                            else setSteps([...steps, "payment"]);
                        }}
                    />
                </Container>
            )}

            {currentStep === "enterPin" && (
                <Container>
                    <StepPinInput 
                        value={pin}
                        onChange={setPin}
                        onNext={() => setSteps([...steps, "payment"])}
                    />
                </Container>
            )}

            {currentStep === "payment" && (
                <PaymentPage
                    onBack={goBack}
                    onHome={onHome}
                    onReselect={handleReselect}
                    product={selectedProduct}
                    phoneNumber={phoneNumber}
                    pin={pin}
                    onComplete={() => onHome()}
                />
            )}
        </div>
    );
}

export default BuyTicket;
