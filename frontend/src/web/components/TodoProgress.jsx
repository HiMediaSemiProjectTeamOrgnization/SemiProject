export default function TodoProgress({ todo, totalMinutes, goalMinutes }) {
    const safeGoal = Math.max(1, goalMinutes);
    let percent = Math.floor((totalMinutes / safeGoal) * 100);
    if (!isFinite(percent) || percent < 0) percent = 0;
    if (percent > 100) percent = 100;

    const formatTime = (mins) => {
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        if (h > 0) return `${h}시간 ${m}분`;
        if (m > 0) return `${m}분`;
        return "0분";
    };

    return (
        <div className="bg-white dark:bg-slate-900/50 rounded-2xl shadow-md mb-4 p-6 transition-colors">
            <div className="space-y-2">

                {/* 제목 영역 */}
                <div className="flex items-start justify-between">
                    <div>
                        <p className="text-gray-500 dark:text-gray-400 text-sm">현재 도전중인 도전과제</p>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 transition">
                            {todo ?? "선택한 도전과제가 없습니다."}
                        </h3>
                    </div>

                    <div className="text-right">
                        <p className="text-sm text-gray-500 dark:text-gray-400">달성률</p>
                        <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                            {percent}%
                        </div>
                    </div>
                </div>

                {/* 프로그레스 바 */}
                <div className="mt-3">
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">

                        {/* progress fill */}
                        <div
                            className="h-3 rounded-full transition-all duration-700 ease-out"
                            style={{
                                width: `${percent}%`,
                                background: `
                                    linear-gradient(90deg, 
                                        rgba(59,130,246,1) 0%, 
                                        rgba(96,165,250,1) 100%
                                    )`,
                                filter: "brightness(var(--tw-brightness,1))",
                            }}
                        />
                    </div>

                    {/* 상세 텍스트 */}
                    <div className="flex justify-between items-center mt-2 text-sm text-gray-500 dark:text-gray-400">
                        <div>
                            누적:
                            <span className="text-gray-700 dark:text-gray-200 font-medium">
                                {formatTime(totalMinutes)}
                            </span>
                        </div>
                        <div>
                            목표:
                            <span className="text-gray-700 dark:text-gray-200 font-medium">
                                {formatTime(goalMinutes)}
                            </span>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}