import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { contactEmail, adminName, companyName, initialPassword } = await req.json();

    if (!contactEmail) {
      return NextResponse.json({ success: false, error: 'Correo de cliente requerido' }, { status: 400 });
    }

    const resendApiKey = process.env.RESEND_API_KEY;
    const fromAddress = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://eventcontrol-pe.vercel.app';
    const passwordToDisplay = initialPassword || 'EventControl2026!';

    if (!resendApiKey) {
      console.warn('[WELCOME EMAIL API] RESEND_API_KEY not configured.');
      return NextResponse.json({
        success: false,
        error: 'No se ha configurado RESEND_API_KEY en las variables de entorno.',
      }, { status: 400 });
    }

    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: `EventControl.pe <${fromAddress}>`,
        to: contactEmail,
        subject: `✨ Bienvenido a EventControl.pe - Acceso para ${companyName || 'tu Empresa'}`,
        html: `
          <div style="font-family: Arial, sans-serif; background-color: #FAF8F5; padding: 30px; border-radius: 12px; border: 1px solid #C5A059;">
            <div style="text-align: center; margin-bottom: 20px;">
              <h2 style="color: #0B132B; margin: 0; font-size: 24px;">EventControl.pe</h2>
              <p style="color: #B8860B; font-weight: bold; margin: 5px 0; font-size: 13px;">Plataforma de Bodas & Eventos de Gala • Tech Innova</p>
            </div>
            
            <div style="background-color: #ffffff; padding: 25px; border-radius: 8px; border: 1px solid #E2E8F0;">
              <h3 style="color: #1A1A1A; margin-top: 0; font-size: 18px;">¡Hola, ${adminName || companyName}!</h3>
              <p style="color: #475569; font-size: 14px; line-height: 1.6;">
                Se ha activado tu cuenta para <strong>${companyName || 'tu Empresa'}</strong> en la plataforma EventControl.pe. A continuación se detallan tus credenciales de acceso inicial:
              </p>
              
              <div style="background-color: #F8FAFC; padding: 15px 20px; border-radius: 8px; border-left: 4px solid #C5A059; margin: 20px 0;">
                <p style="margin: 5px 0; color: #1E293B; font-size: 13px;"><strong>Correo de Usuario:</strong> <span style="font-family: monospace; font-[#0B132B];">${contactEmail}</span></p>
                <p style="margin: 5px 0; color: #1E293B; font-size: 13px;"><strong>Contraseña Inicial:</strong> <span style="font-family: monospace; font-weight: bold; color: #B8860B;">${passwordToDisplay}</span></p>
              </div>

              <p style="color: #64748B; font-size: 12px;">Por seguridad, podrás personalizar tu contraseña privada en cualquier momento tras iniciar sesión.</p>
              
              <div style="text-align: center; margin-top: 25px;">
                <a href="${appUrl}/login" style="background-color: #0B132B; color: #DBBB6E; font-weight: bold; text-decoration: none; padding: 12px 25px; border-radius: 8px; font-size: 14px; display: inline-block;">
                  Acceder a mi Cuenta
                </a>
              </div>
            </div>
            
            <div style="text-align: center; margin-top: 20px; color: #94A3B8; font-size: 11px;">
              EventControl.pe © 2026 • Soporte Tech Innova (https://tech-innova.online)
            </div>
          </div>
        `,
      }),
    });

    const emailData = await emailRes.json();
    console.log('[Welcome Email Resend Dispatch Result]', emailRes.status, emailData);

    if (!emailRes.ok) {
      const errMsg = emailData.message || emailData.error || 'Resend rehusó enviar el correo.';
      const isSandboxRestriction = errMsg.includes('only send testing emails') || emailRes.status === 403;

      return NextResponse.json({
        success: false,
        error: isSandboxRestriction
          ? 'Resend está en modo pruebas sandbox (onboarding@resend.dev) y solo permite enviar correos a la cuenta del propietario. Para enviar a dominios de clientes externos, se requiere verificar un dominio propio en Resend.'
          : errMsg,
        isSandboxRestriction,
        resendDetails: emailData,
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      sentTo: contactEmail,
      resendId: emailData.id,
      message: `Correo de bienvenida despachado exitosamente a ${contactEmail}`,
    });

  } catch (error: any) {
    console.error('[WELCOME EMAIL ROUTE ERROR]', error);
    return NextResponse.json({ success: false, error: error.message || 'Error interno al despachar correo de bienvenida' }, { status: 500 });
  }
}
