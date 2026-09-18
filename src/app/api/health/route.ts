import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json(
      { status: 'error', message: 'Missing Supabase environment variables' },
      { status: 500 }
    );
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false },
    });

    // Make an explicit query to keep Supabase REST API active
    const { data, error } = await supabase.from('events').select('id').limit(1);

    if (error) {
      console.error('[Health Check] Supabase query error:', error);
      return NextResponse.json(
        {
          status: 'error',
          database: 'error',
          message: error.message,
          timestamp: new Date().toISOString(),
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      {
        status: 'ok',
        database: 'connected_online',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error('[Health Check] Unhandled exception:', err);
    return NextResponse.json(
      {
        status: 'error',
        database: 'unreachable',
        message: err?.message || 'Failed to connect to Supabase',
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}

