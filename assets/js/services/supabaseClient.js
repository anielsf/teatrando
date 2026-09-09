/**
 * Cliente de Supabase para Teatrando
 * Se importa desde un CDN (esm.sh) porque el frontend corre como
 * módulos ES6 nativos en el navegador, sin bundler ni build step.
 * Un import de paquete npm ("@supabase/supabase-js") NO es resoluble
 * por el navegador y rompe toda la carga de app.js.
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { CONFIG } from '../config.js';

export const supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);