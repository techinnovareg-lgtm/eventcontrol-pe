import { redirect } from 'next/navigation';

export default function TablesFallbackPage() {
  redirect('/events/evt-102/tables');
}
