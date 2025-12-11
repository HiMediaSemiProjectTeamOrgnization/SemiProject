import { BsLightningChargeFill } from "react-icons/bs";
import { FaMedal, FaCalendarAlt } from "react-icons/fa";
import { MdTrendingUp } from "react-icons/md";

export default function FocusAnalysis() {
    return (
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md p-6 transition-colors">
            {/* Header */}
            <div className="flex items-center gap-2 mb-6">
                <BsLightningChargeFill className="text-purple-500 dark:text-purple-300 text-lg" />
                <h1 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                    집중 분석
                </h1>
            </div>

            {/* Main Stat Box */}
            <div className="bg-purple-50 dark:bg-purple-900/30 rounded-xl p-6 flex flex-col items-center mb-6 transition-colors">
                <div className="flex items-end gap-1">
                    <span className="text-5xl font-bold text-purple-600 dark:text-purple-400">
                        82
                    </span>
                    <span className="text-xl text-purple-500 dark:text-purple-300">
                        분
                    </span>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    평균 집중 시간
                </p>
            </div>

            {/* Best Record */}
            <div
                className="flex justify-between items-center 
                p-2 bg-gray-50 dark:bg-gray-800 rounded-xl 
                mb-4 border border-gray-200 dark:border-gray-700 transition-colors"
            >
                <div className="flex items-center gap-2">
                    <FaMedal className="text-purple-500 dark:text-purple-300" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                        최장 기록
                    </span>
                </div>
                <div className="text-center">
                    <p className="text-sm text-gray-700 dark:text-gray-200 font-medium">
                        95분
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                        12/7
                    </p>
                </div>
            </div>

            {/* Trend */}
            <div
                className="p-2 bg-green-50 dark:bg-green-900/20 rounded-xl 
                border border-green-200 dark:border-green-700 
                flex gap-3 transition-colors"
            >
                <MdTrendingUp className="text-green-500 dark:text-green-400 text-xl mt-0.5" />
                <div>
                    <p className="text-sm text-green-700 dark:text-green-300">
                        집중력이 꾸준히 향상되고 있어요 🎯
                    </p>
                    <p className="text-xs text-green-600 dark:text-green-400">
                        지난주 대비 +8분
                    </p>
                </div>
            </div>

            {/* Divider */}
            <div className="border-b border-gray-200 dark:border-gray-700 my-6" />

            {/* 집중 패턴 박스 */}
            {/* Header */}
            <div className="flex items-center gap-2 mb-6">
                <FaCalendarAlt className="text-indigo-500 dark:text-indigo-300 text-lg" />
                <h1 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                    집중 패턴
                </h1>
            </div>

            {/* Best Day */}
            <div
                className="p-3 rounded-2xl text-white mb-4 shadow-sm transition-all"
                style={{
                    background:
                        "linear-gradient(135deg, #6A5BEA, #9F6BFF)",
                }}
            >
                <p className="text-sm opacity-90">베스트 요일</p>
                <p className="text-2xl font-bold mt-1">금요일</p>
                <p className="text-sm mt-1 opacity-90">집중도 92점</p>
            </div>

            {/* Best Time */}
            <div
                className="p-3 rounded-2xl text-white mb-6 shadow-sm transition-all"
                style={{
                    background:
                        "linear-gradient(135deg, #FFA63B, #FF6A4E)",
                }}
            >
                <p className="text-sm opacity-90">베스트 시간</p>
                <p className="text-2xl font-bold mt-1">14–17시</p>
                <p className="text-sm mt-1 opacity-90">오후 골든타임</p>
            </div>

            {/* Stats bottom */}
            <div className="grid grid-cols-2 gap-3">
                <div className="bg-purple-50 dark:bg-purple-900/30 border border-purple-100 dark:border-purple-700 rounded-xl py-4 flex flex-col items-center shadow-sm transition-colors">
                    <span className="text-lg font-bold text-purple-600 dark:text-purple-300">
                        5.2
                    </span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                        일평균(h)
                    </span>
                </div>

                <div className="bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-700 rounded-xl py-4 flex flex-col items-center shadow-sm transition-colors">
                    <span className="text-lg font-bold text-indigo-600 dark:text-indigo-300">
                        7일
                    </span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                        연속 이용
                    </span>
                </div>
            </div>
        </div>
    );
}
