import { createBrowserRouter } from "react-router-dom";
import './App.css';
import Layout from "./components/Layout.jsx";
import Home from "./pages/Home.jsx";
import About from "./pages/About.jsx";

/*
############# 라우터 추가 방법
############# path는 경로 element는 컴포넌트
############# 주석으로 페이지명 서술 권장
############# 헤더, 푸터 적용하는 페이지면 children 안에 추가
############# 헤더, 푸터 적용하면 안하는 페이지면 children 바깥 -> 바깥에 추가
{
    path: 'page',
    element: <Page />
},
*/
const router = createBrowserRouter([
    {
        path: '/',
        element: <Layout />,        // 헤더, 푸터 관리하는 컴포넌트
        children: [
            {
                index: true,
                element: <Home />,  // 메인 화면 - '/'
            },
            {
                path: 'about',
                element: <About />, // 임시 소개 페이지 - '/about'
            },
        ],
    },
]);

export default router;