import { redirect } from 'next/navigation';

export default function WhatsappFallbackPage() {
  redirect('/events/evt-102/whatsapp');
}
