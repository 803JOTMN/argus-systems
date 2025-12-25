import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './Layout';
import Dashboard from './pages/Dashboard';
import ActivityLogs from './pages/ActivityLogs';
import Settings from './pages/Settings';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Layout currentPageName="dashboard"><Dashboard /></Layout>} />
        <Route path="/activitylogs" element={<Layout currentPageName="activitylogs"><ActivityLogs /></Layout>} />
        <Route path="/settings" element={<Layout currentPageName="settings"><Settings /></Layout>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;