import { FaClock } from 'react-icons/fa';
import { useState } from 'react';

export default function StudyTimeSummary() {
    const [hoverIdx, setHoverIdx] = useState(null);
    const [mode, setMode] = useState("week");

    // 두 그래프 데이터 (예시)
    const totalUse = [3, 2, 4, 3, 4, 5, 4];    // 파란색
    const focusTime = [2, 1.5, 3, 2.5, 3, 4, 3.5];  // 보라색

    const labels = ["월", "화", "수", "목", "금", "토", "일"];

    const getHeight = (v) => `${v * 23}px`;

    return (
        <div className="w-full bg-white dark:bg-gray-900 rounded-2xl shadow-md p-6 transition-colors">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <FaClock className="text-indigo-500 dark:text-indigo-300" />
                    <h1 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                        학습 시간 요약
                    </h1>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setMode("week")}
                        className={`px-3 py-1 rounded-lg text-sm font-semibold transition-colors ${mode === "week"
                            ? "bg-indigo-500 text-white"
                            : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-300"
                            }`}
                    >
                        주간
                    </button>

                    <button
                        onClick={() => setMode("month")}
                        className={`px-3 py-1 rounded-lg text-sm font-semibold transition-colors ${mode === "month"
                            ? "bg-indigo-500 text-white"
                            : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-300"
                            }`}
                    >
                        월간
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="p-5 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 text-center">
                    <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-300">44h</p>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">총 이용</p>
                </div>

                <div className="p-5 rounded-2xl bg-purple-50 dark:bg-purple-900/30 text-center">
                    <p className="text-3xl font-bold text-purple-600 dark:text-purple-300">35h</p>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">집중 시간</p>
                </div>

                <div className="p-5 rounded-2xl bg-blue-50 dark:bg-blue-900/30 text-center">
                    <p className="text-3xl font-bold text-blue-600 dark:text-blue-300">80%</p>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">집중도</p>
                </div>
            </div>

            {/* Weekly Bar Chart */}
            <div className="flex justify-between items-end h-64 px-4 relative">
                {labels.map((label, idx) => (
                    <div
                        key={idx}
                        className="flex flex-col items-center w-12 relative"
                        onMouseEnter={() => setHoverIdx(idx)}
                        onMouseLeave={() => setHoverIdx(null)}
                    >
                        {/* Hover Background Highlight */}
                        <div
                            className={`absolute bottom-0 w-full rounded-xl transition-all pointer-events-none ${hoverIdx === idx
                                ? "bg-indigo-100/70 h-full"
                                : "h-0"
                                }`}
                        ></div>

                        {/* Tooltip */}
                        {hoverIdx === idx && (
                            <div className="absolute -top-28 bg-white p-3 rounded-xl shadow-lg z-20 w-32 animate-fadeIn">
                                <p className="text-sm font-semibold text-gray-700 mb-1">
                                    {label}
                                </p>
                                <p className="text-xs text-gray-600">
                                    이용 시간 :{" "}
                                    <b className="text-indigo-600">
                                        {totalUse[idx].toFixed(1)}
                                    </b>
                                </p>
                                <p className="text-xs text-gray-600 mt-1">
                                    집중 시간 :{" "}
                                    <b className="text-purple-600">
                                        {focusTime[idx].toFixed(1)}
                                    </b>
                                </p>
                            </div>
                        )}

                        {/* Bars */}
                        <div className="flex gap-1 items-end z-10">
                            <div
                                className="w-5 bg-indigo-500 rounded-none transition-all"
                                style={{ height: getHeight(totalUse[idx]) }}
                            ></div>

                            <div
                                className="w-5 bg-purple-500 rounded-none transition-all"
                                style={{ height: getHeight(focusTime[idx]) }}
                            ></div>
                        </div>

                        <span className="text-sm text-gray-500 mt-3 z-10">
                            {label}
                        </span>
                    </div>
                ))}
            </div>

            {/* Footer */}
            <div className="mt-4 text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
                <span>📈</span>
                <span>
                    지난주 대비 <b className="font-semibold">12% 증가</b>
                </span>
            </div>
        </div>
    );
}
