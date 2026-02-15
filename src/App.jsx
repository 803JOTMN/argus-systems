import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from "./Layout";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import ActivityLogs from "./pages/ActivityLogs";
import Settings from "./pages/Settings";
import UserNotRegistered from "./pages/UserNotRegistered";
import { useState, useEffect } from 'react';
import { supabase } from "@/components/supabaseClient";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
    });

    return () => subscription?.unsubscribe();
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={user ? <Navigate to="/dashboard" replace /> : <Home />} />
        <Route path="/dashboard" element={user ? <Layout currentPageName="dashboard"><Dashboard /></Layout> : <Navigate to="/" replace />} />
        <Route path="/activitylogs" element={user ? <Layout currentPageName="activitylogs"><ActivityLogs /></Layout> : <Navigate to="/" replace />} />
        <Route path="/settings" element={user ? <Layout currentPageName="settings"><Settings /></Layout> : <Navigate to="/" replace />} />
        <Route path="/UserNotRegistered" element={<Layout currentPageName="usernotregistered"><UserNotRegistered /></Layout>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;