import { UserDetailClient } from './UserDetailClient';

export default async function AdminUserDetailPage({ params }: { params: Promise<{ id: string; locale: string }> }) {
  const { id } = await params;
  return <UserDetailClient userId={id} />;
}
