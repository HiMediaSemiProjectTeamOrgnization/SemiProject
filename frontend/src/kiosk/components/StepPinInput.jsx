import React from 'react';

const StepPinInput = ({ value, onChange, onNext }) => {
    
    const btnStyle = "";
    const activeBtn = "";
    const disabledBtn = "";

    return (
        <div>
            <label>PIN 번호 (4자리)</label>
            <input
                type="password"
                maxLength={4}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder="●●●●"
                autoFocus
            />
            <button 
                onClick={onNext}
                disabled={value.length !== 4}
            >
                결제하기
            </button>
        </div>
    );
};

export default StepPinInput;
