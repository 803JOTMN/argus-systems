
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://unvyfagtklhhkbotjjio.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVudnlmYWd0a2xoaGtib3RqamlvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5NjczNjQsImV4cCI6MjA4NjU0MzM2NH0.ObEmxqAdKGmVku9OTEDvqDvUC8_Vsv65aT04ddM_BRo';

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});
