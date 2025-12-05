import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../../utils/authApi.js';
import { useAuthCookieStore } from '../../utils/useAuthStores.js';

const Signup = () => {
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [loginId, setLoginId] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [birthday, setBirthday] = useState('');
    const [pincode, setPincode] = useState('');
    const [birthError, setBirthError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [checkId, setCheckId] = useState(true);
    const [checkPhone, setCheckPhone] = useState(true);
    const { member, fetchMember, isLoading: isAuthLoading } = useAuthCookieStore();

    // 컴포넌트 마운트 시 최신 인증 정보를 확인
    useEffect(() => {
        void fetchMember();
    }, [fetchMember]);

    // member 상태가 변하면 리다이렉트 체크
    useEffect(() => {
        if (member) {
            navigate('/web', { replace: true });
        }
    }, [member, navigate]);

    // 비동기 통신 동안 보여줄 로딩 문구
    if (isAuthLoading) {
        return <div>pending...</div>
    }

    // 회원가입 폼 제출 이벤트
    const handleSignupForm = async (e) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            return;
        }

        setIsLoading(true);

        const data = {
            "name": name,
            "login_id": loginId,
            "password": password,
            "phone": phone,
            "birthday": birthday,
            "email": email,
            "pin_code": pincode
        };

        try {
            const result = await authApi.signup(data);
            if (result.status === 201) {
                navigate('/web');
            }
        } catch (error) {
            if (error.response) {
                if (error.response.status === 409) {
                    alert(`가입된 아이디입니다`);
                } else if (error.response.status === 400) {
                    alert(`가입된 휴대폰 번호입니다`);
                } else {
                    alert(`에러발생, 에러코드: ${error.response.status}`);
                }
            } else {
                alert('통신 불가');
            }
        } finally {
            setIsLoading(false);
        }
    };

    // 중복된 아이디 체크
    const handleLoginIdBlur = async () => {
        try {
            const result = await authApi.checkId({"login_id": loginId});
            if (result.status === 204) {
                setCheckId(true);
            }
        } catch (error) {
            if (error.response) {
                if (error.response.status === 400) {
                    setCheckId(false);
                }
            } else {
                alert(`통신 불가: ${error}`);
            }
        }
    };

    // 중복된 휴대폰번호 체크
    const handlePhoneBlur = async () => {
        try {
            const result = await authApi.checkPhone({"phone": phone});
            if (result.status === 204) {
                setCheckPhone(true);
            }
        } catch (error) {
            if (error.response) {
                if (error.response.status === 400) {
                    setCheckPhone(false);
                }
            } else {
                alert(`통신 불가: ${error}`);
            }
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
        setPhone(formatted);
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
                {/* 상단 원 */}
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

                    {/* 1. 홈으로 돌아가기 버튼 */}
                    <div className="flex justify-center">
                        <button
                            onClick={() => navigate('/web')}
                            className="flex items-center gap-2 px-3 py-1.5
                                       bg-white/40 dark:bg-slate-800/40
                                       backdrop-blur-md border border-white/60 dark:border-white/10
                                       rounded-full shadow-sm
                                       text-slate-600 dark:text-slate-300
                                       hover:bg-white/80 dark:hover:bg-slate-700/80
                                       hover:scale-105 hover:shadow-md
                                       transition-all duration-300 group cursor-pointer"
                        >
                            <span className="text-xs font-medium group-hover:text-slate-900 dark:group-hover:text-white transition-colors">홈으로</span>
                        </button>
                    </div>

                    {/* 2. 헤더 텍스트 */}
                    <div className="space-y-2 text-center mt-2">
                        <h2 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight flex items-center justify-center gap-2">
                            회원가입
                        </h2>
                        <p className="text-slate-500 dark:text-slate-400 text-sm">
                            서비스 이용을 위한 계정을 생성합니다.
                        </p>
                    </div>

                    {/* 3. 입력 폼 영역 */}
                    <form className="space-y-4 mt-1" onSubmit={handleSignupForm}>

                        {/* 이름 입력 */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 ml-1">
                                이름 (실제이름)
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
                                    minLength="2"
                                    maxLength="30"
                                    placeholder="이름 (2~30자)"
                                    title="이름 (2~30자)"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
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

                        {/* 아이디 입력 */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 ml-1">
                                아이디
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
                                    minLength="4"
                                    maxLength="50"
                                    onBlur={handleLoginIdBlur}
                                    placeholder="아이디 (4~50자)"
                                    title="아이디 (4~50자)"
                                    value={loginId}
                                    onChange={(e) => setLoginId(e.target.value)}
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
                            {/* 아이디가 중복일때 안내 */}
                            {!checkId && (
                                <p className="text-xs text-red-500 ml-1">아이디가 중복되었습니다.</p>
                            )}
                        </div>

                        {/* 비밀번호 입력 */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 ml-1">
                                비밀번호
                            </label>
                            <div className="group relative">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2
                                text-slate-400 dark:text-slate-500
                                group-focus-within:text-blue-600 dark:group-focus-within:text-blue-400
                                transition-colors duration-200">
                                </div>
                                <input
                                    type="password"
                                    required
                                    minLength="4"
                                    maxLength="20"
                                    placeholder="비밀번호 (4~20자)"
                                    title="비밀번호 (4~20자)"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
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

                        {/* 비밀번호 재입력 */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 ml-1">
                                비밀번호 재입력
                            </label>
                            <div className="group relative">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2
                                text-slate-400 dark:text-slate-500
                                group-focus-within:text-blue-600 dark:group-focus-within:text-blue-400
                                transition-colors duration-200">
                                </div>
                                <input
                                    type="password"
                                    required
                                    minLength="4"
                                    maxLength="20"
                                    placeholder="비밀번호 재입력 (4~20자)"
                                    title="비밀번호 재입력 (4~20자)"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
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
                            {/* 불일치 시 안내 메시지 */}
                            {confirmPassword && password !== confirmPassword && (
                                <p className="text-xs text-red-500 ml-1">비밀번호가 일치하지 않습니다.</p>
                            )}
                        </div>

                        {/* 휴대폰 번호 입력 */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 ml-1">
                                휴대폰번호
                            </label>
                            <div className="group relative">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2
                                text-slate-400 dark:text-slate-500
                                group-focus-within:text-blue-600 dark:group-focus-within:text-blue-400
                                transition-colors duration-200">
                                </div>
                                <input
                                    type="text"
                                    pattern="010-[0-9]{4}-[0-9]{4}"
                                    required
                                    placeholder="휴대폰번호 (010-1234-5678)"
                                    title="휴대폰번호 (010-1234-5678)"
                                    maxLength="13"
                                    onBlur={handlePhoneBlur}
                                    value={phone}
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
                            {/* 휴대폰번호가 중복일때 안내 */}
                            {!checkPhone && (
                                <p className="text-xs text-red-500 ml-1">휴대폰번호가 중복되었습니다.</p>
                            )}
                        </div>

                        {/* 이메일 입력 */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 ml-1">
                                이메일
                            </label>
                            <div className="group relative">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2
                                text-slate-400 dark:text-slate-500
                                group-focus-within:text-blue-600 dark:group-focus-within:text-blue-400
                                transition-colors duration-200">
                                </div>
                                <input
                                    type="text"
                                    pattern="^([a-zA-Z0-9_\-\.]+)@([a-zA-Z0-9_\-\.]+)\.([a-zA-Z]{2,5})$"
                                    required
                                    maxLength="100"
                                    placeholder="이메일 (example@example.com)"
                                    title="이메일 (example@example.com)"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
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
                                키오스크에서 사용할 핀코드
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
                             hover:bg-white/80 dark:hover:bg-slate-900/80"
                                />
                            </div>
                        </div>

                        {/* 가입하기 버튼 */}
                        {isLoading ? (
                            <div>pending... </div>
                        ) : (
                            <div className="pt-4">
                                <button
                                    type="submit"
                                    className="w-full h-12
                           bg-slate-900 hover:bg-slate-800
                           dark:bg-blue-600 dark:hover:bg-blue-500
                           text-white rounded-xl font-bold text-[15px]
                           transition-all duration-200
                           shadow-lg shadow-slate-900/10 dark:shadow-blue-900/20
                           flex items-center justify-center gap-2
                           active:scale-[0.98] cursor-pointer"
                                >
                                    가입하기
                                </button>
                            </div>
                        )}

                        {/* 하단 링크 */}
                        <div className="text-center">
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            이미 계정이 있으신가요?{" "}
                              <button type="button"
                                      onClick={() => navigate('/web/login')}
                                      className="font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer">
                              로그인하기
                            </button>
                          </span>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Signup;