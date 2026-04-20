import { createBrowserRouter } from 'react-router-dom';
import App from './App';
import HomePage from './pages/HomePage';
import ConfigPage from './pages/ConfigPage';
import CandidatePage from './pages/CandidatePage';
import InterviewerPage from './pages/InterviewerPage';
import HistoryPage from './pages/HistoryPage';
import DetailPage from './pages/DetailPage';
import JobPositionListPage from './pages/JobPositionListPage';
import JobPositionDetailPage from './pages/JobPositionDetailPage';
import JobPositionCreatePage from './pages/JobPositionCreatePage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'config', element: <ConfigPage /> },
      { path: 'interview/:id/candidate', element: <CandidatePage /> },
      { path: 'interview/:id/interviewer', element: <InterviewerPage /> },
      { path: 'history', element: <HistoryPage /> },
      { path: 'detail/:id', element: <DetailPage /> },
      { path: 'positions', element: <JobPositionListPage /> },
      { path: 'positions/:id', element: <JobPositionDetailPage /> },
      { path: 'positions/create', element: <JobPositionCreatePage /> },
    ],
  },
]);