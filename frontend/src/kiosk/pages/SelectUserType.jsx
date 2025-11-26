import { FaUser, FaUserPlus } from "react-icons/fa";

const SelectUserType = ({ onSelect }) => {
    return (
        <div>
            <h2>회원 유형을 선택해주세요</h2>
            <button onClick={() => onSelect('member')}>
                <FaUser /> 회원
            </button>
            <button onClick={() => onSelect('non-member')}>
                <FaUserPlus /> 비회원
            </button>
        </div>
    );
};

export default SelectUserType;
