import KioskHeader from "./components/KioskHeader";
import { FaTicketAlt, FaSignInAlt, FaSignOutAlt, FaMapMarkedAlt, FaChevronRight } from "react-icons/fa";
import { PiChairBold } from "react-icons/pi";

function KioskApp() {
    return (
        <div className="min-h-screen bg-slate-900 flex flex-col select-none overflow-hidden font-sans text-white">
            {/* 상단 헤더 */}
            <KioskHeader backButton={false} />

            {/* 메인 컨텐츠 */}
            <main className="flex-1 flex flex-col p-8 gap-10 container mx-auto max-w-6xl justify-center">
                
                {/* 1. 상단 영역: 안내 문구(좌) + 좌석 현황 버튼(우) */}
                {/* items-end 대신 items-center로 변경하여 수직 중앙 정렬 */}
                <div className="flex justify-between items-center px-4">
                    {/* 좌측: 안내 문구 */}
                    <div className="text-left">
                        <h2 className="text-5xl font-extrabold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-200 via-white to-blue-200 tracking-tight">
                            Welcome to High Study
                        </h2>
                        <p className="text-xl text-slate-400 font-light">
                            프리미엄 학습 공간 <span className="text-blue-300 font-medium">HIGH STUDY</span>
                        </p>
                    </div>

                    {/* 우측: 좌석 현황 버튼 (디자인 개선) */}
                    <button className="group relative w-80 h-24 rounded-2xl overflow-hidden shadow-xl transition-all duration-200 active:scale-95 border border-white/10 bg-slate-800/50 backdrop-blur-md">
                        
                        {/* 배경 효과: 은은한 보라색 빛이 감돌도록 처리 */}
                        <div className="absolute inset-0 bg-gradient-to-r from-violet-600/10 to-transparent group-active:from-violet-600/30 transition-all"></div>
                        
                        {/* 내부 컨텐츠: 패딩을 넉넉히 주고 flex로 배치 */}
                        <div className="relative h-full flex items-center justify-between px-6 z-10">
                            
                            {/* 텍스트 정보 */}
                            <div className="flex flex-col items-start gap-1">
                                <h3 className="text-2xl font-bold text-white tracking-tight group-active:text-violet-200 transition-colors">
                                    좌석 현황 확인
                                </h3>
                            </div>

                            {/* 우측 아이콘 그룹 */}
                            <div className="flex items-center gap-3">
                                {/* 아이콘 원형 배경 */}
                                <div className="w-12 h-12 rounded-full bg-violet-500/20 flex items-center justify-center border border-violet-500/30 shadow-inner group-active:bg-violet-500 group-active:text-white transition-all">
                                    <PiChairBold className="text-xl text-violet-300 group-active:text-white" />
                                </div>
                                {/* 화살표 */}
                                <FaChevronRight className="text-slate-500 text-sm group-active:translate-x-1 transition-transform" />
                            </div>
                        </div>
                    </button>
                </div>

                {/* 2. 메인 액션 버튼 그룹 (3열 그리드) */}
                <div className="grid grid-cols-3 gap-8 h-96">
                    
                    {/* 이용권 구매 */}
                    <MainActionButton 
                        title="이용권 구매" 
                        sub="Ticket"
                        icon={<FaTicketAlt />} 
                        gradient="from-blue-600 to-blue-800"
                        accentColor="bg-blue-500"
                    />

                    {/* 입실 */}
                    <MainActionButton 
                        title="입실" 
                        sub="Check In"
                        icon={<FaSignInAlt />} 
                        gradient="from-emerald-600 to-emerald-800"
                        accentColor="bg-emerald-500"
                    />

                    {/* 퇴실/외출 */}
                    <MainActionButton 
                        title="퇴실 · 외출" 
                        sub="Check Out"
                        icon={<FaSignOutAlt />} 
                        gradient="from-rose-600 to-rose-800"
                        accentColor="bg-rose-500"
                    />
                </div>
            </main>

            {/* 하단 푸터 */}
            <footer className="p-6 text-center text-slate-500 text-sm font-light">
                <span className="inline-block px-3 py-1 rounded-full bg-slate-800 border border-slate-700">
                    관리자 문의: 010-1234-5678
                </span>
            </footer>
        </div>
    );
}

// 메인 액션 버튼 컴포넌트 (Active 효과만 적용)
function MainActionButton({ title, sub, icon, gradient, accentColor }) {
    return (
        <button 
            className={`
                group relative rounded-3xl overflow-hidden shadow-2xl 
                flex flex-col items-center justify-center gap-6
                bg-gradient-to-br ${gradient} border border-white/10
                transition-all duration-200 ease-out
                active:scale-95 active:brightness-110
            `}
        >
            {/* 내부 광택 효과 */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent opacity-40 pointer-events-none"></div>
            
            {/* 아이콘 원형 배경 */}
            <div className={`
                relative p-8 rounded-full text-5xl text-white shadow-lg
                ${accentColor} bg-opacity-30 backdrop-blur-sm border border-white/20
                group-active:scale-110 transition-transform duration-200
            `}>
                {icon}
            </div>

            {/* 텍스트 영역 */}
            <div className="relative z-10 text-center">
                <h3 className="text-4xl font-bold text-white tracking-wide drop-shadow-md">{title}</h3>
                <p className="text-blue-100/80 text-xl font-medium mt-2 uppercase tracking-wider">{sub}</p>
            </div>
        </button>
    );
}

export default KioskApp;