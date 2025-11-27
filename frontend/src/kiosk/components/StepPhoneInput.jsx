import React from 'react';

const StepPhoneInput = ({ value, onChange, onNext, isMember }) => {
    
    const handleChange = (e) => {
        const rawValue = e.target.value.replace(/[^0-9]/g, '');
        let cleanNumber = rawValue;

        if (!rawValue.startsWith('010') || rawValue.length < 3) {
            cleanNumber = '010';
        }

        if (cleanNumber.length > 11) {
            cleanNumber = cleanNumber.slice(0, 11);
        }

        let formatted = cleanNumber;
        if (cleanNumber.length > 3) {
            if (cleanNumber.length <= 7) {
                formatted = `${cleanNumber.slice(0, 3)}-${cleanNumber.slice(3)}`;
            } else {
                formatted = `${cleanNumber.slice(0, 3)}-${cleanNumber.slice(3, 7)}-${cleanNumber.slice(7)}`;
            }
        } else {
            formatted = "010-";
        }
        
        onChange(formatted);
    };

    return (
        <div>
            <label>휴대전화번호를 입력해주세요</label>
            <input
                type="tel"
                value={value}
                onChange={handleChange}
                placeholder="010-0000-0000"
                maxLength={13}
                autoFocus
            />
            <button 
                onClick={onNext}
                disabled={value.length < 13}
            >
                {isMember ? "다음 단계로" : "결제하기"}
            </button>
        </div>
    );
};

export default StepPhoneInput;
