import { Link } from "react-router-dom";

function WebIndex() {
    return (
        <div>
            <h1>웹 인덱스페이지입니다.</h1>
            <p>사용자가 웹페이지로 접속했을 때 보여질 페이지로 가정하고 제작했습니다.</p>
            <Link to="/web/ticket">이용권 목록</Link >
        </div>

    )
}

export default WebIndex;