import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuthCookieStore } from '../../utils/useAuthStores.js';
import { useEffect } from 'react';
import { authApi } from '../../utils/authApi.js';

const WebLayout = () => {
    const navigate = useNavigate();
    const { member, fetchMember, clearMember, isLoading } = useAuthCookieStore();

    useEffect(() => {
        void fetchMember();
    }, []);

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