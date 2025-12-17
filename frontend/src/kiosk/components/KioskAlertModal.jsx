import { FaExclamationCircle, FaCheckCircle, FaTimesCircle } from "react-icons/fa";

/**
 * @param {function} onConfirm - (옵션) 확인/강제진행 버튼 클릭 시 실행될 함수
 * @param {string} confirmText - (옵션) 확인 버튼 텍스트 (기본: "확인")
 */
function KioskAlertModal({ isOpen, onClose, title, message, type = "warning", imageUrl, onConfirm, confirmText }) {
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
            <div className="w-[500px] bg-slate-800 border-2 border-slate-600 rounded-[2rem] p-8 flex flex-col items-center shadow-2xl animate-scaleUp">
                
                <div className="mb-6 drop-shadow-lg">
                    {currentConfig.icon}
                </div>

                <h3 className="text-2xl font-bold text-white mb-3 text-center">
                    {title}
                </h3>

                {/* [수정] 이미지가 있으면 표시 */}
                {imageUrl && (
                    <div className="w-full mb-6 rounded-xl overflow-hidden border-2 border-slate-500 shadow-inner bg-black">
                        <img 
                            // 개발 환경에서만 로컬호스트를 붙이도록 수정 (또는 무조건 붙임)
                            src={`http://192.168.0.31:8000${imageUrl}`}
                            alt="확인된 이미지" 
                            className="w-full h-48 object-contain" 
                        />
                    </div>
                )}
                <p className="text-slate-300 text-lg text-center mb-8 whitespace-pre-wrap leading-relaxed">
                    {message}
                </p>

                {/* 버튼 영역: onConfirm이 있으면 2개, 없으면 1개 */}
                <div className="flex w-full gap-4">
                    {onConfirm ? (
                        <>
                            {/* 취소/닫기 버튼 */}
                            <button
                                onClick={onClose}
                                className="flex-1 py-4 rounded-xl text-xl font-bold text-slate-300 bg-slate-700 hover:bg-slate-600 transition-transform active:scale-95"
                            >
                                다시 확인
                            </button>
                            {/* 강제 진행 버튼 */}
                            <button
                                onClick={() => {
                                    onConfirm();
                                    onClose(); // 클릭 후 모달 닫기
                                }}
                                className={`flex-1 py-4 rounded-xl text-xl font-bold text-white shadow-lg transition-transform active:scale-95 ${currentConfig.btnColor}`}
                            >
                                {confirmText || "확인했습니다"}
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={onClose}
                            className={`w-full py-4 rounded-xl text-xl font-bold text-white shadow-lg border-t border-white/10 transition-transform active:scale-95 ${currentConfig.btnColor}`}
                        >
                            확인
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

export default KioskAlertModal;