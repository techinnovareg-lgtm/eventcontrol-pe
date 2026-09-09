import { redirect } from 'next/navigation';

export default function ReportsFallbackPage() {
  redirect('/events');
}
