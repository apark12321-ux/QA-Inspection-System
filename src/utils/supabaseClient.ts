/**
 * Supabase Cloud Database Integration Utility
 * Supports both custom Supabase credentials (URL + Anon Key) and fallback
 * to the Node.js backend persistent JSON store.
 */

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  connected: boolean;
}

const SUPABASE_STORAGE_KEY = 'video_review_supabase_config_v1';

export function getStoredSupabaseConfig(): SupabaseConfig {
  try {
    const raw = localStorage.getItem(SUPABASE_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn('Failed to parse stored Supabase config:', e);
  }

  // Check Vite environment variables if available
  const envUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
  const envKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

  return {
    url: envUrl,
    anonKey: envKey,
    connected: Boolean(envUrl && envKey)
  };
}

export function saveSupabaseConfig(config: SupabaseConfig): void {
  try {
    localStorage.setItem(SUPABASE_STORAGE_KEY, JSON.stringify(config));
  } catch (e) {
    console.error('Failed to save Supabase config to localStorage:', e);
  }
}

export function clearSupabaseConfig(): void {
  try {
    localStorage.removeItem(SUPABASE_STORAGE_KEY);
  } catch (e) {
    console.error('Failed to clear Supabase config:', e);
  }
}
