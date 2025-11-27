const CommonButton = ({ children, onClick, variant = 'primary', size = 'medium' }) => {

    // 1. 색상 매핑 (Tailwind 컬러 클래스 사용)
    const colorVariants = {
        // bg-blue-500: 파란색 배경, hover:bg-blue-600: 마우스 올렸을 때 진하게
        primary: 'bg-blue-500 text-white hover:bg-blue-600',
        secondary: 'bg-gray-500 text-white hover:bg-gray-600',
        danger: 'bg-red-500 text-white hover:bg-red-600',
    };

    // 2. 크기 매핑 (padding과 font-size 클래스 사용)
    const sizeVariants = {
        // px(좌우), py(상하), text(글자크기)
        small: 'px-2.5 py-1 text-xs',      // padding: 5px 10px, font: 12px
        medium: 'px-5 py-2.5 text-base',   // padding: 10px 20px, font: 16px
        large: 'px-8 py-4 text-xl',        // padding: 15px 30px, font: 20px
    };

    return (
        <button
            onClick={onClick}
            className={`
                rounded-md font-bold transition-colors duration-200
                ${colorVariants[variant]} 
                ${sizeVariants[size]}
            `}
        >
            {children}
        </button>
    );
}

export default CommonButton;