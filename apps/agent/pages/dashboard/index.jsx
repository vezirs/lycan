import Link from 'next/link';

export default function DashboardIndex() {
  return (
    <div style={{ padding: 20 }}>
      <h1>Dashboard</h1>
      <ul>
        <li><Link href="/dashboard/widgets">Widgets</Link></li>
        <li><Link href="/dashboard/conversations">Conversations</Link></li>
      </ul>
    </div>
  );
}
