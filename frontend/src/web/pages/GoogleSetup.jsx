import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authFetchGoogleSetup, authFetchGoogleTemp } from '../../utils/authFetchUtils.js';

const GoogleSetup = () => {
    const navigate = useNavigate();
    const [phoneNumber, setPhoneNumber] = useState('');
    const [birthday, setBirthday] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isChecking, setIsChecking] = useState(true);

    // 구글 소셜 로그인 외 클라이언트 접근 차단
    useEffect(() => {
        const checkClient = async () => {
            const result = await authFetchGoogleTemp();
            if (result !== 200) {
                navigate('/web');
            } else {
                setIsChecking(false);
            }
        };
        void checkClient();
    }, [navigate]);

    if (isChecking) {
        return <div className="flex justify-center items-center h-screen">권한 확인 중...</div>;
    }

    // 추가 정보 폼 제출 이벤트
    const handleSetupSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        const data = {
            "phone": phoneNumber,
            "birthday": birthday
        };
        const result = await authFetchGoogleSetup(data);

        if (result !== 200) {
            alert(`에러발생, 에러코드: ${result}`);
        }
        setIsLoading(false);
        navigate('/web');
    };

    return (
        // [전체 컨테이너]
        // light: 부드러운 화이트 블루 배경
        // dark: 깊은 밤하늘색 배경 (slate-950)
        <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-[#f0f4f8] dark:bg-slate-950 transition-colors duration-500 font-sans">

            {/* [배경 데코레이션] Mica Effect & Aurora */}
            <div className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden">
                {/* 상단 원: 다크모드 시 색상을 조금 더 진하게 조정 */}
                <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px]
                        bg-blue-400/20 dark:bg-blue-600/10
                        rounded-full blur-[100px] animate-pulse" />
                {/* 하단 원 */}
                <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px]
                        bg-purple-400/20 dark:bg-indigo-600/10
                        rounded-full blur-[80px]" />
            </div>

            {/* [메인 카드] Glassmorphism 적용 */}
            <div className="relative z-10 w-full max-w-[420px] p-8 mx-4">

                {/* 유리 패널 레이어 */}
                <div className="absolute inset-0
                        bg-white/60 dark:bg-slate-900/50
                        backdrop-blur-2xl rounded-2xl
                        shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.3)]
                        border border-white/60 dark:border-white/10 transition-colors duration-300"></div>

                {/* 컨텐츠 레이어 */}
                <div className="relative z-20 flex flex-col gap-6">

                    {/* 2. 헤더 텍스트 */}
                    <div className="space-y-2 text-center mt-2">
                        <h2 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">
                            추가 정보 입력
                        </h2>
                        <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                            구글 계정 연동을 완료하기 위해<br/>
                            휴대폰 번호와 생년월일이 필요합니다.
                        </p>
                    </div>

                    {/* 3. 입력 폼 영역 */}
                    <form className="space-y-5 mt-2" onSubmit={handleSetupSubmit}>

                        {/* 휴대폰 번호 입력 */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 ml-1">
                                휴대폰 번호
                            </label>
                            <div className="group relative">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2
                                text-slate-400 dark:text-slate-500
                                group-focus-within:text-blue-600 dark:group-focus-within:text-blue-400
                                transition-colors duration-200">
                                </div>
                                <input
                                    type="tel"
                                    placeholder="010-1234-5678"
                                    value={phoneNumber}
                                    onChange={(e) => setPhoneNumber(e.target.value)}
                                    className="w-full h-12 pl-12 pr-4
                             bg-white/50 dark:bg-slate-950/50
                             border border-slate-200/80 dark:border-slate-700/80
                             rounded-xl text-sm outline-none
                             text-slate-800 dark:text-slate-200
                             focus:bg-white dark:focus:bg-slate-900
                             focus:border-blue-500/50 dark:focus:border-blue-400/50
                             focus:ring-4 focus:ring-blue-500/10 dark:focus:ring-blue-400/10
                             transition-all duration-200
                             placeholder:text-slate-400 dark:placeholder:text-slate-600
                             hover:bg-white/80 dark:hover:bg-slate-900/80"
                                />
                            </div>
                        </div>

                        {/* 생년월일 입력 */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 ml-1">
                                생년월일
                            </label>
                            <div className="group relative">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2
                                text-slate-400 dark:text-slate-500
                                group-focus-within:text-blue-600 dark:group-focus-within:text-blue-400
                                transition-colors duration-200">
                                </div>
                                <input
                                    type="text"
                                    placeholder="19991212"
                                    value={birthday}
                                    onChange={(e) => setBirthday(e.target.value)}
                                    className="w-full h-12 pl-12 pr-4
                             bg-white/50 dark:bg-slate-950/50
                             border border-slate-200/80 dark:border-slate-700/80
                             rounded-xl text-sm outline-none
                             text-slate-800 dark:text-slate-200
                             focus:bg-white dark:focus:bg-slate-900
                             focus:border-blue-500/50 dark:focus:border-blue-400/50
                             focus:ring-4 focus:ring-blue-500/10 dark:focus:ring-blue-400/10
                             transition-all duration-200
                             placeholder:text-slate-400 dark:placeholder:text-slate-600
                             hover:bg-white/80 dark:hover:bg-slate-900/80

                             /* 달력 아이콘 색상 조정 (브라우저 기본 스타일) */
                             dark:[color-scheme:dark]"
                                />
                            </div>
                        </div>

                        {/* 4. 제출 버튼 */}
                        {isLoading ? (
                            <div>제출 중...</div>
                        ) : (
                            <div className="pt-2">
                                <button
                                    type="submit"
                                    className="w-full h-12
                           bg-slate-900 hover:bg-slate-800
                           dark:bg-blue-600 dark:hover:bg-blue-500
                           text-white rounded-xl font-bold text-[15px]
                           transition-all duration-200
                           shadow-lg shadow-slate-900/10 dark:shadow-blue-900/20
                           flex items-center justify-center gap-2
                           active:scale-[0.98] cursor-pointer group"
                                >
                                    <span>완료 및 시작하기</span>
                                </button>
                            </div>
                        )}

                        <p className="text-center text-[11px] text-slate-400 dark:text-slate-500">
                            입력하신 정보는 계정 보안 및 본인 확인 용도로만 사용됩니다.
                        </p>

                    </form>
                </div>
            </div>
        </div>
    );
};

export default GoogleSetup;