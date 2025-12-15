import React, { useState, useEffect, useRef } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css'; // 기본 CSS import

// --- 아이콘 컴포넌트 ---
const Icons = {
    Plus: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>,
    Trash: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>,
    X: () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>,
    Robot: () => <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>,
    Send: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>,
    ChevronLeft: () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>,
    ChevronRight: () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>,
    Edit: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>,
    Calendar: () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
};

const Planner = () => {
    // --- 설정 및 유틸 ---
    const [currentDate, setCurrentDate] = useState(new Date());
    const scrollRef = useRef(null);
    const TIME_SLOTS = Array.from({ length: 24 }, (_, i) => i);
    const ROW_HEIGHT = 64;

    const formatDateStr = (dateObj) => {
        const offset = dateObj.getTimezoneOffset() * 60000;
        return (new Date(dateObj - offset)).toISOString().slice(0, 10);
    };

    // --- 가데이터 (Mock Data) ---
    const [events, setEvents] = useState([
        { id: 1, title: '환경 생물학', date: '2025-03-10', start: '09:00', end: '10:30', color: 'green', description: 'Ch 3-5 복습' },
        { id: 2, title: '영상 제작 실습', date: '2025-03-12', start: '14:00', end: '16:00', color: 'blue', description: '시나리오 회의' },
        { id: 3, title: '창작 글쓰기', date: '2025-03-10', start: '13:00', end: '14:30', color: 'yellow', description: '에세이 초안 작성' },
        { id: 4, title: '영어 회화', date: '2025-03-14', start: '10:00', end: '11:00', color: 'red', description: '스피킹 테스트 준비' },
        { id: 5, title: '알고리즘 스터디', date: '2025-03-15', start: '20:00', end: '22:00', color: 'blue', description: '백준 문제 풀이' },
        { id: 6, title: '도서관', date: '2025-03-11', start: '09:00', end: '12:00', color: 'green', description: '개인 공부' },
    ]);

    const [attendanceData, setAttendanceData] = useState([
        '2025-03-01', '2025-03-02', '2025-03-03', '2025-03-05',
        '2025-03-08', '2025-03-10', '2025-03-11', '2025-03-12',
        '2025-03-14'
    ]);

    // --- State ---
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);

    const [selectedEvent, setSelectedEvent] = useState(null);

    const [formData, setFormData] = useState({
        title: '', date: '', startH: '09', startM: '00', endH: '10', endM: '00', color: 'blue', description: ''
    });

    const [messages, setMessages] = useState([{ id: 1, sender: 'ai', text: '학습 계획을 도와드릴까요?' }]);
    const [chatInput, setChatInput] = useState('');

    // --- 날짜 계산 헬퍼 ---
    const getStartOfWeek = (d) => {
        const date = new Date(d);
        const day = date.getDay();
        const diff = date.getDate() - day;
        return new Date(date.setDate(diff));
    };

    const getWeekDays = (baseDate) => {
        const start = getStartOfWeek(baseDate);
        return Array.from({ length: 7 }, (_, i) => {
            const d = new Date(start);
            d.setDate(start.getDate() + i);
            return d;
        });
    };
    const weekDays = getWeekDays(currentDate);

    // --- 시간 포지셔닝 헬퍼 ---
    const parseTime = (timeStr) => { const [h, m] = timeStr.split(':'); return { h, m }; };
    const getPosition = (timeStr) => { const [h, m] = timeStr.split(':').map(Number); return (h * 60 + m) * (ROW_HEIGHT / 60); };
    const getHeight = (startStr, endStr) => {
        const [h1, m1] = startStr.split(':').map(Number);
        const [h2, m2] = endStr.split(':').map(Number);
        let endTotal = h2 * 60 + m2;
        if (h2 === 0 && h1 > 0) endTotal = 24 * 60;
        return (endTotal - (h1 * 60 + m1)) * (ROW_HEIGHT / 60);
    };

    // --- 핸들러 ---
    const handleTimeInput = (type, field, value) => {
        const numVal = value.replace(/[^0-9]/g, '');
        let validVal = numVal;
        const intVal = parseInt(numVal, 10);
        if (field === 'H') { if (intVal > 24) validVal = '24'; else if (intVal < 0) validVal = '00'; }
        else if (field === 'M') { if (intVal > 59) validVal = '59'; }
        setFormData(prev => ({ ...prev, [`${type}${field}`]: validVal }));
    };

    const handleGridClick = (dateStr, hour) => {
        const startH = hour.toString().padStart(2, '0');
        const endH = (hour + 1).toString().padStart(2, '0');
        const finalEndH = hour === 23 ? '24' : endH;
        setSelectedEvent(null);
        setFormData({ title: '', date: dateStr, startH, startM: '00', endH: finalEndH, endM: '00', color: 'blue', description: '' });
        setIsEditModalOpen(true);
    };

    const handleEditClick = () => {
        const { h: sh, m: sm } = parseTime(selectedEvent.start);
        const { h: eh, m: em } = parseTime(selectedEvent.end);
        setFormData({
            title: selectedEvent.title, date: selectedEvent.date,
            startH: sh, startM: sm, endH: eh, endM: em,
            color: selectedEvent.color, description: selectedEvent.description
        });
        setIsDetailModalOpen(false);
        setIsEditModalOpen(true);
    };

    const handleSave = (e) => {
        e.preventDefault();
        const startStr = `${formData.startH.padStart(2,'0')}:${formData.startM.padStart(2,'0')}`;
        const endStr = `${formData.endH.padStart(2,'0')}:${formData.endM.padStart(2,'0')}`;
        const newEvent = {
            id: selectedEvent ? selectedEvent.id : Date.now(),
            title: formData.title, date: formData.date, start: startStr, end: endStr,
            color: formData.color, description: formData.description
        };
        if (selectedEvent) setEvents(events.map(ev => ev.id === selectedEvent.id ? newEvent : ev));
        else setEvents([...events, newEvent]);
        setIsEditModalOpen(false);
    };

    const handleDateChange = (date) => {
        setCurrentDate(date);
        setIsCalendarOpen(false);
    };

    const tileContent = ({ date, view }) => {
        if (view === 'month') {
            const dateStr = formatDateStr(date);
            const hasEvent = events.some(e => e.date === dateStr);
            const hasAttendance = attendanceData.includes(dateStr);

            return (
                <div className="flex justify-center items-end gap-1 h-2 absolute bottom-1 w-full left-0 pointer-events-none">
                    {hasAttendance && <div className="w-1.5 h-1.5 bg-green-500 rounded-full shadow-sm" title="출석 완료"></div>}
                    {hasEvent && <div className="w-1.5 h-1.5 bg-blue-500 rounded-full shadow-sm" title="일정 있음"></div>}
                </div>
            );
        }
    };

    const colors = {
        green: 'bg-[#00c07f] border border-[#00a06b] text-white shadow-[0_4px_12px_rgba(0,192,127,0.3)]',
        blue: 'bg-[#00aaff] border border-[#0088cc] text-white shadow-[0_4px_12px_rgba(0,170,255,0.3)]',
        yellow: 'bg-[#eab308] border border-[#ca8a04] text-white shadow-[0_4px_12px_rgba(234,179,8,0.3)]',
        red: 'bg-[#f43f5e] border border-[#e11d48] text-white shadow-[0_4px_12px_rgba(244,63,94,0.3)]',
    };

    useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = 9 * ROW_HEIGHT; }, []);
    const todayStr = formatDateStr(new Date());

    return (
        <div className="relative w-full h-[calc(100vh-100px)] flex flex-col font-sans select-none p-2 gap-2">

            {/* [CSS 수정 내역]
                1. 모든 버튼 및 타일에 cursor: pointer 적용
                2. 리액트 캘린더 요일/날짜 색상 강제 지정 (일: 빨강, 토: 파랑)
            */}
            <style>{`
                /* 기본 커서 포인터 설정 */
                button { cursor: pointer; }

                /* 캘린더 전체 스타일 */
                .react-calendar { 
                    border: none; width: 100%; background: transparent; font-family: inherit; 
                }
                
                /* 네비게이션(상단 이동 버튼) */
                .react-calendar__navigation button {
                    min-width: 44px;
                    background: none;
                    font-size: 16px;
                    margin-top: 8px;
                    border-radius: 12px;
                    cursor: pointer !important; /* 커서 포인터 강제 */
                }
                .react-calendar__navigation button:enabled:hover {
                    background-color: #f1f5f9;
                }
                .react-calendar__navigation button:enabled:active {
                    background-color: #e2e8f0;
                }
                .react-calendar__navigation button:enabled:focus {
                    background-color: transparent;
                }
                .dark .react-calendar__navigation button:enabled:hover {
                    background-color: #1e293b;
                }
                .dark .react-calendar__navigation button:enabled:active {
                    background-color: #334155;
                }
                .dark .react-calendar__navigation button:enabled:focus {
                    background-color: transparent;
                }
                .dark .react-calendar__navigation button { color: white; }

                /* [중요] 리액트 캘린더 색상 커스텀 (테마 무관)
                   일요일(1번째 열) = 빨강 / 토요일(7번째 열) = 파랑 
                */
                /* 요일 헤더 색상 */
                .react-calendar__month-view__weekdays__weekday { text-decoration: none !important; }
                .react-calendar__month-view__weekdays__weekday:nth-child(1) abbr { color: #ef4444 !important; text-decoration: none; } /* 일 */
                .react-calendar__month-view__weekdays__weekday:nth-child(7) abbr { color: #3b82f6 !important; text-decoration: none; } /* 토 */

                /* 날짜 타일 색상 */
                .react-calendar__month-view__days__day:not(.react-calendar__month-view__days__day--neighboringMonth):nth-child(7n+1) { color: #ef4444 !important; } /* 일 */
                .react-calendar__month-view__days__day:not(.react-calendar__month-view__days__day--neighboringMonth):nth-child(7n) { color: #3b82f6 !important; } /* 토 */
                
                .dark .react-calendar__month-view__days__day { color: #cbd5e1; } /* 평일 다크모드 기본색 */

                /* 타일 스타일 및 커서 */
                .react-calendar__tile {
                    position: relative; height: 50px; display: flex; flex-col; align-items: center; justify-content: flex-start; padding-top: 8px;
                    border-radius: 12px; transition: all 0.2s;
                    cursor: pointer !important; /* 타일 커서 포인터 강제 */
                }
                .react-calendar__tile--now {
                    background: #eff6ff !important; color: #2563eb;
                }
                .react-calendar__tile--active {
                    background: #2563eb !important; color: white !important;
                }
                .react-calendar__tile:enabled:hover, .react-calendar__tile:enabled:focus {
                    background-color: #f1f5f9;
                }
                .dark .react-calendar__tile:enabled:hover {
                    background-color: #1e293b;
                }
                .dark .react-calendar__tile--now {
                    background: #1e293b !important; color: #60a5fa;
                }
            `}</style>

            {/* Header */}
            <div className="flex justify-between items-center px-4 py-3 bg-white dark:bg-slate-900/50 backdrop-blur-md rounded-3xl border border-slate-200 dark:border-slate-800 z-30">
                <div className="flex items-center gap-4">
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">MY STUDY PLAN</h1>

                    <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-2xl p-1 border border-slate-200 dark:border-slate-700">
                        <button onClick={() => { const d = new Date(currentDate); d.setDate(d.getDate() - 7); setCurrentDate(d); }} className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-xl text-slate-500 transition cursor-pointer"><Icons.ChevronLeft /></button>
                        <span className="px-4 font-semibold text-slate-700 dark:text-slate-300 min-w-[180px] text-center text-sm">
                            {weekDays[0].toLocaleDateString()} - {weekDays[6].toLocaleDateString()}
                        </span>
                        <button onClick={() => { const d = new Date(currentDate); d.setDate(d.getDate() + 7); setCurrentDate(d); }} className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-xl text-slate-500 transition cursor-pointer"><Icons.ChevronRight /></button>
                    </div>
                </div>

                <div className="flex items-center gap-3 relative">
                    <div className="relative">
                        <button
                            onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                            className={`p-3 rounded-2xl border transition-all duration-200 flex items-center gap-2 font-bold cursor-pointer
                                ${isCalendarOpen
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg ring-4 ring-indigo-500/20'
                                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                            }`}
                        >
                            <Icons.Calendar />
                        </button>

                        {isCalendarOpen && (
                            <div className="absolute top-full right-0 mt-3 w-80 p-4 bg-white/90 dark:bg-slate-900/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 animate-in zoom-in-95 origin-top-right z-50">
                                <div className="mb-2 flex gap-2 justify-end text-[10px] font-bold text-slate-500">
                                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500"></span>출석</span>
                                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500"></span>일정</span>
                                </div>
                                <Calendar
                                    onChange={handleDateChange}
                                    value={currentDate}
                                    calendarType="gregory" // 일요일 시작 (일 월 화...)
                                    formatDay={(locale, date) => date.getDate()}
                                    formatShortWeekday={(locale, date) => ['일', '월', '화', '수', '목', '금', '토'][date.getDay()]} // 한글 요일 강제
                                    tileContent={tileContent}
                                    className="custom-calendar"
                                />
                            </div>
                        )}
                    </div>

                    <button
                        onClick={() => handleGridClick(formatDateStr(new Date()), 9)}
                        className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl shadow-lg shadow-blue-900/20 text-sm font-bold transition-all active:scale-95 cursor-pointer"
                    >
                        <Icons.Plus /> 일정 추가
                    </button>
                </div>
            </div>

            {/* Main Planner Grid */}
            <div className="flex-1 flex flex-col overflow-hidden bg-slate-50 dark:bg-[#0f172a] relative rounded-3xl border border-slate-200 dark:border-slate-800 shadow-inner z-10">
                <div className="flex border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1e293b] z-20 shadow-sm">
                    <div className="w-16 flex-shrink-0 border-r border-slate-200 dark:border-slate-800"></div>
                    {weekDays.map((date, idx) => {
                        const dateStr = formatDateStr(date);
                        const isToday = dateStr === todayStr;
                        let dayColor = "text-slate-500 dark:text-slate-400";
                        if (idx === 0) dayColor = "text-red-500";
                        if (idx === 6) dayColor = "text-blue-500";

                        return (
                            <div key={idx} className={`flex-1 min-w-[100px] py-3 text-center border-r border-slate-200 dark:border-slate-800 last:border-r-0 relative
                                ${isToday ? 'bg-blue-50/50 dark:bg-blue-900/20' : ''}`}>
                                {isToday && <div className="absolute top-0 left-0 w-full h-1 bg-blue-500"></div>}
                                <div className={`text-xs font-bold uppercase ${dayColor}`}>{['일', '월', '화', '수', '목', '금', '토'][idx]}</div>
                                <div className={`text-lg font-bold mt-1 ${isToday ? 'text-blue-600 dark:text-white' : 'text-slate-700 dark:text-slate-200'}`}>{date.getDate()}</div>
                            </div>
                        );
                    })}
                </div>

                <div ref={scrollRef} className="flex-1 overflow-y-auto relative custom-scrollbar rounded-b-3xl">
                    <div className="flex relative min-h-full" style={{ height: TIME_SLOTS.length * ROW_HEIGHT }}>
                        <div className="w-16 flex-shrink-0 bg-white dark:bg-[#1e293b] border-r border-slate-200 dark:border-slate-800 z-10 sticky left-0 text-right">
                            {TIME_SLOTS.map((hour) => (
                                <div key={hour} className="relative w-full pr-2 pt-1" style={{ height: ROW_HEIGHT }}>
                                    <span className="text-xs font-medium text-slate-400 dark:text-slate-500">{hour.toString().padStart(2, '0')}:00</span>
                                </div>
                            ))}
                        </div>
                        <div className="flex-1 flex relative bg-slate-50 dark:bg-[#0f172a]">
                            <div className="absolute inset-0 flex flex-col pointer-events-none z-0">
                                {TIME_SLOTS.map((hour) => (
                                    <div key={hour} className="w-full border-b border-dotted border-slate-300 dark:border-slate-700/50" style={{ height: ROW_HEIGHT }} />
                                ))}
                            </div>
                            {weekDays.map((date, dayIdx) => {
                                const dateStr = formatDateStr(date);
                                const isToday = dateStr === todayStr;
                                const dayEvents = events.filter(ev => ev.date === dateStr);
                                return (
                                    <div key={dayIdx} className={`flex-1 relative border-r border-dotted border-slate-300 dark:border-slate-700/50 last:border-r-0 min-w-[100px] ${isToday ? 'bg-blue-50/30 dark:bg-blue-900/10' : ''}`}>
                                        {TIME_SLOTS.map((hour) => (
                                            <div key={hour} onClick={() => handleGridClick(dateStr, hour)} className="absolute w-full z-0 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors rounded-lg" style={{ top: hour * ROW_HEIGHT, height: ROW_HEIGHT }} />
                                        ))}
                                        {dayEvents.map(ev => (
                                            <div key={ev.id} onClick={(e) => { e.stopPropagation(); setSelectedEvent(ev); setIsDetailModalOpen(true); }} className={`absolute w-[92%] left-[4%] px-4 py-3 rounded-2xl cursor-pointer hover:brightness-110 hover:scale-[1.02] transition-all z-10 overflow-hidden flex flex-col justify-center ${colors[ev.color]}`} style={{ top: `${getPosition(ev.start)}px`, height: `${getHeight(ev.start, ev.end)}px` }}>
                                                <div className="font-bold text-sm leading-tight truncate drop-shadow-md">{ev.title}</div>
                                                <div className="text-[10px] opacity-90 mt-1 font-medium drop-shadow-sm">{ev.start} - {ev.end}</div>
                                            </div>
                                        ))}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* AI Bot */}
            <div className="fixed bottom-32 right-8 z-[9999]">
                <button onClick={() => setIsChatOpen(!isChatOpen)} className="p-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full shadow-2xl transition-transform hover:scale-110 active:scale-95 border-4 border-slate-100 dark:border-slate-800 cursor-pointer">
                    {isChatOpen ? <Icons.X /> : <Icons.Robot />}
                </button>
                {isChatOpen && (
                    <div className="absolute bottom-20 right-0 w-80 h-96 flex flex-col bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-5">
                        <div className="p-4 bg-indigo-600 text-white font-bold flex items-center gap-2"><Icons.Robot /> AI Helper</div>
                        <div className="flex-1 p-4 overflow-y-auto bg-slate-50 dark:bg-slate-900/50">
                            {messages.map(m => (
                                <div key={m.id} className={`mb-2 flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <span className={`px-4 py-3 rounded-2xl text-sm max-w-[80%] ${m.sender === 'user' ? 'bg-indigo-600 text-white rounded-tr-md' : 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-600 rounded-tl-md'}`}>{m.text}</span>
                                </div>
                            ))}
                        </div>
                        <form onSubmit={(e) => { e.preventDefault(); if(!chatInput)return; setMessages([...messages, {id: Date.now(), sender:'user', text:chatInput}]); setChatInput(''); }}
                              className="p-3 bg-white dark:bg-slate-800 border-t dark:border-slate-700 flex gap-2">
                            <input className="flex-1 px-4 py-3 rounded-2xl bg-slate-100 dark:bg-slate-900 border-none outline-none dark:text-white text-sm"
                                   placeholder="질문하기..."
                                   value={chatInput}
                                   onChange={e=>setChatInput(e.target.value)} />
                            <button className="p-3 bg-indigo-600 text-white rounded-2xl cursor-pointer">
                                <Icons.Send />
                            </button>
                        </form>
                    </div>
                )}
            </div>

            {/* Detail Modal */}
            {isDetailModalOpen && selectedEvent && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-in zoom-in-95">
                        <div className={`h-24 w-full ${colors[selectedEvent.color].split(' ')[0]}`}></div>
                        <div className="px-6 py-6 -mt-12 relative">
                            <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-lg border border-slate-100 dark:border-slate-700">
                                <h3 className="text-2xl font-bold text-slate-800 dark:text-white">{selectedEvent.title}</h3>
                                <p className="text-slate-500 font-medium mt-2">
                                    {selectedEvent.date}
                                    <span className="mx-1">|</span> {selectedEvent.start} - {selectedEvent.end}
                                </p>
                                <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl text-slate-700 dark:text-slate-300 text-sm min-h-[80px] leading-relaxed">
                                    {selectedEvent.description || "내용 없음"}
                                </div>
                                <div className="flex gap-3 mt-6">
                                    <button onClick={() => { setEvents(events.filter(e => e.id !== selectedEvent.id)); setIsDetailModalOpen(false); }}
                                            className="p-4 text-red-500 bg-red-50 dark:bg-red-900/20 rounded-2xl hover:bg-red-100 transition cursor-pointer">
                                        <Icons.Trash />
                                    </button>
                                    <button onClick={handleEditClick}
                                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-bold transition shadow-lg shadow-blue-600/20 cursor-pointer">
                                        수정하기
                                    </button>
                                    <button
                                        onClick={() => setIsDetailModalOpen(false)}
                                        className="flex-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 py-4 rounded-2xl font-bold transition hover:bg-slate-200 dark:hover:bg-slate-600 cursor-pointer">
                                        닫기
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit/Create Modal */}
            {isEditModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-3xl shadow-2xl p-8 border border-slate-200 dark:border-slate-700 animate-in zoom-in-95">
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">{selectedEvent ? '일정 수정' : '새 일정 추가'}</h2>
                            <button onClick={() => setIsEditModalOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition cursor-pointer"><Icons.X /></button>
                        </div>
                        <form onSubmit={handleSave} className="space-y-6">
                            <div>
                                <label className="block text-sm font-bold text-slate-500 mb-2 ml-1">제목</label>
                                <input required
                                       type="text"
                                       value={formData.title}
                                       onChange={e => setFormData({...formData, title: e.target.value})}
                                       className="w-full p-4 bg-slate-100 dark:bg-slate-900 rounded-2xl outline-none dark:text-white focus:ring-2 ring-blue-500 transition"
                                       placeholder="일정 이름" />
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-bold text-slate-500 mb-2 ml-1">날짜</label>
                                    <input type="date"
                                           value={formData.date}
                                           onChange={e => setFormData({...formData, date: e.target.value})}
                                           className="w-full p-4 bg-slate-100 dark:bg-slate-900 rounded-2xl outline-none dark:text-white focus:ring-2 ring-blue-500 transition" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-500 mb-2 ml-1">색상</label>
                                    <div className="flex gap-3 h-[56px] items-center px-2">
                                        {Object.keys(colors).map(c => (
                                            <button type="button"
                                                    key={c} onClick={() => setFormData({...formData, color: c})}
                                                    className={`w-10 h-10 rounded-full border-[3px] transition-all duration-200 cursor-pointer ${colors[c].split(' ')[0]} ${formData.color === c ? 'border-slate-800 dark:border-white scale-110 ring-2 ring-offset-2 ring-blue-500' : 'border-transparent opacity-50 hover:opacity-100'}`} />
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-bold text-slate-500 mb-2 ml-1">시작 시간</label>
                                    <div className="flex items-center gap-2 p-4 bg-slate-100 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 transition focus-within:ring-2 ring-blue-500">
                                        <input type="text"
                                               maxLength="2"
                                               value={formData.startH}
                                               onChange={(e) => handleTimeInput('start', 'H', e.target.value)}
                                               className="w-full bg-transparent text-center outline-none dark:text-white font-mono text-lg"
                                               placeholder="09" />
                                        <span className="text-slate-400 font-bold">:</span>
                                        <input type="text"
                                               maxLength="2"
                                               value={formData.startM}
                                               onChange={(e) => handleTimeInput('start', 'M', e.target.value)}
                                               className="w-full bg-transparent text-center outline-none dark:text-white font-mono text-lg"
                                               placeholder="00" />
                                    </div>
                                </div>
                                <div><label className="block text-sm font-bold text-slate-500 mb-2 ml-1">종료 시간</label>
                                    <div className="flex items-center gap-2 p-4 bg-slate-100 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 transition focus-within:ring-2 ring-blue-500">
                                        <input type="text"
                                               maxLength="2"
                                               value={formData.endH}
                                               onChange={(e) => handleTimeInput('end', 'H', e.target.value)}
                                               className="w-full bg-transparent text-center outline-none dark:text-white font-mono text-lg"
                                               placeholder="10" />
                                        <span className="text-slate-400 font-bold">:</span>
                                        <input type="text"
                                               maxLength="2"
                                               value={formData.endM}
                                               onChange={(e) => handleTimeInput('end', 'M', e.target.value)}
                                               className="w-full bg-transparent text-center outline-none dark:text-white font-mono text-lg"
                                               placeholder="00" />
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-500 mb-2 ml-1">상세 내용</label>
                                <textarea rows="4"
                                          value={formData.description}
                                          onChange={e => setFormData({...formData, description: e.target.value})}
                                          className="w-full p-4 bg-slate-100 dark:bg-slate-900 rounded-2xl outline-none dark:text-white focus:ring-2 ring-blue-500 resize-none transition"
                                          placeholder="메모를 입력하세요..." /></div>
                            <button type="submit"
                                    className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-lg shadow-blue-600/30 transition-all active:scale-[0.98] text-lg cursor-pointer">저장하기</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Planner;