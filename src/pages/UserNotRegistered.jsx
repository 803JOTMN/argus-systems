import { AlertCircle, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/components/supabaseClient";

export default function UserNotRegistered() {
  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <img 
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/694b6cd689b4a60f9910b640/64f247e7c_ArgusHomePageLogo.png"
            alt="ARGUS Systems"
            className="h-64 mx-auto"
          />
        </div>

        {/* Access Restricted Card */}
        <div className="bg-white border border-amber-200 rounded-2xl p-8 shadow-lg">
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <AlertCircle className="w-16 h-16 text-amber-500" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Access Restricted</h1>
            <p className="text-slate-600">
              Your account is not registered in the system. Please contact your administrator to request access.
            </p>
            <Button 
              onClick={handleLogout} 
              className="w-full bg-gradient-to-r from-teal-600 to-green-600 hover:from-teal-700 hover:to-green-700 text-white font-semibold py-2.5 rounded-lg flex items-center justify-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Back to Login
            </Button>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-slate-400 text-xs mt-6">
          Protected by enterprise-grade security
        </p>
      </div>
    </div>
  );
}