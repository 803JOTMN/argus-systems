import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/components/supabaseClient';
import { createPageUrl } from '@/utils';

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');

      if (!code) {
        navigate(createPageUrl('login'));
        return;
      }

      try {
        await supabase.auth.exchangeCodeForSession(code);
        navigate(createPageUrl('dashboard'));
      } catch (error) {
        console.error('Auth error:', error);
        navigate(createPageUrl('login'));
      }
    };

    handleCallback();
  }, [navigate]);

  return <div className="min-h-screen flex items-center justify-center"><p>Authenticating...</p></div>;
}