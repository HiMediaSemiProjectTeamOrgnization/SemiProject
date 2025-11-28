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
    const API_BASE_URL = "http://localhost:8080/api/kiosk";

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
    
    // 메인으로 돌아가면서 모든 상태를 초기화하는 함수
    const goHomeAndReset = () => { 
        setSteps(['selectUserType']);
        setUserType(null);
        setProducts([]);
        setSelectedProduct(null);
        setPhoneNumber("010-");
        setPin("");
        setLoading(false);
        onHome();
    };

    const handleReselect = () => {
        setPhoneNumber("010-");
        setPin("");
        setSteps(['selectUserType', 'selectProduct']);
    };

    // -----------------------------
    //  상품 목록 API 호출
    // -----------------------------
    useEffect(() => {
        if (userType) {
            setLoading(true);
            fetch(`${API_BASE_URL}/products`)
                .then((res) => {
                    if (!res.ok) throw new Error("상품 조회 실패");
                    return res.json();
                })
                .then((data) => {
                    setProducts(data);
                })
                .catch((err) => {
                    console.error("상품 조회 실패", err);
                    alert("상품 조회에 실패했습니다.");
                })
                .finally(() => {
                    setLoading(false);
                });
        }
    }, [userType]);
    
    // -----------------------------
    //  전화번호 입력 완료 -> 다음 단계 (로직 수정)
    // -----------------------------
    const handlePhoneNext = async () => {
        const cleanPhone = phoneNumber.replace(/-/g, '');
        
        if (userType === 'non-member') {
            // 비회원 선택 시: DB 조회 없이 바로 결제 단계로 이동
            goNext("payment");
            return;
        }

        // --- 여기서부터 userType === 'member' 로직 ---
        
        // 1. 회원 여부 확인 API 호출
        setLoading(true);
        try {
            const checkRes = await fetch(`${API_BASE_URL}/auth/check-member`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone: cleanPhone }),
            });

            const checkData = await checkRes.json();
            const isMember = checkRes.ok && checkData.is_member;

            if (isMember) {
                // DB에 등록된 회원: PIN 입력 단계로 이동
                goNext("enterPin"); 
            } else {
                // DB에 없는 회원: 에러 메시지 띄우고 현재 단계 유지
                alert('입력하신 전화번호로 등록된 회원 정보가 없습니다. 전화번호를 확인해주세요.');
                // 현재 단계(enterPhone)에 머무름
            }

        } catch (err) {
            console.error("회원 확인 실패", err);
            alert("회원 확인 중 오류가 발생했습니다.");
        } finally {
            setLoading(false);
        }
    };
    
    // -----------------------------
    //  PIN 입력 완료 -> 다음 단계 (결제)
    // -----------------------------
    const handlePinNext = () => {
        goNext("payment");
    };


    const getStepTitle = () => {
        switch (currentStep) {
            case 'selectUserType': return '회원 유형 선택';
            case 'selectProduct': return '이용권 선택';
            case 'enterPhone': return '전화번호 입력';
            case 'enterPin': return 'PIN 번호 입력';
            default: return '';
        }
    }

    const Container = ({ children }) => (
        <div className="p-8 max-w-xl mx-auto">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">{getStepTitle()}</h2>
            {children}
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50">
            <KioskHeader 
                showBack={currentStep !== 'payment'} 
                onBack={goBack} 
            />

            {currentStep !== 'payment' && (
                <div className="bg-gray-200 h-1 my-4 mx-auto max-w-xl">
                    <div 
                        className="bg-blue-500 h-full transition-all duration-300"
                        // 진행 단계 계산 (userType에 따라 4단계 또는 3단계로 계산됨)
                        style={{ width: `${(steps.indexOf(currentStep) + 1) / (userType === 'member' ? 4 : 3) * 100}%` }}
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
                        onNext={handlePhoneNext}
                    />
                    {loading && <p className="text-center mt-4 text-blue-600">회원 정보 확인 중...</p>}
                </Container>
            )}

            {currentStep === "enterPin" && (
                <Container>
                    <StepPinInput 
                        value={pin}
                        onChange={setPin}
                        onNext={handlePinNext}
                    />
                </Container>
            )}

            {currentStep === "payment" && (
                <PaymentPage
                    onBack={goBack}
                    onHome={goHomeAndReset} 
                    onReselect={handleReselect}
                    product={selectedProduct}
                    phoneNumber={phoneNumber}
                    // 비회원(non-member)은 pin을 넘기지 않음. (userType은 selectUserType에서 이미 설정됨)
                    pin={userType === 'member' ? pin : null} 
                    onComplete={goHomeAndReset}
                />
            )}
        </div>
    );
}

export default BuyTicket;