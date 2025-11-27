import { createBrowserRouter } from 'react-router-dom';
import './App.css';
import WebLayout from './components/WebLayout.jsx';
import Home from './pages/Home.jsx';
import Test from './pages/Test.jsx';
import TicketList from './web/pages/TicketList.jsx';
import Payments from './web/pages/Payment.jsx';
import WebIndex from './web/pages/WebIndex.jsx';

/*
############# 라우터 추가 방법
############# path는 경로 element는 컴포넌트
############# 주석으로 페이지명 서술 권장
############# 헤더, 푸터 적용하는 페이지면 children 안에 추가
############# 헤더, 푸터 적용하면 안하는 페이지면 children 바깥, 바깥에 추가
{
    path: 'page',
    element: <Page />
},
*/
const router = createBrowserRouter([
    {
        path: '/',
        index: true,
        element: <Home />,
    },
    {
        path: 'test',
        element: <WebLayout />,
        children: [
            {
                index: true,
                element: <Test />,
            },
            {
                path: 'test',
                element: <Test />,
            },
        ],
    },
    {
        path: 'web',
        element: <WebLayout />,
        children: [
            {
                index: true,
                element: <WebIndex />,
            },
            {
                path: 'ticket',
                element: <TicketList />
            },
            {
                path: 'payment',
                element: <Payments />
            }
        ],
    },

]);

export default router;