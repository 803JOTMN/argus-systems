import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/components/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LogIn, Mail } from "lucide-react";

export default function Home() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [linkSent, setLinkSent] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { error: signInError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: window.location.origin + "/dashboard",
        },
      });

      if (signInError) {
        setError(signInError.message);
        setLoading(false);
        return;
      }

      setLinkSent(true);
      setLoading(false);
    } catch (err) {
      setError(err.message || "Login failed");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-2">
          <img 
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/694b6cd689b4a60f9910b640/64f247e7c_ArgusHomePageLogo.png"
            alt="ARGUS Systems"
            className="h-96 mx-auto"
          />
        </div>

        {/* Login Card */}
        <div className="bg-white border border-teal-200 rounded-2xl p-8 shadow-lg">
          {linkSent ? (
            <div className="space-y-4 text-center">
              <div className="flex justify-center">
                <Mail className="w-12 h-12 text-teal-600" />
              </div>
              <h2 className="text-xl font-semibold text-slate-900">Check your email</h2>
              <p className="text-sm text-slate-600">
                We've sent a magic link to <strong>{email}</strong>. Click the link to sign in.
              </p>
              <Button
                type="button"
                onClick={() => setLinkSent(false)}
                variant="outline"
                className="w-full"
              >
                Back to login
              </Button>
            </div>
          ) : (
            <form onSubmit={handleLogin} className="space-y-5">
              {/* Email Field */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Email Address
                </label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="bg-slate-50 border-teal-300 text-slate-900 placeholder:text-slate-400 focus:border-teal-500 focus:ring-teal-500/20"
                />
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-400">
                  {error}
                </div>
              )}

              {/* Send Link Button */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-teal-600 to-green-600 hover:from-teal-700 hover:to-green-700 text-white font-semibold py-2.5 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
              >
                <Mail className="w-4 h-4" />
                {loading ? "Sending..." : "Send Password-less Login"}
              </Button>
            </form>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-slate-400 text-xs mt-6">
          Protected by enterprise-grade security
        </p>
      </div>
    </div>
  );
}