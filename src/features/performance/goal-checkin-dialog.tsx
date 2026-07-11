'use client';

import { useState } from 'react';
import { toast } from 'sonner';

import { FormDialog } from '@/components/form-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Goal } from '@/features/performance/types';
import { useGoalCheckin } from '@/features/performance/use-performance';
import { apiErrorMessage } from '@/lib/api';

export function GoalCheckinDialog({ goal, onOpenChange }: { goal: Goal | null; onOpenChange: (open: boolean) => void }) {
  const checkin = useGoalCheckin();
  const [progress, setProgress] = useState(String(goal?.progress ?? 0));
  const [currentValue, setCurrentValue] = useState(goal?.current_value == null ? '' : String(goal.current_value));
  const [comment, setComment] = useState('');

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!goal) return;
    try {
      await checkin.mutateAsync({ id: goal.id, input: { progress: Number(progress), current_value: currentValue ? Number(currentValue) : null, comment: comment || null } });
      toast.success('Goal check-in recorded.');
      onOpenChange(false);
    } catch (error) { toast.error(apiErrorMessage(error)); }
  }

  return (
    <FormDialog open={goal !== null} onOpenChange={onOpenChange} title={goal?.title ?? 'Goal check-in'} description='Update measurable progress and leave a short check-in note.' formId='goal-checkin-form' isPending={checkin.isPending}>
      <form id='goal-checkin-form' onSubmit={submit} className='grid gap-4 py-2'>
        <div className='grid gap-2'><Label>Progress %</Label><Input type='number' min={0} max={100} value={progress} onChange={(event) => setProgress(event.target.value)} required /></div>
        <div className='grid gap-2'><Label>Current value</Label><Input type='number' value={currentValue} onChange={(event) => setCurrentValue(event.target.value)} /></div>
        <div className='grid gap-2'><Label>Comment</Label><Input value={comment} onChange={(event) => setComment(event.target.value)} /></div>
      </form>
    </FormDialog>
  );
}
