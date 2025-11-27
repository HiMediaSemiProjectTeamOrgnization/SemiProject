import { FaUser, FaUserClock } from "react-icons/fa";

const SelectUserType = ({ onSelect }) => {
    const Card = ({ type, icon: Icon, title, desc, color }) => (
        <button onClick={() => onSelect(type)}>
            <div>
                <Icon />
            </div>
            <h3>{title}</h3>
            <p>{desc}</p>
        </button>
    );

    return (
        <div>
            <Card 
                type="member" 
                icon={FaUser} 
                title="기존 회원" 
                desc="이미 가입하셨거나 정기권이 있어요" 
                color="bg-blue-600"
            />
            <Card 
                type="non-member" 
                icon={FaUserClock} 
                title="비회원 / 1회 이용" 
                desc="오늘 하루만 이용하고 싶어요" 
                color="bg-green-600"
            />
        </div>
    );
};

export default SelectUserType;
