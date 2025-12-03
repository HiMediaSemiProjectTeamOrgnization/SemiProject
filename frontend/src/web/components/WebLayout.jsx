import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuthCookieStore } from '../../utils/useAuthStores.js';
import { useState, useEffect } from 'react';
import { authApi } from '../../utils/authApi.js';

const WebLayout = () => {
    const navigate = useNavigate();
    const { member, fetchMember, clearMember, isLoading } = useAuthCookieStore();
    const [showPinModal, setShowPinModal] = useState(false);
    const [pinInput, setPinInput] = useState('');
    const [isPinSubmitting, setIsPinSubmitting] = useState(false);

    // 페이지 로드시 내 정보 쿠키 가져오기
    useEffect(() => {
        void fetchMember();
    }, [fetchMember]);

    // 핀코드가 없으면 입력하는 모달창 띄우기
    useEffect(() => {
        if (member && !isLoading) {
            if (member.pin_code === null) {
                setShowPinModal(true);
            }
        } else {
            setShowPinModal(false);
        }
    }, [member, isLoading]);

    // 핀번호 제출
    const handlePinSubmit = async (e) => {
        e.preventDefault();
        if (pinInput.length !== 4) return;

        setIsPinSubmitting(true);

        const data = {
            "pin_code": pinInput
        }

        try {
            await authApi.updatePinCode(data);

            await fetchMember();
            alert("핀번호 입력 완료.");
        } catch (error) {
            alert("잘못된 형식입니다. 핀번호를 다시 입력하세요.");
        } finally {
            setIsPinSubmitting(false);
        }
    };

    // 로그아웃 요청
    const handleLogoutSubmit = async () => {
        try {
            const result = await authApi.logout();

            if (result.status === 200) {
                clearMember();
                navigate('/web');
            }
        } catch (error) {
            alert(`에러발생, 에러코드: ${error.response.status}`);
        }
    };

    return (
        <div className="min-h-screen flex flex-col">
            {/* 핀번호 설정 모달 */}
            {showPinModal && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-sm rounded-2xl p-8 shadow-2xl text-center">
                        <h2 className="text-xl font-bold text-slate-800 mb-2">핀번호 설정</h2>
                        <p className="text-sm text-slate-500 mb-6">
                            서비스 이용을 위해<br/>숫자 4자리를 설정해주세요.
                        </p>

                        <form onSubmit={handlePinSubmit} className="space-y-4">
                            <input
                                type="password"
                                pattern="\d{4}"
                                maxLength="4"
                                inputMode="numeric"
                                required
                                placeholder="숫자 핀코드 (4글자)"
                                title="숫자 핀코드 (4글자)"
                                value={pinInput}
                                onChange={(e) => setPinInput(e.target.value)}
                                className="w-full h-14 text-center text-1.5xl font-bold tracking-[0.5em]
                                         border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                autoFocus
                            />
                            <button
                                type="submit"
                                disabled={pinInput.length !== 4 || isPinSubmitting}
                                className="w-full h-12 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400
                                         text-white font-bold rounded-xl transition-colors cursor-pointer"
                            >
                                {isPinSubmitting ? '저장 중...' : '확인'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* 헤더 (네비게이션) */}
            <header className="bg-blue-600 text-white p-4 shadow-md">
                <nav className="flex gap-4 container mx-auto">
                    <Link to="/web" className="font-bold hover:text-blue-200">홈</Link>
                    {isLoading ? (
                        <div className="text-sm opacity-70">확인 중...</div>
                    ) : member ? (
                        <>
                            <div className="font-bold">
                                {member.name}님
                            </div>
                            <Link to="/web/ticket" className="font-bold hover:text-blue-200">
                                이용권 구매
                            </Link >
                            <button onClick={handleLogoutSubmit} className="font-bold hover:text-blue-200 cursor-pointer">
                                로그아웃
                            </button>
                        </>
                    ) : (
                        <Link to="/web/login" className="font-bold hover:text-blue-200">
                            로그인
                        </Link >
                    )}
                </nav>
            </header>

            {/* 실제 페이지 콘텐츠가 렌더링 되는 곳 */}
            <main className="flex-1 container mx-auto p-4">
                <Outlet />
            </main>

            {/* 푸터 */}
            <footer className="bg-gray-800 text-white p-4 text-center">
                © 2025 Semi Project
            </footer>
        </div>
    );
};

export default WebLayout;