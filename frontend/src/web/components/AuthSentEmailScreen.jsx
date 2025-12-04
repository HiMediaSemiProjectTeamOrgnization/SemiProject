// [서브 컴포넌트] 이메일 전송 완료 화면
const AuthSentEmailScreen = ({ title, subTitle, buttonText, onButtonClick }) => (
    <div className="flex flex-col items-center justify-center space-y-6 animate-in fade-in zoom-in-95 duration-500 py-4">
        <div className="relative">
            <div className="absolute inset-0 bg-green-500/20 blur-xl rounded-full"></div>
        </div>

        <div className="text-center space-y-3">
            <h3 className="text-xl font-bold text-slate-800 dark:text-white">
                {title}
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed whitespace-pre-line">
                {subTitle}
            </p>
        </div>

        <div className="w-full pt-4 space-y-3">
            <button
                onClick={onButtonClick}
                className="w-full h-12 bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-white rounded-xl font-bold text-[15px] transition-all shadow-lg shadow-slate-900/10 dark:shadow-blue-900/20 flex items-center justify-center gap-2 active:scale-[0.98]"
            >
                {buttonText}
            </button>

            <button
                onClick={() => window.location.reload()} // 혹은 초기화 로직
                className="w-full h-12 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 font-medium text-sm transition-colors"
            >
                다시 시도하기
            </button>
        </div>
    </div>
);

export default AuthSentEmailScreen;