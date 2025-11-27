import { createBrowserRouter } from 'react-router-dom';
import './App.css';
import WebLayout from './web/components/WebLayout.jsx';
import Home from './Home.jsx';
import KioskApp from './kiosk/KioskApp.jsx'
import TicketList from './web/pages/TicketList.jsx';
import Payments from './web/pages/Payment.jsx';
import WebIndex from './web/pages/WebIndex.jsx';

const router = createBrowserRouter([
    {
        path: '/',
        element: <Home />,
    },
    {
        path: '/kiosk',
        element: <KioskApp />,
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