'use client';

import { useEffect, useState } from 'react';
import { callAgentOps } from '@/lib/api/client';

export interface AIFeatures {
  can_generate_lessons: boolean;
  can_generate_full_courses: boolean;
  can_use_ai_tutor: boolean;
  can_use_pricing_advisor: boolean;
  monthly_ai_credits: number;
  credits_used_this_month: number;
}

interface AIFeaturesState {
  features: AIFeatures | null;
  isAdmin: boolean;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useAIFeatures(): AIFeaturesState {
  const [features, setFeatures] = useState<AIFeatures | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    callAgentOps<{ features: AIFeatures; is_admin: boolean }>('my_ai_features', {})
      .then((r) => {
        if (cancelled) return;
        setFeatures(r.features);
        setIsAdmin(r.is_admin || false);
        setLoading(false);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e.message);
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [tick]);

  return { features, isAdmin, loading, error, refetch: () => setTick((t) => t + 1) };
}
