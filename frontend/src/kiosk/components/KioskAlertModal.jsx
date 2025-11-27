import { FaExclamationCircle, FaCheckCircle, FaTimesCircle } from "react-icons/fa";

/**
 * 재사용 가능한 키오스크 알림 모달
 * @param {boolean} isOpen - 모달 표시 여부
 * @param {function} onClose - 닫기 버튼/배경 클릭 시 실행될 함수
 * @param {string} title - 모달 제목
 * @param {string} message - 모달 내용 (줄바꿈은 \n 으로 처리)
 * @param {string} type - 'warning' | 'success' | 'error' (아이콘/색상 결정)
 */
function KioskAlertModal({ isOpen, onClose, title, message, type = "warning" }) {
    if (!isOpen) return null;

    const config = {
        warning: {
            icon: <FaExclamationCircle className="text-6xl text-amber-500" />,
            btnColor: "bg-amber-600 hover:bg-amber-500 border-amber-500",
        },
        error: {
            icon: <FaTimesCircle className="text-6xl text-rose-500" />,
            btnColor: "bg-rose-600 hover:bg-rose-500 border-rose-500",
        },
        success: {
            icon: <FaCheckCircle className="text-6xl text-emerald-500" />,
            btnColor: "bg-emerald-600 hover:bg-emerald-500 border-emerald-500",
        },
    };

    const currentConfig = config[type] || config.warning;

    return (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fadeIn">
            {/* 모달 박스 */}
            <div className="w-[400px] bg-slate-800 border-2 border-slate-600 rounded-[2rem] p-8 flex flex-col items-center shadow-2xl animate-scaleUp">
                
                {/* 아이콘 */}
                <div className="mb-6 drop-shadow-lg">
                    {currentConfig.icon}
                </div>

                {/* 텍스트 영역 */}
                <h3 className="text-2xl font-bold text-white mb-3 text-center">
                    {title}
                </h3>
                <p className="text-slate-300 text-lg text-center mb-8 whitespace-pre-line leading-relaxed">
                    {message}
                </p>

                {/* 확인 버튼 */}
                <button
                    onClick={onClose}
                    className={`
                        w-full py-4 rounded-xl text-xl font-bold text-white shadow-lg border-t border-white/10
                        transition-transform active:scale-95
                        ${currentConfig.btnColor}
                    `}
                >
                    확인
                </button>
            </div>
        </div>
    );
}

export default KioskAlertModal;