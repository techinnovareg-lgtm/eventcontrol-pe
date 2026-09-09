import { redirect } from 'next/navigation';

export default function TablesFallbackPage() {
  redirect('/events');
}
