'use client';

import { useEffect } from 'react';
import { trackEvent } from '@/components/telemetry/Telemetry';

// Dispara eventos de intenção ao ver um curso (course_view sempre; price_view se for pago).
// Sem UI — apenas telemetria, respeitando o consentimento (trackEvent verifica-o).
export function CourseViewTracker({ courseId, priceCents, category }: { courseId: string; priceCents?: number; category?: string }) {
  useEffect(() => {
    trackEvent('course_view', { course_id: courseId, category: category || null });
    if (priceCents && priceCents > 0) {
      trackEvent('price_view', { course_id: courseId, price_cents: priceCents });
    }
  }, [courseId, priceCents, category]);
  return null;
}
