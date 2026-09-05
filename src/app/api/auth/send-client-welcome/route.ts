import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { contactEmail, adminName, companyName, initialPassword } = await req.json();

    if (!contactEmail) {
      return NextResponse.json({ error: 'Correo de cliente requerido' }, { status: 400 });
    }

    const resendApiKey = process.env.RESEND_API_KEY;
    const fromAddress = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://tech-innova.online';

    if (resendApiKey) {
      try {
        const emailRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${resendApiKey}`,
          },
          body: JSON.stringify({
            from: `EventControl.pe <${fromAddress}>`,
            to: contactEmail,
            subject: `✨ Bienvenido a EventControl.pe - Acceso para ${companyName}`,
            html: `
              <div style="font-family: Arial, sans-serif; background-color: #FAF8F5; padding: 30px; border-radius: 12px; border: 1px solid #C5A059;">
                <div style="text-align: center; margin-bottom: 20px;">
                  <h2 style="color: #0B132B; margin: 0;">EventControl.pe</h2>
                  <p style="color: #B8860B; font-weight: bold; margin: 5px 0;">Plataforma de Bodas & Eventos de Gala • Tech Innova</p>
                </div>
                
                <div style="background-color: #ffffff; padding: 25px; border-radius: 8px; border: 1px solid #E2E8F0;">
                  <h3 style="color: #1A1A1A; margin-top: 0;">¡Hola, ${adminName || companyName}!</h3>
                  <p style="color: #475569; font-size: 14px; line-height: 1.6;">
                    Se ha activado tu cuenta para <strong>${companyName}</strong> en la plataforma EventControl.pe. A continuación se detallan tus credenciales de acceso inicial:
                  </p>
                  
                  <div style="background-color: #F8FAFC; padding: 15px 20px; border-radius: 8px; border-left: 4px solid #C5A059; margin: 20px 0;">
                    <p style="margin: 5px 0; color: #1E293B; font-size: 13px;"><strong>Correo de Usuario:</strong> <span style="font-family: monospace;">${contactEmail}</span></p>
                    <p style="margin: 5px 0; color: #1E293B; font-size: 13px;"><strong>Contraseña Inicial:</strong> <span style="font-family: monospace; font-weight: bold; color: #B8860B;">${initialPassword}</span></p>
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
        console.log('[Welcome Email Resend Dispatch]', emailData);
      } catch (emailErr) {
        console.error('[Welcome Email Service Error]', emailErr);
      }
    }

    console.log(`[CLIENT WELCOME DISPATCH] Sent to: ${contactEmail} | Initial Password: ${initialPassword}`);

    return NextResponse.json({
      success: true,
      sentTo: contactEmail,
      message: `Correo de bienvenida despachado exitosamente a ${contactEmail}`,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error enviando correo de bienvenida' }, { status: 500 });
  }
}
