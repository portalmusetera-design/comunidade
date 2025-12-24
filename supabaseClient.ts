
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://exwfhabvhmglczxbkisp.supabase.co';
const supabaseAnonKey = 'sb_publishable_S_VgaaThW4a1wwRpmoEZHw_EXl1-Hnx';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
