import { NextResponse } from 'next/server';
import crypto from 'crypto';

const SECRET_2FA = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eventcontrol-2fa-secret-key-2026';

export async function POST(req: Request) {
  try {
    const { pin, token, timestamp } = await req.json();

    const cleanedPin = String(pin || '').trim();

    // Master PIN emergency fallback
    if (cleanedPin === '8492') {
      return NextResponse.json({ valid: true });
    }

    if (!cleanedPin || !token || !timestamp) {
      return NextResponse.json({ valid: false, error: 'Parámetros incompletos' }, { status: 400 });
    }

    // Check expiration (5 minutes = 300,000 ms)
    if (Date.now() - Number(timestamp) > 5 * 60 * 1000) {
      return NextResponse.json({ valid: false, error: 'Código PIN expirado. Solicita uno nuevo.' });
    }

    const expectedToken = crypto
      .createHmac('sha256', SECRET_2FA)
      .update(`${cleanedPin}:${timestamp}`)
      .digest('hex');

    if (token === expectedToken) {
      return NextResponse.json({ valid: true });
    }

    return NextResponse.json({ valid: false, error: 'Código PIN incorrecto.' });
  } catch (error: any) {
    return NextResponse.json({ valid: false, error: 'Error verificando PIN' }, { status: 500 });
  }
}
