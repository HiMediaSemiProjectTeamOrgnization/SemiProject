import React, { useState, useEffect, useRef } from 'react';
import Calendar from 'react-calendar';
import { format, addDays } from 'date-fns';
import 'react-calendar/dist/Calendar.css';

// ----------------------------------------------------------------------
// [Icons] SVG Components
// ----------------------------------------------------------------------
const Icons = {
    Send: ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>,
    Calendar: ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>,
    Message: ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>,
    Plus: ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>,
    Trash: ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>,
    Edit: ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>,
};

// ----------------------------------------------------------------------
// [Data] Mock Data
// ----------------------------------------------------------------------
const todayStr = format(new Date(), 'yyyy-MM-dd');

const INITIAL_PLANS = {
    [todayStr]: {
        goals: "정보처리기사 실기 완벽 대비",
        notes: "컨디션 관리 중요! 물 많이 마시기.",
        items: [
            { id: 1, subject: "SQL", content: "DML, DDL 기본 문법 암기 및 기출 풀이", time: "50분" },
            { id: 2, subject: "CS", content: "운영체제 프로세스 스케줄링 정리", time: "1시간" },
            { id: 3, subject: "영어", content: "해커스 보카 Day 1-3 암기", time: "30분" },
        ]
    }
};

const generateMockAttendance = () => {
    const dates = [];
    const today = new Date();
    const daysToAdd = [1, 3, 5, 10, 12, 15, today.getDate()];
    daysToAdd.forEach(day => {
        const d = new Date(today.getFullYear(), today.getMonth(), day);
        dates.push(format(d, 'yyyy-MM-dd'));
    });
    return dates;
};
const INITIAL_ATTENDANCE = generateMockAttendance();

// ----------------------------------------------------------------------
// [Mock AI]
// ----------------------------------------------------------------------
const mockAIProcessing = (text) => {
    const lowerText = text.toLowerCase();
    if (lowerText.includes("내일") && (lowerText.includes("계획") || lowerText.includes("짜줘"))) {
        const tomorrow = format(addDays(new Date(), 1), 'yyyy-MM-dd');
        return {
            type: "PLAN_ACTION",
            targetDate: tomorrow,
            message: `내일(${tomorrow}) 학습 계획표를 작성했습니다.`,
            data: {
                goals: "효율적인 시간 관리",
                notes: "점심 시간 이후 30분 낮잠 금지",
                items: [
                    { id: 101, subject: "국어", content: "비문학 지문 3개 분석 및 요약", time: "1시간" },
                    { id: 102, subject: "수학", content: "미적분 예제 문제 풀이 (p.30~45)", time: "90분" },
                    { id: 103, subject: "영어", content: "수능 영단어 50개 암기 테스트", time: "30분" },
                ]
            }
        };
    }
    return {
        type: "CHAT",
        message: "안녕하세요! '내일 계획 짜줘'라고 말씀하시거나, 작성 버튼을 눌러보세요."
    };
};

