import { Link } from "react-router-dom";
import { createPageUrl } from "./lib/utils";
import argusLogo from "/src/images/argus-logo.png";

export default function Layout({ children, currentPageName }) {
  const menuItems = [
    { name: "Dashboard", page: "dashboard" },
    { name: "Activity Logs", page: "activitylogs" },
    { name: "Settings", page: "settings" }
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200 py-4">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center h-16 gap-8">
            <img
                src={argusLogo}
                alt="ARGUS Systems"
                className="h-56 w-auto"/>
            <div className="flex gap-1">
              {menuItems.map((item) => (
                <Link
                  key={item.page}
                  to={createPageUrl(item.page)}
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
          </div>
        </div>
      </nav>
      {children}
    </div>
  );
}