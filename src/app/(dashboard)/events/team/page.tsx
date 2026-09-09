import { redirect } from 'next/navigation';

export default function TeamFallbackPage() {
  redirect('/events');
}
