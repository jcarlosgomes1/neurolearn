'use client';

import { useEffect, useState, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { PracticeExercisePanel } from '@/app/[locale]/aprender/PracticeExercisePanel';

type Exercise = {
  id: string; kind: 'code' | 'freeform' | 'checklist';
  title_md: string; prompt_md: string; starter_code: string | null; max_score: number; position: number;
  my_submission: any | null;
};

export function LessonPractice({ courseId, moduleIndex, lessonIndex }: { courseId: string; moduleIndex: number; lessonIndex: number }) {
  const supabase = useMemo(() => createClient(), []);
  const [exercises, setExercises] = useState<Exercise[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase.rpc('nl_practice_for_lesson', {
          p_course_id: courseId, p_module_index: moduleIndex, p_lesson_index: lessonIndex,
        });
        if (Array.isArray(data)) setExercises(data as Exercise[]);
      } catch { /* noop */ }
    })();
  }, [supabase, courseId, moduleIndex, lessonIndex]);

  if (exercises.length === 0) return null;

  return (
    <div className="mt-6 space-y-4">
      {exercises.map((ex) => (
        <PracticeExercisePanel key={ex.id} exercise={ex} />
      ))}
    </div>
  );
}
