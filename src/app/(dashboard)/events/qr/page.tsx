import { redirect } from 'next/navigation';

export default function QrFallbackPage() {
  redirect('/events/evt-102/qr');
}
