import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import StudyTimeSummary from "../components/StudyTimeSummary";
import SeatAnalysis from "../components/SeatAnalysis";
import FocusAnalysis from "../components/FocusAnalysis";
import TodoProgress from "../components/TodoProgress";
import TodoModal from "../components/TodoModal";

function MyPage() {
    const location = useLocation();
    const navigate = useNavigate();
    const [user, setUser] = useState({});
    const [todo, setTodo] = useState({});

    const [todoList, setTodoList] = useState([]);
    const [showTodoModal, setShowTodoModal] = useState(false);

    const getUserData = async () => {
        const res = await fetch(`/api/web/mypage`, { credentials: 'include' });
        if (res.ok) {
            const data = await res.json();
            // setUser({
            //     "name": data.user.name,
            //     "email": data.user.email,
            //     "password": data.user.password,
            //     "phone": data.user.phone,
            //     "mileage": data.user.total_mileage,
            //     "save_time": data.user.saved_time_minute
            // });

            if (data.todo) {
                setTodo({
                    "name": data.todo.todo_name,
                    "target_value": data.todo.target_value,
                    "current_value": data.todo.current_value
                });
            } else {
                const res = await fetch(`/api/web/mypage/todo/selected`, { credentials: 'include' });
                const data = await res.json();
                setTodoList(data);
                setShowTodoModal(true);
            }


        } else {
            navigate('/web');
        }
    };

    useEffect(() => {
        getUserData();
    }, []);

    return (
        <div className="p-4 space-y-8 bg-[#f0f4f8] dark:bg-slate-900 text-blue-1000 dark:text-blue-300 transition-colors">

            {showTodoModal && (
                <TodoModal
                    isOpen={showTodoModal}
                    onClose={() => setShowTodoModal(false)}
                    todoList={todoList}
                />
            )}

            {/* Page Title */}
            <div>
                <h1 className="text-3xl font-bold">마이페이지</h1>
                <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                    학습 패턴과 좌석 취향을 분석해보세요
                </p>
            </div>

            {!showTodoModal && (
                <TodoProgress todo={todo.name} goalMinutes={todo.target_value} totalMinutes={todo.current_value} />

            )}

            {/* Background Section */}
            <div className="transition-colors min-h-screen rounded-xl">
                <div className="grid grid-cols-3 gap-6">

                    {/* LEFT 2 columns */}
                    <div className="col-span-2 flex flex-col gap-6">
                        <StudyTimeSummary />
                        <SeatAnalysis />
                    </div>

                    {/* RIGHT 1 column */}
                    <div className="col-span-1 flex flex-col gap-6">
                        <FocusAnalysis />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default MyPage;
