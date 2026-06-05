'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

export function DashboardRealtime({ goalId }: { goalId?: string }) {
  const router = useRouter();

  useEffect(() => {
    if (!goalId) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`goal-${goalId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'goals',
          filter: `id=eq.${goalId}`,
        },
        () => {
          router.refresh();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [goalId, router]);

  return null;
}
