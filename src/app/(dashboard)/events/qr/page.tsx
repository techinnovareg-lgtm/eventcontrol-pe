import { redirect } from 'next/navigation';

export default function QRFallbackPage() {
  redirect('/events');
}
