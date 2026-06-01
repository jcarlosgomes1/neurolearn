import { ApprovalDetail } from './ApprovalDetail';

export const metadata = { title: 'Aprovação · Admin' };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <>

        <ApprovalDetail approvalId={id} />
      
    </>
  );
}
