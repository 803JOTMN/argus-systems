import { Link, useNavigate } from "react-router-dom";
      import { LogOut } from "lucide-react";
      import { useState, useEffect } from "react";
      import { supabase } from "@/components/supabaseClient";
      import UserNotRegistered from "@/pages/UserNotRegistered";

export default function Layout({ children, currentPageName }) {
        const navigate = useNavigate();
        const [userRole, setUserRole] = useState(null);
        const [isAllowed, setIsAllowed] = useState(true);

        useEffect(() => {
          const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
              const allowedEmails = ['mohammadnurhafizul@gmail.com'];
              if (!allowedEmails.includes(user.email)) {
                setIsAllowed(false);
                return;
              }
              setIsAllowed(true);
              const adminEmails = ['mohammadnurhafizul@gmail.com'];
              if (adminEmails.includes(user.email)) {
                setUserRole('Administrator');
              } else {
                setUserRole('user');
              }
            }
          };
          getUser();
        }, []);
  
  const handleLogout = async () => {
          await supabase.auth.signOut();
          navigate("/", { replace: true });
          window.location.reload();
        };

  const menuItems = [
    { name: "Dashboard", page: "dashboard", path: "/dashboard" },
    { name: "Activity Logs", page: "activitylogs", path: "/activitylogs" },
    { name: "Settings", page: "settings", path: "/settings" }
  ];

  // Pages that should render without the layout
  const noLayoutPages = ["home", "usernotregistered"];
  if (noLayoutPages.includes(currentPageName?.toLowerCase())) {
    return children;
  }

  // Block unauthorized users
  if (!isAllowed) {
    navigate("/usernotregistered", { replace: true });
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center h-16 gap-8">
            <img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/694b6cd689b4a60f9910b640/c916b495f_argus-logo.png"
              alt="ARGUS Systems"
              className="h-48"
            />
            <div className="flex gap-1 flex-1">
              {menuItems.map((item) => (
                <Link
                  key={item.page}
                  to={item.path}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    currentPageName === item.page
                      ? "bg-slate-900 text-white"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </div>
            {userRole && (
              <span className="text-sm text-slate-600">Welcome, {userRole}</span>
            )}
            <button 
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </nav>
      {children}
    </div>
  );
}