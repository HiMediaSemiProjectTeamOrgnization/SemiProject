import { FaChair } from "react-icons/fa";
import { MdLocationOn, MdTrendingUp } from "react-icons/md";

export default function SeatAnalysis() {
    const seatList = [
        { rank: 1, seat: "A-12", hours: "45.5h", tag: "창가" },
        { rank: 2, seat: "C-08", hours: "38.2h", tag: "코너" },
        { rank: 3, seat: "B-15", hours: "32.7h", tag: "고립" },
    ];

    const preferences = [
        { label: "창가", percent: 28, color: "bg-blue-500 dark:bg-blue-400" },
        { label: "코너", percent: 24, color: "bg-purple-500 dark:bg-purple-400" },
        { label: "고립", percent: 22, color: "bg-pink-500 dark:bg-pink-400" },
        { label: "통로", percent: 12, color: "bg-orange-500 dark:bg-orange-400" },
    ];

    return (
        <div className="w-full bg-white dark:bg-gray-900 rounded-2xl shadow-md p-6 transition-colors">
            {/* Header */}
            <div className="flex items-center gap-2 mb-4">
                <FaChair className="text-purple-500 dark:text-purple-300" />
                <h1 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                    좌석 취향 분석
                </h1>
            </div>

            {/* Sub title */}
            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-4">
                <MdLocationOn className="text-gray-400 dark:text-gray-500" />
                <span className="text-sm">자주 쓴 좌석</span>
            </div>

            {/* Top Seats */}
            <div className="grid grid-cols-3 gap-4 mb-10">
                {seatList.map((item) => (
                    <div
                        key={item.rank}
                        className="relative p-4 rounded-xl border border-gray-200 dark:border-gray-700 
                        bg-gray-50 dark:bg-gray-800/40 transition-colors"
                    >
                        {/* Rank Badge */}
                        <div className="absolute -top-3 -right-3 w-8 h-8 flex items-center justify-center 
                            bg-indigo-600 dark:bg-indigo-500 text-white rounded-full text-sm font-semibold shadow">
                            {item.rank}
                        </div>

                        <p className="text-lg font-semibold text-gray-700 dark:text-gray-100">
                            {item.seat}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{item.hours}</p>

                        <span className="inline-block mt-2 px-3 py-1 text-xs rounded-md 
                            bg-indigo-100 dark:bg-indigo-700/40 
                            text-indigo-600 dark:text-indigo-300 font-medium transition-colors">
                            {item.tag}
                        </span>
                    </div>
                ))}
            </div>

            {/* Preference Bars */}
            <div className="mb-8">
                <h2 className="font-semibold text-gray-700 dark:text-gray-100 mb-4">좌석 성향</h2>

                {preferences.map((p) => (
                    <div key={p.label} className="mb-4">
                        <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-600 dark:text-gray-300">{p.label}</span>
                            <span className="text-gray-600 dark:text-gray-300">{p.percent}%</span>
                        </div>

                        <div className="w-full bg-gray-200 dark:bg-gray-700 h-2 rounded-full">
                            <div
                                className={`${p.color} h-2 rounded-full transition-all`}
                                style={{ width: `${p.percent}%` }}
                            ></div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Bottom Notice */}
            <div className="rounded-xl bg-pink-50 dark:bg-pink-900/30 
                p-4 border border-pink-200 dark:border-pink-700 
                flex items-start gap-3 transition-colors">
                <MdTrendingUp className="text-pink-500 dark:text-pink-300 text-xl mt-0.5" />
                <div>
                    <p className="text-sm font-semibold text-pink-600 dark:text-pink-300 mb-1">
                        최근 변화
                    </p>
                    <p className="text-sm text-pink-600 dark:text-pink-300">
                        고립석 비율이 늘었어요. 더 차분한 환경을 찾고 계신가요?
                    </p>
                </div>
            </div>
        </div>
    );
}