const Planner = () => {
    const [activeTab, setActiveTab] = useState('chat');
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [plans, setPlans] = useState(INITIAL_PLANS);
    const [attendance] = useState(new Set(INITIAL_ATTENDANCE));

    const [inputMessage, setInputMessage] = useState("");
    const [messages, setMessages] = useState([
        { id: 1, sender: 'bot', text: "안녕하세요! 학습 플래너 봇입니다.\n오늘의 공부 계획을 세워드릴까요?", type: 'text' }
    ]);
    const chatEndRef = useRef(null);

    const [isEditMode, setIsEditMode] = useState(false);
    const [editForm, setEditForm] = useState(null);

    const dateKey = format(selectedDate, 'yyyy-MM-dd');
    const currentPlan = plans[dateKey];

    useEffect(() => {
        if (activeTab === 'chat') {
            chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, activeTab]);

    // --- Handlers ---
    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!inputMessage.trim()) return;
        const userMsg = { id: Date.now(), sender: 'user', text: inputMessage, type: 'text' };
        setMessages(prev => [...prev, userMsg]);
        setInputMessage("");

        setTimeout(() => {
            const response = mockAIProcessing(userMsg.text);
            if (response.type === 'PLAN_ACTION') {
                setPlans(prev => ({ ...prev, [response.targetDate]: response.data }));
                setSelectedDate(new Date(response.targetDate));
                if (window.innerWidth < 768) setActiveTab('planner');
            }
            setMessages(prev => [...prev, { id: Date.now() + 1, sender: 'bot', text: response.message, type: 'text' }]);
        }, 500);
    };

    const openEditModal = () => {
        setEditForm({
            goals: currentPlan?.goals || "",
            notes: currentPlan?.notes || "",
            items: currentPlan?.items.length > 0
                ? [...currentPlan.items]
                : [{ id: Date.now(), subject: '', content: '', time: '' }]
        });
        setIsEditMode(true);
    };

    const saveAllPlans = () => {
        const validItems = editForm.items.filter(item => item.subject.trim() !== "" || item.content.trim() !== "");
        if (validItems.length === 0 && !editForm.goals && !editForm.notes) {
            const newPlans = { ...plans };
            delete newPlans[dateKey];
            setPlans(newPlans);
        } else {
            setPlans(prev => ({ ...prev, [dateKey]: { goals: editForm.goals, notes: editForm.notes, items: validItems } }));
        }
        setIsEditMode(false);
    };

    const addItemRow = () => setEditForm(prev => ({ ...prev, items: [...prev.items, { id: Date.now(), subject: '', content: '', time: '' }] }));
    const removeItemRow = (id) => setEditForm(prev => ({ ...prev, items: prev.items.filter(item => item.id !== id) }));
    const updateItemRow = (id, field, value) => setEditForm(prev => ({ ...prev, items: prev.items.map(item => item.id === id ? { ...item, [field]: value } : item) }));

    const tileContent = ({ date, view }) => {
        if (view !== 'month') return null;
        const dKey = format(date, 'yyyy-MM-dd');
        const hasPlan = plans[dKey];
        const hasAttendance = attendance.has(dKey);
        return (
            <div className="flex justify-center gap-1 mt-1 h-1.5">
                {hasAttendance && <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />}
                {hasPlan && <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />}
            </div>
        );
    };

    return (
        <div className="w-full min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-sans flex flex-col md:h-screen md:overflow-hidden">

            <style>{`
                /* Scrollbar Styles */
                .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 99px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: #94a3b8; }
                @media (prefers-color-scheme: dark) {
                    .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #475569; }
                    .custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: #64748b; }
                }

                /* Calendar Styles */
                .react-calendar { width: 100%; border: none; background: transparent; font-family: inherit; }
                .react-calendar button { background: transparent !important; color: inherit !important; }
                .react-calendar__navigation button { font-size: 1.2rem; font-weight: 800; color: #1e293b; min-width: 44px; }
                .react-calendar__navigation button:enabled:hover, .react-calendar__navigation button:enabled:focus { background-color: #f1f5f9 !important; border-radius: 8px; opacity: 0.8; }
                .react-calendar__month-view__weekdays { text-decoration: none; font-size: 0.9rem; font-weight: bold; margin-bottom: 10px; }
                .react-calendar__month-view__weekdays__weekday { padding: 4px; text-align: center; }
                .react-calendar__month-view__weekdays__weekday abbr { text-decoration: none; color: #64748b; }
                .react-calendar__month-view__weekdays__weekday:nth-child(1) abbr { color: #ef4444 !important; } 
                .react-calendar__month-view__weekdays__weekday:nth-child(7) abbr { color: #3b82f6 !important; } 
                .react-calendar__tile { padding: 0.5em 0; height: 48px; display: flex; flex-direction: column; align-items: center; background: transparent !important; font-weight: 600; }
                .react-calendar__tile abbr { color: #1e293b; } 
                .react-calendar__month-view__days__day--neighboringMonth abbr { color: #94a3b8 !important; opacity: 0.5; }
                .react-calendar__tile:not(.react-calendar__month-view__days__day--neighboringMonth):nth-child(7n+1) abbr { color: #ef4444 !important; }
                .react-calendar__tile:not(.react-calendar__month-view__days__day--neighboringMonth):nth-child(7n) abbr { color: #3b82f6 !important; }
                .react-calendar__tile--active abbr { background: #1e293b; color: white !important; border-radius: 99px; padding: 4px 8px; border: none; }
                .react-calendar__tile--now abbr { color: #2563eb !important; border-bottom: 2px solid #2563eb; }
                .planner-cell { border-right: 1px solid #cbd5e1; }
                .planner-row { border-bottom: 1px solid #cbd5e1; }
                
                @media (prefers-color-scheme: dark) {
                  .react-calendar__navigation button { color: #ffffff !important; }
                  .react-calendar__navigation button:enabled:hover { background-color: #334155 !important; }
                  .react-calendar__month-view__weekdays__weekday abbr { color: #94a3b8 !important; }
                  .react-calendar__tile abbr { color: #ffffff !important; }
                  .react-calendar__month-view__days__day--neighboringMonth abbr { color: #64748b !important; }
                  .react-calendar__tile--now abbr { color: #60a5fa !important; border-bottom: 2px solid #60a5fa; }
                  .react-calendar__tile--active abbr { background: #3b82f6 !important; color: #ffffff !important; }
                  .planner-cell { border-right: 1px solid #475569 !important; }
                  .planner-row { border-bottom: 1px solid #475569 !important; }
                }
            `}</style>

            {/* Mobile Tab Bar */}
            <div className="md:hidden flex h-14 shrink-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 shadow-sm z-20 sticky top-0">
                <button onClick={() => setActiveTab('chat')} className={`flex-1 flex items-center justify-center gap-2 text-sm font-bold transition-colors cursor-pointer ${activeTab === 'chat' ? 'text-slate-900 border-b-2 border-slate-900 dark:text-white dark:border-white' : 'text-slate-400'}`}><Icons.Message className="w-4 h-4" /> 채팅</button>
                <button onClick={() => setActiveTab('planner')} className={`flex-1 flex items-center justify-center gap-2 text-sm font-bold transition-colors cursor-pointer ${activeTab === 'planner' ? 'text-slate-900 border-b-2 border-slate-900 dark:text-white dark:border-white' : 'text-slate-400'}`}><Icons.Calendar className="w-4 h-4" /> 플래너</button>
            </div>

            <div className="flex-1 flex flex-col md:flex-row max-w-[1600px] mx-auto w-full md:p-6 md:gap-6 md:overflow-hidden">

                {/* Left: Chat */}
                <section className={`flex-col w-full md:w-[360px] bg-white dark:bg-slate-800 md:rounded-3xl shadow-lg border border-slate-200 dark:border-slate-700 ${activeTab === 'chat' ? 'flex h-[calc(100vh-3.5rem)] md:h-full' : 'hidden md:flex'}`}>
                    <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex items-center gap-3 bg-white dark:bg-slate-800 md:rounded-t-3xl shrink-0">
                        <div className="w-9 h-9 rounded-full bg-slate-900 flex items-center justify-center text-lg shadow-lg text-white">🤖</div>
                        <div>
                            <h2 className="font-bold text-sm text-slate-800 dark:text-white">AI 학습 멘토</h2>
                            <p className="text-xs text-green-500 font-medium">● Online</p>
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50 dark:bg-slate-900/50 custom-scrollbar">
                        {messages.map((msg) => (
                            <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] rounded-2xl p-3.5 text-sm whitespace-pre-line shadow-sm leading-relaxed ${msg.sender === 'user' ? 'bg-slate-800 text-white rounded-tr-none' : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 rounded-tl-none'}`}>{msg.text}</div>
                            </div>
                        ))}
                        <div ref={chatEndRef} />
                    </div>
                    <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 md:rounded-b-3xl shrink-0">
                        <div className="relative flex items-center">
                            <input type="text" value={inputMessage} onChange={(e) => setInputMessage(e.target.value)} placeholder="메시지 입력..." className="w-full pl-4 pr-12 py-3 bg-slate-100 dark:bg-slate-900 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 text-slate-800 dark:text-white" />
                            <button type="submit" className="absolute right-2 p-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition shadow-md cursor-pointer"><Icons.Send className="w-4 h-4" /></button>
                        </div>
                    </form>
                </section>

                {/* Right: Planner */}
                <section className={`flex-col flex-1 gap-4 ${activeTab === 'planner' ? 'flex min-h-[calc(100vh-3.5rem)]' : 'hidden md:flex md:h-full md:overflow-hidden'}`}>

                    {/* Calendar - Fixed Height */}
                    <div className="bg-white dark:bg-slate-800 md:rounded-3xl shadow-lg border border-slate-200 dark:border-slate-700 p-6 shrink-0 flex flex-col justify-center">
                        <div className="flex items-center justify-end gap-3 mb-2 text-xs font-bold text-slate-500 dark:text-slate-400">
                            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-green-500"></div>출석</div>
                            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-500"></div>계획</div>
                        </div>
                        <Calendar locale="ko-KR" calendarType="gregory" onChange={setSelectedDate} value={selectedDate} formatDay={(locale, date) => format(date, "d")} tileContent={tileContent} next2Label={null} prev2Label={null} className="w-full max-w-xl mx-auto" />
                    </div>

                    {/* [수정 포인트] Planner Detail Area - h-full로 PC 화면 꽉 채우고 min-h-0으로 내부 스크롤 허용 */}
                    <div className="flex-1 bg-slate-100 dark:bg-slate-900 md:rounded-3xl border border-slate-200 dark:border-slate-700 md:bg-white md:dark:bg-slate-800 p-4 md:p-8 flex flex-col min-h-0">

                        {/* Header & Goals - Fixed Height (shrink-0) */}
                        <div className="shrink-0">
                            <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 pb-4 border-b-2 border-slate-800 dark:border-slate-200 gap-4">
                                <div>
                                    <h1 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-wider font-sans">Daily Planner</h1>
                                    <p className="font-bold text-slate-500 mt-1">{format(selectedDate, "yyyy. MM. dd (EEEE)")}</p>
                                </div>
                                <button onClick={openEditModal} className="flex items-center justify-center gap-2 px-6 py-2 bg-slate-800 dark:bg-white text-white dark:text-slate-900 font-bold rounded-lg hover:opacity-90 transition-all shadow-md text-sm cursor-pointer">
                                    <Icons.Edit className="w-4 h-4" />
                                    <span>{currentPlan ? '계획 수정' : '계획 작성'}</span>
                                </button>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                                <div className="lg:col-span-1 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-600 rounded-lg p-4 shadow-sm min-h-[120px]">
                                    <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest mb-2 border-b border-slate-100 dark:border-slate-700 pb-1">Today's Goal</h3>
                                    <div className="text-sm font-bold text-slate-800 dark:text-white whitespace-pre-wrap">{currentPlan?.goals || <span className="text-slate-300 font-normal">목표 없음</span>}</div>
                                </div>
                                <div className="lg:col-span-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg p-4 shadow-sm min-h-[120px]">
                                    <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest mb-2 border-b border-slate-100 dark:border-slate-700 pb-1">Important Notes</h3>
                                    <div className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{currentPlan?.notes || <span className="text-slate-300 font-normal">메모 없음</span>}</div>
                                </div>
                            </div>
                        </div>

                        {/* [수정 포인트] Table Container - flex-1로 남은 공간 차지 & min-h-0 필수 */}
                        <div className="flex-1 flex flex-col bg-white dark:bg-slate-800 border-t border-b border-slate-200 dark:border-slate-700 shadow-sm relative min-h-0 overflow-hidden">

                            {/* Table Header (Fixed) */}
                            <div className="grid grid-cols-12 border-b-2 border-slate-800 dark:border-slate-200 bg-slate-50 dark:bg-slate-700/50 shrink-0 z-10">
                                <div className="col-span-2 p-3 text-center text-xs font-black text-slate-800 dark:text-white uppercase planner-cell">과목</div>
                                <div className="col-span-8 p-3 text-center text-xs font-black text-slate-800 dark:text-white uppercase planner-cell">학습 내용</div>
                                <div className="col-span-2 p-3 text-center text-xs font-black text-slate-800 dark:text-white uppercase">시간</div>
                            </div>

                            {/* [수정 포인트] Table Body (Scrollable) - overflow-y-auto 추가 */}
                            <div className="flex-1 overflow-y-auto custom-scrollbar bg-white dark:bg-slate-800 relative">
                                {currentPlan && currentPlan.items.length > 0 && currentPlan.items.map((item) => (
                                    <div key={item.id} className="grid grid-cols-12 planner-row min-h-[50px] items-center hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors shrink-0">
                                        <div className="col-span-2 p-3 text-center text-sm font-bold text-slate-700 dark:text-slate-300 planner-cell break-words">{item.subject}</div>
                                        <div className="col-span-8 p-3 text-sm text-slate-700 dark:text-slate-300 planner-cell break-words">{item.content}</div>
                                        <div className="col-span-2 p-3 text-center text-sm font-medium text-slate-500 dark:text-slate-400">{item.time}</div>
                                    </div>
                                ))}

                                {(!currentPlan || currentPlan.items.length === 0) && (
                                    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white dark:bg-slate-800">
                                        <div className="bg-white dark:bg-slate-800 px-6 py-3 rounded-xl border border-slate-200 dark:border-slate-600 shadow-lg text-center">
                                            <p className="text-slate-400 font-bold text-lg tracking-widest">PLANS ARE EMPTY</p>
                                            <p className="text-slate-400 text-xs mt-1">작성 버튼을 눌러보세요</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </section>
            </div>

            {/* Modal */}
            {isEditMode && editForm && (
                <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm animate-fadeIn flex items-center justify-center p-4">
                    <div className="w-full max-w-3xl bg-white dark:bg-slate-800 shadow-2xl rounded-lg flex flex-col max-h-[85vh] border border-slate-200 dark:border-slate-700">
                        <div className="shrink-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-4 flex items-center justify-between rounded-t-lg">
                            <div>
                                <h2 className="text-xl font-black text-slate-800 dark:text-white uppercase">Planner Editor</h2>
                                <p className="text-sm text-slate-500">{format(selectedDate, "yyyy-MM-dd")}</p>
                            </div>
                            <div className="flex gap-3">
                                <button onClick={() => setIsEditMode(false)} className="px-4 py-2 text-slate-500 font-bold hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors text-sm cursor-pointer">취소</button>
                                <button onClick={saveAllPlans} className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-lg shadow-md transition-all text-sm cursor-pointer">저장하기</button>
                            </div>
                        </div>
                        <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">Today's Goal</label>
                                    <input type="text" value={editForm.goals} onChange={e => setEditForm({ ...editForm, goals: e.target.value })} placeholder="목표 입력" className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-slate-500 focus:outline-none" />
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">Memo</label>
                                    <input type="text" value={editForm.notes} onChange={e => setEditForm({ ...editForm, notes: e.target.value })} placeholder="메모 입력" className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-slate-500 focus:outline-none" />
                                </div>
                            </div>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-2">
                                    <label className="block text-lg font-black text-slate-800 dark:text-white uppercase">Study List</label>
                                    <button onClick={addItemRow} className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 text-slate-600 text-xs font-bold rounded hover:bg-slate-200 transition-colors cursor-pointer"><Icons.Plus className="w-3 h-3" /> 추가</button>
                                </div>
                                {editForm.items.map((item) => (
                                    <div key={item.id} className="flex flex-col md:flex-row gap-2 bg-slate-50 dark:bg-slate-900/50 p-2 rounded border border-slate-200 dark:border-slate-700">
                                        <div className="w-full md:w-32">
                                            <input type="text" placeholder="과목" value={item.subject} onChange={e => updateItemRow(item.id, 'subject', e.target.value)} className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded text-sm text-center font-bold" />
                                        </div>
                                        <div className="flex-1">
                                            <input type="text" placeholder="학습 내용" value={item.content} onChange={e => updateItemRow(item.id, 'content', e.target.value)} className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded text-sm" />
                                        </div>
                                        <div className="w-full md:w-24 flex gap-2">
                                            <input type="text" placeholder="시간" value={item.time} onChange={e => updateItemRow(item.id, 'time', e.target.value)} className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded text-sm text-center" />
                                        </div>
                                        <button onClick={() => removeItemRow(item.id)} className="p-2 text-slate-400 hover:text-red-500 transition-colors self-center cursor-pointer"><Icons.Trash className="w-4 h-4" /></button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Planner;