import { redirect } from 'next/navigation';

export default function ImportFallbackPage() {
  redirect('/events');
}
