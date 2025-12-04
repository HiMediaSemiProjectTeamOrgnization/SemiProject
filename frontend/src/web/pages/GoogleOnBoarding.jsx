import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../../utils/authApi.js';

const GoogleOnBoarding = () => {
    const navigate = useNavigate();
    const [phoneNumber, setPhoneNumber] = useState('');
    const [birthday, setBirthday] = useState('');
    const [pincode, setPincode] = useState('');
    const [birthError, setBirthError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isChecking, setIsChecking] = useState(true);

    // 구글 소셜 로그인 외 클라이언트 접근 차단
    useEffect(() => {
        const checkClient = async () => {
            try {
                setIsChecking(true);
                const result = await authApi.onBoardingInvalidAccess();

                if (result.status === 200) {
                    setIsChecking(false);
                }
            } catch (error) {
                console.log(error);
                navigate('/web', { replace: true });
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
            "birthday": birthday,
            "pin_code": pincode
        };
        try {
            const result = await authApi.onBoarding(data);

            if (result.status !== 200) {
                navigate('/web');
            }
        } catch (error) {
            if (error.response) {
                if (error.response.status === 400) {
                    alert('이미 가입된 휴대폰 번호입니다')
                }
            }
        } finally {
            setIsLoading(false);
        }
    };

    // 휴대폰 번호 자동 하이픈 핸들러
    const handlePhoneInput = (e) => {
        // 1. 숫자만 남기고 다 제거 (문자열, 기존 하이픈 등)
        const rawValue = e.target.value.replace(/[^0-9]/g, '');
        let formatted = '';

        // 2. 길이에 따라 포맷팅 (010-1234-5678 기준)
        if (rawValue.length < 4) {
            formatted = rawValue;
        } else if (rawValue.length < 8) {
            formatted = `${rawValue.slice(0, 3)}-${rawValue.slice(3)}`;
        } else {
            formatted = `${rawValue.slice(0, 3)}-${rawValue.slice(3, 7)}-${rawValue.slice(7, 11)}`;
        }

        // 3. 상태 업데이트
        setPhoneNumber(formatted);
    };

    // [핸들러 함수] 생년월일 입력 및 검증 로직
    const handleBirthChange = (e) => {
        const val = e.target.value.replace(/[^0-9]/g, ""); // 숫자만 남기기

        // 1. 일단 입력값 업데이트 (사용자가 타이핑은 할 수 있게)
        setBirthday(val);
        setBirthError(''); // 에러 초기화

        // 2. 8자리가 되었을 때 정밀 검증 시작
        if (val.length === 8) {
            const year = parseInt(val.substring(0, 4));
            const month = parseInt(val.substring(4, 6));
            const day = parseInt(val.substring(6, 8));

            const currentYear = new Date().getFullYear();

            // [검증 1] 연도 범위: 1900년 ~ 현재 연도
            if (year < 1900 || year > currentYear - 16) {
                setBirthError(`${year}년은 올바르지 않습니다. (1900~${currentYear - 16})`);
                return;
            }

            // [검증 2] 월 범위: 01 ~ 12
            if (month < 1 || month > 12) {
                setBirthError('월은 1월부터 12월까지만 가능합니다.');
                return;
            }

            // [검증 3] 일 유효성 (실제로 존재하는 날짜인지 체크 - 예: 2월 30일 방지)
            // new Date(년, 월-1, 일) -> 월은 0부터 시작하므로 -1
            const date = new Date(year, month - 1, day);
            if (
                date.getFullYear() !== year ||
                date.getMonth() + 1 !== month ||
                date.getDate() !== day
            ) {
                setBirthError(`${month}월에는 ${day}일이 존재하지 않습니다.`);
            }
        }
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
                                    type="text"
                                    required
                                    placeholder="휴대폰번호 (010-1234-5678)"
                                    value={phoneNumber}
                                    pattern="010-[0-9]{4}-[0-9]{4}"
                                    title="휴대폰번호 (010-1234-5678)"
                                    maxLength="13"
                                    onChange={handlePhoneInput}
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

                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 ml-1">
                                생년월일
                            </label>
                            <div className="group relative">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400...">
                                    {/* 아이콘이 있다면 유지 */}
                                </div>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    // 정규식 설명:
                                    // (19|20)\d{2} : 19xx 또는 20xx 년도
                                    // (0[1-9]|1[0-2]) : 01~09 또는 10~12 월
                                    // (0[1-9]|[12][0-9]|3[01]) : 01~09, 10~29, 30~31 일
                                    pattern="^(19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12][0-9]|3[01])$"
                                    required
                                    placeholder="생년월일 (19990101)"
                                    title="생년월일 (19990101)"
                                    maxLength="8"
                                    value={birthday}
                                    // ▼▼▼ 핸들러 교체 ▼▼▼
                                    onChange={handleBirthChange}
                                    className={`w-full h-12 pl-12 pr-4
                                 bg-white/50 dark:bg-slate-950/50
                                 border rounded-xl text-sm outline-none
                                 text-slate-800 dark:text-slate-200
                                 transition-all duration-200
                                 placeholder:text-slate-400 dark:placeholder:text-slate-600
                                 hover:bg-white/80 dark:hover:bg-slate-900/80
                                 /* 에러가 있으면 테두리를 빨간색으로 변경하는 조건부 스타일 */
                                 ${birthError
                                        ? 'border-red-500 focus:border-red-500 focus:ring-red-500/10'
                                        : 'border-slate-200/80 dark:border-slate-700/80 focus:border-blue-500/50 dark:focus:border-blue-400/50 focus:ring-blue-500/10'
                                    }`}
                                />
                            </div>

                            {/* ▼▼▼ 에러 메시지 표시 영역 추가 ▼▼▼ */}
                            {birthError && (
                                <p className="text-xs text-red-500 ml-1 font-medium animate-pulse">
                                    {birthError}
                                </p>
                            )}
                        </div>

                        {/* 핀코드 입력 */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 ml-1">
                                핀코드
                            </label>
                            <div className="group relative">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2
                                text-slate-400 dark:text-slate-500
                                group-focus-within:text-blue-600 dark:group-focus-within:text-blue-400
                                transition-colors duration-200">
                                </div>
                                <input
                                    type="password"
                                    pattern="\d{4}"
                                    maxLength="4"
                                    inputMode="numeric"
                                    required
                                    placeholder="숫자 핀코드 (4자)"
                                    title="숫자 핀코드 (4자)"
                                    value={pincode}
                                    onChange={(e) => setPincode(e.target.value.replace(/[^0-9]/g, ""))}
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

export default GoogleOnBoarding;