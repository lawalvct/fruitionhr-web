'use client';

import { useState } from 'react';
import { toast } from 'sonner';

import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useAppraisalAssignment, useSubmitAppraisalReview } from '@/features/performance/use-performance';
import { apiErrorMessage } from '@/lib/api';

export function ReviewSheet({ assignmentId, onOpenChange }: { assignmentId: number | null; onOpenChange: (open: boolean) => void }) {
  const { data: assignment, isLoading } = useAppraisalAssignment(assignmentId);
  const submitReview = useSubmitAppraisalReview();
  const [scores, setScores] = useState<Record<number, string>>({});
  const [comments, setComments] = useState('');
  const myReviewer = assignment?.reviewers.find((reviewer) => reviewer.is_mine && reviewer.status === 'pending');

  async function submit() {
    if (!assignment || !myReviewer) return;
    try {
      await submitReview.mutateAsync({
        assignmentId: assignment.id,
        reviewerId: myReviewer.id,
        input: {
          comments: comments || null,
          scores: assignment.template.items.map((item) => ({
            appraisal_template_item_id: item.id,
            score_basis_points: Math.round(Number(scores[item.id]) * 100),
          })),
        },
      });
      toast.success('Appraisal review submitted.');
    } catch (error) { toast.error(apiErrorMessage(error)); }
  }

  const allScoresEntered = assignment?.template.items.every((item) => scores[item.id] !== undefined && Number(scores[item.id]) >= 0 && Number(scores[item.id]) <= 100) ?? false;

  return (
    <Sheet open={assignmentId !== null} onOpenChange={onOpenChange}>
      <SheetContent className='w-full overflow-y-auto sm:max-w-xl'>
        <SheetHeader>
          <SheetTitle>{assignment?.employee.name ?? 'Appraisal review'}</SheetTitle>
          <SheetDescription>{assignment ? assignment.cycle.name + ' - ' + assignment.template.name : 'Loading appraisal...'}</SheetDescription>
        </SheetHeader>
        {isLoading && <p className='px-4 text-sm text-muted-foreground'>Loading appraisal...</p>}
        {assignment && (
          <div className='grid gap-5 px-4 pb-6'>
            <div className='flex items-center justify-between'><span className='text-sm text-muted-foreground'>Overall status</span><StatusBadge status={assignment.status} /></div>
            {assignment.result && (
              <section className='rounded-md border bg-fruition-50 p-4'>
                <p className='text-xs font-medium uppercase text-fruition-700'>Final result</p>
                <p className='mt-1 text-2xl font-semibold'>{(assignment.result.final_score_basis_points / 100).toFixed(2)}%</p>
                <p className='text-sm text-fruition-800'>{assignment.result.grade}</p>
                {assignment.result.outcomes.map((outcome) => <p key={outcome.id} className='mt-2 text-xs text-muted-foreground'>{outcome.type.replaceAll('_', ' ')}: {outcome.notes}</p>)}
              </section>
            )}
            {myReviewer && (
              <>
                <section className='divide-y rounded-md border'>
                  {assignment.template.items.map((item) => (
                    <div key={item.id} className='grid gap-2 px-3 py-3'>
                      <div className='flex items-start justify-between gap-3'>
                        <div><p className='text-sm font-medium'>{item.kpi.name}</p><p className='text-xs text-muted-foreground'>{item.kpi.category} - weight {item.weight}%</p></div>
                        <Input className='w-24' type='number' min={0} max={100} step='0.01' value={scores[item.id] ?? ''} onChange={(event) => setScores((current) => ({ ...current, [item.id]: event.target.value }))} placeholder='Score %' />
                      </div>
                      {item.kpi.description && <p className='text-xs text-muted-foreground'>{item.kpi.description}</p>}
                    </div>
                  ))}
                </section>
                <div className='grid gap-2'><Label>Overall comments</Label><Input value={comments} onChange={(event) => setComments(event.target.value)} /></div>
                <Button disabled={!allScoresEntered || submitReview.isPending} onClick={submit}>Submit review</Button>
              </>
            )}
            {!myReviewer && !assignment.result && <p className='text-sm text-muted-foreground'>Your review is complete. Waiting for the remaining reviewers.</p>}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
