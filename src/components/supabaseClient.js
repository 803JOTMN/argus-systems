import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://unvyfagtklhhkbotjjio.supabase.co';
const supabaseKey = 'sb_publishable_Dc3A3R54KD64q5pgcZsxwg_Li7Zfz2o';

export const supabase = createClient(supabaseUrl, supabaseKey);
