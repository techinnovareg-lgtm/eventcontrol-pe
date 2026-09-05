import { NextResponse } from 'next/server';

// Server-side pin store with expiration (5 minutes)
let globalPinStore: { pin: string; expiresAt: number } | null = null;

function getActiveServerPin(): string | null {
  if (!globalPinStore) return null;
  if (Date.now() > globalPinStore.expiresAt) {
    globalPinStore = null;
    return null;
  }
  return globalPinStore.pin;
}

export async function POST() {
  try {
    const superAdminEmail = 'tech.innova.reg@gmail.com';
    const pin = Math.floor(1000 + Math.random() * 9000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 mins

    globalPinStore = { pin, expiresAt };

    const resendApiKey = process.env.RESEND_API_KEY;
    const fromAddress = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

    if (resendApiKey) {
      try {
        const emailRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${resendApiKey}`,
          },
          body: JSON.stringify({
            from: `EventControl Security <${fromAddress}>`,
            to: superAdminEmail,
            subject: `🔑 PIN de Seguridad 2FA Superadmin: ${pin}`,
            html: `
              <div style="font-family: Arial, sans-serif; background-color: #FAF8F5; padding: 30px; border-radius: 12px; border: 1px solid #C5A059;">
                <div style="text-align: center; margin-bottom: 20px;">
                  <h2 style="color: #0B132B; margin: 0;">EventControl.pe</h2>
                  <p style="color: #B8860B; font-weight: bold; margin: 5px 0;">Plataforma de Bodas & Eventos de Gala • Tech Innova</p>
                </div>
                <div style="background-color: #ffffff; padding: 25px; border-radius: 8px; border: 1px solid #E2E8F0; text-align: center;">
                  <h3 style="color: #1A1A1A; margin-top: 0;">Código de Verificación 2FA</h3>
                  <p style="color: #475569; font-size: 14px;">Ha solicitado ingresar a la Consola de Superadministrador. Utilice el siguiente PIN de seguridad:</p>
                  <div style="background-color: #0B132B; color: #DBBB6E; font-size: 32px; font-weight: bold; letter-spacing: 6px; padding: 15px 30px; display: inline-block; border-radius: 8px; margin: 15px 0;">
                    ${pin}
                  </div>
                  <p style="color: #64748B; font-size: 12px;">Este código expira en <strong>5 minutos</strong>. Si usted no solicitó este código, ignore este mensaje.</p>
                </div>
                <div style="text-align: center; margin-top: 20px; color: #94A3B8; font-size: 11px;">
                  EventControl.pe © 2026 • Desarrollado por Tech Innova (https://tech-innova.online)
                </div>
              </div>
            `,
          }),
        });
        const emailData = await emailRes.json();
        console.log('[2FA Resend Dispatch Result]', emailData);
      } catch (emailErr) {
        console.error('[2FA Email Service] Failed to send via Resend API:', emailErr);
      }
    }

    // Log security record on server
    console.log(`[SECURITY 2FA DISPATCH] Email: ${superAdminEmail} | PIN: ${pin} | Expires: ${new Date(expiresAt).toISOString()}`);

    return NextResponse.json({
      success: true,
      sentTo: superAdminEmail,
      message: `PIN de seguridad enviado exitosamente a ${superAdminEmail}`,
      devPin: pin,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Error enviando PIN 2FA' },
      { status: 500 }
    );
  }
}

export async function GET() {
  const pin = getActiveServerPin();
  return NextResponse.json({
    active: !!pin,
    pin: process.env.NODE_ENV !== 'production' ? pin : undefined,
  });
}
