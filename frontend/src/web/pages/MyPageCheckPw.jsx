import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function MyPageCheckPw({ setCanModify, userName }) {
    const navigate = useNavigate();

    const [password, setPassword] = useState("");

    const handlePassword = (e) => {
        setPassword(e.target.value);
    };

    const validPassword = async (e) => {
        if (!password) return alert("비밀번호를 입력하세요.");

        e.preventDefault();
        try {
            const res = await fetch("/api/web/mypage/check/password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ password })
            });

            if (res.ok) {
                const result = await res.json();
                if (!result) return alert("비밀번호를 확인하세요.");
                setCanModify(result);
            }
        }
        catch (err) {
            console.log(err);
        }
    };

    return (
        <div className="h-screen flex flex-col items-center mt-50 
                        bg-[#f0f4f8] dark:bg-slate-900/50
                        text-gray-900 dark:text-gray-200 
                        px-4 transition-colors duration-300">

            <div className="
                w-full max-w-lg 
                bg-white dark:bg-slate-900/50
                p-10 rounded-2xl shadow-2xl 
                animate-fadeIn scale-anim 
                border border-gray-200 dark:border-gray-700
                transition-colors duration-300
            ">

                <h1 className="text-3xl font-extrabold mb-4 
                               text-gray-900 dark:text-white 
                               text-center">
                    비밀번호 확인
                </h1>

                <p className="text-gray-600 dark:text-gray-300 
                              text-center text-sm mb-10 leading-relaxed">
                    <span className="font-semibold">{userName}</span>님의 회원정보 보호를 위해
                    비밀번호를 한 번 더 입력해 주세요.
                </p>

                {/* 비밀번호 입력 */}
                <form className="space-y-3 mb-8">
                    <label className="block text-sm font-medium 
                                      text-gray-700 dark:text-gray-300">
                        비밀번호 입력
                    </label>

                    <input
                        type="password"
                        className="
                            w-full px-5 py-3 rounded-xl 
                            border border-gray-300 dark:border-gray-700 
                            bg-gray-50 dark:bg-[#0f172a]
                            text-gray-900 dark:text-gray-100
                            focus:outline-none focus:ring-2 focus:ring-blue-500 
                            transition
                        "
                        placeholder="비밀번호를 입력하세요"
                        onChange={handlePassword}
                        onKeyDown={(e) => { if (e.key === 'Enter') validPassword(e); }}
                    />
                </form>

                {/* 버튼 */}
                <button
                    className="
                        w-full py-3.5 rounded-xl 
                        bg-blue-500 hover:bg-blue-600 
                        text-white font-semibold shadow-md transition 
                        active:scale-[0.98]
                    "
                    onClick={validPassword}
                >
                    확인
                </button>
            </div>

        </div>
    );
}
