const Planner = () => {
    return (
        <div className="w-full h-[calc(100vh-8rem)] flex flex-col md:flex-row gap-6">

            {/* ----------------------------------------------------------------------- */}
            {/* [LEFT] AI 채팅 영역 (PC: w-1/3, Mobile: h-1/2 or fixed height) */}
            {/* ----------------------------------------------------------------------- */}
            <section className="flex flex-col w-full md:w-[35%] h-[500px] md:h-full
                              bg-white/50 dark:bg-slate-800/50 backdrop-blur-xl
                              border border-white/40 dark:border-slate-700
                              rounded-3xl shadow-xl overflow-hidden">

                {/* 1. 채팅 헤더 */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/20 dark:border-slate-700 bg-white/40 dark:bg-slate-900/40">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-xl shadow-sm">
                            🤖
                        </div>
                        <div>
                            <h2 className="font-bold text-slate-800 dark:text-white">AI 학습 멘토</h2>
                            <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                                온라인
                            </p>
                        </div>
                    </div>
                </div>

                {/* 2. 채팅 메시지 리스트 (스크롤 영역) */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600">

                    {/* [AI 메시지 예시] */}
                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex-shrink-0 flex items-center justify-center text-sm">🤖</div>
                        <div className="bg-white dark:bg-slate-700 p-3 rounded-2xl rounded-tl-none text-sm text-slate-700 dark:text-slate-200 shadow-sm border border-slate-100 dark:border-slate-600">
                            안녕하세요! 오늘 공부 계획을 도와드릴까요?<br/>
                            공부할 과목과 가용 시간을 알려주세요.
                        </div>
                    </div>

                    {/* [사용자 메시지 예시] */}
                    <div className="flex items-end justify-end gap-2">
                        <div className="bg-blue-600 text-white p-3 rounded-2xl rounded-tr-none text-sm shadow-md">
                            오늘 정보처리기사 실기 3시간 공부할거야.<br/>
                            SQL 파트 위주로 짜줘.
                        </div>
                    </div>

                    {/* [AI 답변 예시 - 로딩 완료 가정] */}
                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex-shrink-0 flex items-center justify-center text-sm">🤖</div>
                        <div className="bg-white dark:bg-slate-700 p-3 rounded-2xl rounded-tl-none text-sm text-slate-700 dark:text-slate-200 shadow-sm border border-slate-100 dark:border-slate-600">
                            네, 확인했습니다! <br/>
                            우측 플래너에 계획표를 생성해드렸어요. 확인해보세요!
                        </div>
                    </div>
                </div>

                {/* 3. 채팅 입력 폼 */}
                <div className="p-4 bg-white/40 dark:bg-slate-900/40 border-t border-white/20 dark:border-slate-700">
                    <form className="relative flex items-center gap-2">
                        <input
                            type="text"
                            placeholder="메시지를 입력하세요..."
                            className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-slate-800 dark:text-white placeholder:text-slate-400 text-sm shadow-inner transition-all"
                        />
                        <button type="submit" className="absolute right-2 p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-lg shadow-blue-600/20">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                                <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
                            </svg>
                        </button>
                    </form>
                </div>
            </section>


            {/* ----------------------------------------------------------------------- */}
            {/* [RIGHT] 플래너 시각화 영역 (PC: w-2/3, Mobile: flex-1) */}
            {/* ----------------------------------------------------------------------- */}
            <section className="flex-1 flex flex-col h-full
                              bg-white/50 dark:bg-slate-800/50 backdrop-blur-xl
                              border border-white/40 dark:border-slate-700
                              rounded-3xl shadow-xl overflow-hidden relative">

                {/* 1. 플래너 헤더 (날짜 및 요약) */}
                <div className="px-8 py-6 border-b border-white/20 dark:border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-white/40 to-transparent dark:from-slate-900/40">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">
                            📅 2025년 5월 20일 (월)
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                            목표: 정보처리기사 실기 완전 정복 (총 3시간)
                        </p>
                    </div>

                    {/* 액션 버튼들 */}
                    <div className="flex gap-2">
                        <button className="px-4 py-2 text-sm font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors shadow-sm">
                            다시 생성
                        </button>
                        <button className="px-4 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-lg shadow-blue-600/20 transition-all">
                            내 캘린더에 저장
                        </button>
                    </div>
                </div>

                {/* 2. 타임라인 컨텐츠 (스크롤 영역) */}
                <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600">
                    <div className="relative pl-4 space-y-6">

                        {/* 타임라인 세로선 */}
                        <div className="absolute left-[27px] top-4 bottom-4 w-[2px] bg-slate-200 dark:bg-slate-700"></div>

                        {/* [Schedule Item: 공부] */}
                        <div className="relative flex group">
                            {/* 시간 표시 */}
                            <div className="w-14 pt-2 text-xs font-bold text-slate-400 dark:text-slate-500 text-right pr-4">
                                09:00
                            </div>

                            {/* 타임라인 점 */}
                            <div className="absolute left-[21px] top-2 w-3 h-3 rounded-full bg-blue-500 ring-4 ring-white dark:ring-slate-800 z-10"></div>

                            {/* 카드 */}
                            <div className="flex-1 ml-4 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 p-4 rounded-r-xl rounded-bl-xl hover:shadow-md transition-shadow cursor-default">
                                <div className="flex justify-between items-start mb-1">
                                    <h3 className="font-bold text-slate-800 dark:text-blue-100">SQL 응용 및 활용</h3>
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-200 text-blue-800 dark:bg-blue-800 dark:text-blue-200">
                                        STUDY (50분)
                                    </span>
                                </div>
                                <p className="text-sm text-slate-600 dark:text-slate-400">
                                    DDL, DML, DCL 기본 문법 암기 및 예제 풀이
                                </p>
                            </div>
                        </div>

                        {/* [Schedule Item: 휴식] */}
                        <div className="relative flex group">
                            <div className="w-14 pt-2 text-xs font-bold text-slate-400 dark:text-slate-500 text-right pr-4">
                                09:50
                            </div>
                            <div className="absolute left-[21px] top-2 w-3 h-3 rounded-full bg-green-500 ring-4 ring-white dark:ring-slate-800 z-10"></div>

                            <div className="flex-1 ml-4 bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 p-4 rounded-r-xl rounded-bl-xl hover:shadow-md transition-shadow cursor-default">
                                <div className="flex justify-between items-start mb-1">
                                    <h3 className="font-bold text-slate-800 dark:text-green-100">휴식</h3>
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-200 text-green-800 dark:bg-green-800 dark:text-green-200">
                                        BREAK (10분)
                                    </span>
                                </div>
                                <p className="text-sm text-slate-600 dark:text-slate-400">
                                    눈 스트레칭 및 물 마시기
                                </p>
                            </div>
                        </div>

                        {/* [Schedule Item: 공부] */}
                        <div className="relative flex group">
                            <div className="w-14 pt-2 text-xs font-bold text-slate-400 dark:text-slate-500 text-right pr-4">
                                10:00
                            </div>
                            <div className="absolute left-[21px] top-2 w-3 h-3 rounded-full bg-blue-500 ring-4 ring-white dark:ring-slate-800 z-10"></div>

                            <div className="flex-1 ml-4 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 p-4 rounded-r-xl rounded-bl-xl hover:shadow-md transition-shadow cursor-default">
                                <div className="flex justify-between items-start mb-1">
                                    <h3 className="font-bold text-slate-800 dark:text-blue-100">SQL 문제 풀이</h3>
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-200 text-blue-800 dark:bg-blue-800 dark:text-blue-200">
                                        STUDY (50분)
                                    </span>
                                </div>
                                <p className="text-sm text-slate-600 dark:text-slate-400">
                                    기출문제 1회차 풀이 및 오답 노트 작성
                                </p>
                            </div>
                        </div>

                    </div>
                </div>

                {/* 빈 상태일 때 (데이터 없을 때 보여줄 화면 예시 - 주석 처리) */}
                {/* <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm z-20">
                    <div className="w-16 h-16 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center mb-4 text-3xl">
                        📅
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white">아직 계획이 없어요</h3>
                    <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-xs">
                        왼쪽 채팅창에서 공부하고 싶은 과목과 시간을 말해주시면 계획을 만들어 드릴게요!
                    </p>
                </div>
                */}

            </section>
        </div>
    );
};

export default Planner;