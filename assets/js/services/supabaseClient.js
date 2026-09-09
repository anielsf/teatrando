/**
 * Cliente de Supabase para Teatrando
 * Requiere: npm install @supabase/supabase-js
 */
import { createClient } from '@supabase/supabase-js';
import { CONFIG } from '../config.js';

export const supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);
