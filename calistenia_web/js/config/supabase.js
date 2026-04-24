import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

// ============================
// SUPABASE CONFIG
// ============================
export const SUPABASE_URL = 'https://qnjutwgnoythmxmvrijy.supabase.co';
export const SUPABASE_ANON_KEY = 'sb_publishable_j12MaBN7UScMEnBvyfGrag_v90DsQBs';
export const TABLE_NAME = 'ranking';

export const CACHE_KEY = 'calibeast_ranking_cache';
export const PLAYER_NAME_KEY = 'calibeast_player_name';
export const PLAYER_TOKEN_KEY = 'calibeast_player_token';

export const hasSupabaseConfig = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
