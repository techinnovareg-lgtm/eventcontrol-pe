/**
 * Authoritative Supabase Central Configuration
 * Provides guaranteed fallback constants to prevent environment variable
 * dropouts in serverless environments (Vercel, Cloudflare, Docker).
 */

export const SUPABASE_URL = 
  process.env.NEXT_PUBLIC_SUPABASE_URL || 
  'https://tfmzikmivzxaxntdkleq.supabase.co';

export const SUPABASE_ANON_KEY = 
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRmbXppa21pdnp4YXhudGRrbGVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg1NzQzNzIsImV4cCI6MjEwNDE1MDM3Mn0.z6s7nFEtub4KnZvZ1W4b4g3Pypj9AvywpjeEfzRQ2_I';
