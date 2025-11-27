import { Link } from 'react-router-dom';

const Home = () => {
    return (
        // 1. 전체 배경 컨테이너 (화면 중앙 정렬)
        <div className="min-h-screen bg-gray-100 flex flex-col justify-center items-center p-6">

            {/* 타이틀 */}
            <h1 className="text-4xl font-bold text-gray-800 mb-10">
                스터디카페 시스템 🚪
            </h1>

            {/* 2. 그리드 레이아웃 (모바일: 1열, PC: 2열) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">

                {/* 카드 1: 키오스크 */}
                <Link to='/test' className="group block p-10 bg-white rounded-2xl shadow-md border border-gray-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                    <h2 className="text-2xl font-bold text-blue-600 mb-2 group-hover:text-blue-700">🖥️ 키오스크 모드</h2>
                    <p className="text-gray-500">매장 입구에 설치되는 무인 결제 시스템입니다.</p>
                </Link>

                {/* 카드 2: 태블릿 페이지 */}
                <Link to='/test' className="group block p-10 bg-white rounded-2xl shadow-md border border-gray-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                    <h2 className="text-2xl font-bold text-green-600 mb-2 group-hover:text-green-700">📱 태블릿 (좌석용)</h2>
                    <p className="text-gray-500">각 좌석이나 방에 비치된 태블릿 화면입니다.</p>
                </Link>

                {/* 카드 3: 웹 페이지 */}
                <Link to='/web' className="group block p-10 bg-white rounded-2xl shadow-md border border-gray-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                    <h2 className="text-2xl font-bold text-purple-600 mb-2 group-hover:text-purple-700">🌐 사용자 웹</h2>
                    <p className="text-gray-500">고객이 집에서 예약할 때 쓰는 PC/모바일 웹입니다.</p>
                </Link>

                {/* 카드 4: 관리자 페이지 */}
                <Link to='/test' className="group block p-10 bg-slate-800 rounded-2xl shadow-md border border-gray-700 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                    <h2 className="text-2xl font-bold text-white mb-2">⚙️ 관리자 페이지</h2>
                    <p className="text-slate-400">매장 현황 관리 및 매출 통계 시스템입니다.</p>
                </Link>
            </div>
        </div>
    );
};

export default Home;