import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaEnvelope, FaKey, FaLock, FaArrowLeft } from "react-icons/fa";

export default function MyPageEdit() {
    const navigate = useNavigate();

    const [currentEmail, setCurrentEmail] = useState("");
    const [newEmail, setNewEmail] = useState("");
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [currentPin, setCurrentPin] = useState("");
    const [newPin, setNewPin] = useState("");
    const [confirmPin, setConfirmPin] = useState("");

    const loginCheck = async () => {
        const res = await fetch(`/api/web/me`, { credentials: 'include' });
        if (!res.ok) {
            navigate("/web/login");
            return;
        }
    };

    useEffect(() => {
        loginCheck();
    }, []);

    // 이메일 변경
    const handleEmailSubmit = async (e) => {
        e.preventDefault();

        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

        // 검증
        // 1-1. 현재 이메일 미입력
        if (!currentEmail) return alert("현재 이메일을 입력하세요.");
        // 1-2. 변경할 이메일 미입력
        if (!newEmail) return alert("변경하실 이메일을 입력하세요.");
        // 1-3. 이메일 유효성 검사 탈락
        if (!emailRegex.test(newEmail)) return alert("유효한 이메일 주소를 입력하세요.");
        // 1-4. 이미 사용중인 이메일(현재 이메일로 변경시도)
        if (currentEmail === newEmail) return alert("현재 이메일과 동일한 이메일로 변경할 수 없습니다.");

        try {
            const res = await fetch("/api/web/mypage/modify/email", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: newEmail, currentEmail: currentEmail })
            });

            if (res.ok) {
                const req = await res.json();
                alert(req.message);
            } else {
                const errReq = await res.json();
                alert(errReq.detail);
            }
        }
        catch (err) {
            console.log(err);
        }
    };

    // 현재 이메일 제어
    const handleCurrentEmailChange = (e) => {
        setCurrentEmail(e.target.value);
    }

    // 변경할 이메일 제어
    const handleEmailChange = (e) => {
        setNewEmail(e.target.value);
    }

    // 비밀번호 변경
    const handlePasswordSubmit = async (e) => {
        e.preventDefault();

        // 검증
        // 1-1. 현재 비밀번호 미입력 
        if (!currentPassword) return alert("현재 비밀번호를 입력하세요.");
        // 1-2. 변경할 비밀번호 미입력
        if (!newPassword) return alert("변경하실 비밀번호를 입력하세요.");
        // 1-3. 변경할 비밀번호 확인 미입력 또는 변경할 비밀번호와 미일치
        if (newPassword != confirmPassword) return alert("비밀번호와 비밀번호 확인의 값이 일치하지 않습니다.");
        // 1-4. 이미 사용중인 비밀번호(현재 비밀번호로 변경 시도)
        if (currentPassword === newPassword) return alert("현재 비밀번호와 동일한 비밀번호로 변경할 수 없습니다.");

        try {
            const res = await fetch("/api/web/mypage/modify/password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ password: newPassword, currentPassword: currentPassword })
            });

            if (res.ok) {
                const req = await res.json();
                alert(req.message);
            } else {
                const errReq = await res.json();
                alert(errReq.detail);
            }
        }
        catch (err) {
            console.log(err);
        }
    };

    // 현재 비밀번호 제어
    const handleCurrentPasswordChange = (e) => {
        setCurrentPassword(e.target.value);
    }

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

        if (!currentPin) return alert("현재 핀코드를 입력하세요.");
        if (!newPin) return alert("변경하실 핀코드를 입력하세요.");
        if (newPin != confirmPin) return alert("핀코드와 핀코드 확인의 값이 일치하지 않습니다.");
        if (currentPin == newPin) return alert("현재 핀코드와 동일한 핀코드로 변경할 수 없습니다.");

        try {
            const res = await fetch("/api/web/mypage/modify/pin", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ pin: newPin, currentPin })
            });

            if (res.ok) {
                const req = await res.json();
                alert(req.message);
                setCurrentPin("");
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

    // 현재 핀코드 제어
    const handleCurrentPinChange = (e) => {
        setCurrentPin(e.target.value);
    }

    // 변경할 핀코드 제어
    const handlePinChange = (e) => {
        setNewPin(e.target.value);
    }

    // 변경할 핀코드 확인 제어
    const handleConfirmPinChange = (e) => {
        setConfirmPin(e.target.value);
    }

    const InputCard = ({ title, icon: Icon, children }) => (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-300 dark:border-gray-700 p-6 transition-colors">
            <div className="flex items-center gap-2 mb-4">
                <Icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-200">{title}</h3>
            </div>
            {children}
        </div>
    );

    return (
        <div className="p-4 space-y-8 bg-[#f0f4f8] dark:bg-slate-900 dark:text-gray-200 transition-colors">

            {/* Page Title */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    내 정보 수정
                </h1>
                <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                    본인의 정보를 확인하고 수정하세요
                </p>
            </div>

            {/* 이메일 변경 */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6 space-y-4 border border-gray-200 dark:border-gray-700">
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">현재 이메일</p>
                <input
                    type="email"
                    className="w-full p-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 
                       text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    value={currentEmail}
                    onChange={handleCurrentEmailChange}
                />

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
            </div>

            {/* 비밀번호 변경 */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6 space-y-4 border border-gray-200 dark:border-gray-700">

                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">현재 비밀번호</p>
                <input
                    type="password"
                    className="w-full p-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 
                       text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    value={currentPassword}
                    onChange={handleCurrentPasswordChange}
                />

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
            </div>

            {/* 핀코드 변경 */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6 space-y-4 border border-gray-200 dark:border-gray-700">

                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">현재 핀코드 입력</p>
                <input
                    type="text"
                    maxLength={4}
                    inputMode="numeric"
                    pattern="\d*"
                    className="w-full p-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 
                       text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    value={currentPin}
                    onChange={handleCurrentPinChange}
                />

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

