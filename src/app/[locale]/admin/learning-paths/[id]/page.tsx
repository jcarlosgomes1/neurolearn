import { LearningPathEditorClient } from './LearningPathEditorClient';

export const dynamic = 'force-dynamic';

export default async function LearningPathEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <div className="">
      <LearningPathEditorClient pathId={id} />
    </div>
  );
}
