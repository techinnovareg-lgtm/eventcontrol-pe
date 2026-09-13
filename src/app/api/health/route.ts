import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client';

export async function GET() {
  try {
    const supabase = createClient();
    const { data, error } = await supabase.from('events').select('id').limit(1);

    return NextResponse.json({
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      database: error ? 'contingency_active' : 'connected_online',
    });
  } catch (err: any) {
    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: 'contingency_fallback',
    });
  }
}
