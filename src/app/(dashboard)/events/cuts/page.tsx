import { redirect } from 'next/navigation';

export default function CutsFallbackPage() {
  redirect('/events');
}
