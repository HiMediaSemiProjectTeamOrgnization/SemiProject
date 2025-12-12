import { use, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import MyPageCheckPw from "./MyPageCheckPw";

export default function MyPageEdit() {
    const navigate = useNavigate();

    const [user, setUser] = useState({});

    const [newEmail, setNewEmail] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [newPin, setNewPin] = useState("");
    const [confirmPin, setConfirmPin] = useState("");

    const [canModify, setCanModify] = useState(false);

    const loginCheck = async () => {
        const res = await fetch(`/api/web/me`, { credentials: 'include' });
        if (!res.ok) {
            return navigate("/web/login");
        } else {
            const data = await res.json();
            setUser({
                name: data.name,
                email: data.email,
                time: data.total_mileage
            });
        }
    };

    useEffect(() => {
        loginCheck();
    }, []);

    // 비밀번호 확인 페이지에서 스크롤 잠금처리 
    useEffect(() => {
        window.scrollTo(0, 0);

        if (!canModify) {
            // 비밀번호 확인 모달이 떠 있는 상태 → 스크롤 막기
            document.body.style.overflow = "hidden";
        } else {
            // 모달이 사라짐 → 스크롤 다시 활성화
            document.body.style.overflow = "auto";
        }

        // 혹시 언마운트될 경우 대비
        return () => {
            document.body.style.overflow = "auto";
        };
    }, [canModify]);


    // 이메일 변경
    const handleEmailSubmit = async (e) => {
        e.preventDefault();

        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

        // 검증
        // 1-1. 변경할 이메일 미입력
        if (!newEmail) return alert("변경하실 이메일을 입력하세요.");
        // 1-2. 이메일 유효성 검사 탈락
        if (!emailRegex.test(newEmail)) return alert("유효한 이메일 주소를 입력하세요.");

        try {
            const res = await fetch("/api/web/mypage/modify/email", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: newEmail })
            });

            if (res.ok) {
                const req = await res.json();
                alert(req.message);
                setNewEmail("");
            } else {
                const errReq = await res.json();
                alert(errReq.detail);
            }
        }
        catch (err) {
            console.log(err);
        }
    };

    // 변경할 이메일 제어
    const handleEmailChange = (e) => {
        setNewEmail(e.target.value);
    }

    // 비밀번호 변경
    const handlePasswordSubmit = async (e) => {
        e.preventDefault();

        // 검증
        // 1-1. 변경할 비밀번호 미입력
        if (!newPassword) return alert("변경하실 비밀번호를 입력하세요.");
        // 1-2. 변경할 비밀번호 확인 미입력 또는 변경할 비밀번호와 미일치
        if (newPassword != confirmPassword) return alert("비밀번호와 비밀번호 확인의 값이 일치하지 않습니다.");

        try {
            const res = await fetch("/api/web/mypage/modify/password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ password: newPassword })
            });

            if (res.ok) {
                const req = await res.json();
                alert(req.message);
                setNewPassword("");
                setConfirmPassword("");
            } else {
                const errReq = await res.json();
                alert(errReq.detail);
            }
        }
        catch (err) {
            console.log(err);
        }
    };

    // 변경할 비밀번호 제어
    const handlePasswordChange = (e) => {
        setNewPassword(e.target.value);
    }

    // 변경할 비밀번호 확인 제어
    const handleConfirmPasswordChange = (e) => {
        setConfirmPassword(e.target.value);
    }

    // 핀코드 변경
    const handlePinSubmit = async (e) => {
        e.preventDefault();

        if (!newPin) return alert("변경하실 핀코드를 입력하세요.");
        if (newPin != confirmPin) return alert("핀코드와 핀코드 확인의 값이 일치하지 않습니다.");

        try {
            const res = await fetch("/api/web/mypage/modify/pin", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ pin: newPin, currentPin })
            });

            if (res.ok) {
                const req = await res.json();
                alert(req.message);
                setNewPin("");
                setConfirmPin("");
            } else {
                const errReq = await res.json();
                alert(errReq.detail);
            }
        }
        catch (err) {
            console.log(err);
        }
    };

    // 변경할 핀코드 제어
    const handlePinChange = (e) => {
        setNewPin(e.target.value);
    }

    // 변경할 핀코드 확인 제어
    const handleConfirmPinChange = (e) => {
        setConfirmPin(e.target.value);
    }


    return (
        <div className="p-4 space-y-8 bg-[#f0f4f8] dark:bg-slate-900/50 dark:text-gray-200 transition-colors">
            {!canModify && <MyPageCheckPw setCanModify={setCanModify} userName={user.name} />}

            {/* Page Title */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    내 정보 수정
                </h1>
                <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                    본인의 정보를 확인하고 수정하세요
                </p>
            </div>

            <div className="bg-white dark:bg-slate-900/50 rounded-2xl shadow-md mb-4 p-6 transition-colors">
                <div className="space-y-2">

                    {/* 제목 영역 */}
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-gray-500 dark:text-gray-400 text-sm">이름</p>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 transition">
                                {user.name}
                            </h3>
                        </div>

                        <div className="text-right">
                            <p className="text-gray-500 dark:text-gray-400 text-sm">보유 시간</p>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 transition">
                                {user.time}분
                            </h3>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900/50 rounded-2xl shadow-md p-6 space-y-4 border border-gray-200 dark:border-gray-700">
                <h1 className="text-xl font-semibold text-gray-800 dark:text-gray-100
               flex items-center gap-2 mb-4">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 dark:bg-blue-400"></span>
                    이메일 변경
                </h1>
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">변경할 이메일</p>
                <input
                    type="email"
                    className="w-full p-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 
                       text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    value={newEmail}
                    onChange={handleEmailChange}
                />

                <button
                    className="w-full mt-3 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 
                       dark:bg-blue-500 dark:hover:bg-blue-600 transition"
                    onClick={handleEmailSubmit}
                >
                    이메일 변경
                </button>


                <h1 className="text-xl font-semibold text-gray-800 dark:text-gray-100
               flex items-center gap-2 mb-4">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 dark:bg-blue-400"></span>
                    비밀번호 변경
                </h1>
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">변경할 비밀번호</p>
                <input
                    type="password"
                    className="w-full p-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 
                       text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    value={newPassword}
                    onChange={handlePasswordChange}
                />

                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">비밀번호 확인</p>
                <input
                    type="password"
                    className="w-full p-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 
                       text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    value={confirmPassword}
                    onChange={handleConfirmPasswordChange}
                />

                <button
                    className="w-full mt-3 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 
                       dark:bg-blue-500 dark:hover:bg-blue-600 transition"
                    onClick={handlePasswordSubmit}
                >
                    비밀번호 변경
                </button>

                <h1 className="text-xl font-semibold text-gray-800 dark:text-gray-100
               flex items-center gap-2 mb-4">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 dark:bg-blue-400"></span>
                    핀코드 변경
                </h1>

                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">변경할 핀코드</p>
                <input
                    type="text"
                    maxLength={4}
                    inputMode="numeric"
                    pattern="\d*"
                    className="w-full p-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 
                       text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    value={newPin}
                    onChange={handlePinChange}
                />

                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">핀코드 확인</p>
                <input
                    type="text"
                    maxLength={4}
                    inputMode="numeric"
                    pattern="\d*"
                    className="w-full p-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 
                       text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    value={confirmPin}
                    onChange={handleConfirmPinChange}
                />

                <button
                    className="w-full mt-3 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 
                       dark:bg-blue-500 dark:hover:bg-blue-600 transition"
                    onClick={handlePinSubmit}
                >
                    핀코드 변경
                </button>
            </div>
        </div>

    );
}

