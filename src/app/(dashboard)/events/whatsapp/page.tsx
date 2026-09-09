import { redirect } from 'next/navigation';

export default function WhatsAppFallbackPage() {
  redirect('/events');
}
