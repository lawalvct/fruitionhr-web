'use client';

import { useState } from 'react';
import { toast } from 'sonner';

import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useCan } from '@/features/auth/use-auth';
import type { AppraisalResult } from '@/features/performance/types';
import {
  useAcknowledgeResult,
  useAppealResult,
  useAppraisalAssignment,
  useApproveResult,
  useCalibrateResult,
  useRejectResult,
  useSubmitAppraisalReview,
} from '@/features/performance/use-performance';
import { apiErrorMessage } from '@/lib/api';

function statusLabel(status: AppraisalResult['status']) {
  return status.replaceAll('_', ' ').replace(/^./, (letter) => letter.toUpperCase());
}

/** HR calibration / approval / rejection controls. */
function ManageActions({ result }: { result: AppraisalResult }) {
  const approve = useApproveResult();
  const reject = useRejectResult();
  const calibrate = useCalibrateResult();
  const [calibrating, setCalibrating] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [score, setScore] = useState('');
  const [note, setNote] = useState('');
  const busy = approve.isPending || reject.isPending || calibrate.isPending;

  async function run(action: () => Promise<unknown>, success: string) {
    try {
      await action();
      toast.success(success);
      setCalibrating(false);
      setRejecting(false);
      setNote('');
    } catch (error) { toast.error(apiErrorMessage(error)); }
  }

  if (calibrating) {
    return (
      <div className='grid gap-2 rounded-md border p-3'>
        <Label>Calibrated score %</Label>
        <Input type='number' min={0} max={100} step='0.01' value={score} onChange={(event) => setScore(event.target.value)} />
        <Label>Justification (required, audited)</Label>
        <Input value={note} onChange={(event) => setNote(event.target.value)} placeholder='Why is the score being adjusted?' />
        <div className='flex gap-2'>
          <Button size='sm' disabled={busy || !note || score === ''} onClick={() => run(() => calibrate.mutateAsync({ id: result.id, score_basis_points: Math.round(Number(score) * 100), justification: note }), 'Score calibrated.')}>Save adjustment</Button>
          <Button size='sm' variant='ghost' onClick={() => setCalibrating(false)}>Cancel</Button>
        </div>
      </div>
    );
  }

  if (rejecting) {
    return (
      <div className='grid gap-2 rounded-md border p-3'>
        <Label>Rejection reason (returned to the manager)</Label>
        <Input value={note} onChange={(event) => setNote(event.target.value)} />
        <div className='flex gap-2'>
          <Button size='sm' variant='destructive' disabled={busy || !note} onClick={() => run(() => reject.mutateAsync({ id: result.id, reason: note }), 'Result rejected.')}>Confirm rejection</Button>
          <Button size='sm' variant='ghost' onClick={() => setRejecting(false)}>Cancel</Button>
        </div>
      </div>
    );
  }

  return (
    <div className='flex flex-wrap gap-2'>
      {(result.status === 'pending_calibration' || result.status === 'pending_approval') && (
        <Button size='sm' variant='outline' disabled={busy} onClick={() => { setScore((result.final_score_basis_points / 100).toFixed(2)); setCalibrating(true); }}>Calibrate score</Button>
      )}
      {(result.status === 'pending_approval' || result.status === 'rejected') && (
        <Button size='sm' disabled={busy} onClick={() => run(() => approve.mutateAsync(result.id), 'Result approved — the employee has been notified.')}>Approve</Button>
      )}
      {result.status === 'pending_approval' && (
        <Button size='sm' variant='outline' disabled={busy} onClick={() => setRejecting(true)}>Reject</Button>
      )}
    </div>
  );
}

/** Employee acknowledgment / appeal controls. */
function EmployeeActions({ result }: { result: AppraisalResult }) {
  const acknowledge = useAcknowledgeResult();
  const appeal = useAppealResult();
  const [appealing, setAppealing] = useState(false);
  const [reason, setReason] = useState('');
  const busy = acknowledge.isPending || appeal.isPending;

  async function run(action: () => Promise<unknown>, success: string) {
    try {
      await action();
      toast.success(success);
      setAppealing(false);
    } catch (error) { toast.error(apiErrorMessage(error)); }
  }

  if (appealing) {
    return (
      <div className='grid gap-2 rounded-md border p-3'>
        <Label>Why are you appealing this result?</Label>
        <Input value={reason} onChange={(event) => setReason(event.target.value)} />
        <div className='flex gap-2'>
          <Button size='sm' disabled={busy || !reason} onClick={() => run(() => appeal.mutateAsync({ id: result.id, reason }), 'Appeal submitted to HR.')}>Submit appeal</Button>
          <Button size='sm' variant='ghost' onClick={() => setAppealing(false)}>Cancel</Button>
        </div>
      </div>
    );
  }

  if (result.status !== 'approved' && result.status !== 'acknowledged') return null;

  return (
    <div className='flex flex-wrap gap-2'>
      {result.status === 'approved' && (
        <Button size='sm' disabled={busy} onClick={() => run(() => acknowledge.mutateAsync(result.id), 'Result acknowledged.')}>Acknowledge result</Button>
      )}
      <Button size='sm' variant='outline' disabled={busy} onClick={() => setAppealing(true)}>Raise appeal</Button>
    </div>
  );
}

export function ReviewSheet({ assignmentId, onOpenChange }: { assignmentId: number | null; onOpenChange: (open: boolean) => void }) {
  const canManage = useCan('performance.manage');
  const { data: assignment, isLoading } = useAppraisalAssignment(assignmentId);
  const submitReview = useSubmitAppraisalReview();
  const [scores, setScores] = useState<Record<number, string>>({});
  const [comments, setComments] = useState('');
  const myReviewer = assignment?.reviewers.find((reviewer) => reviewer.is_mine && reviewer.status === 'pending');
  const result = assignment?.result ?? null;

  async function submit() {
    if (!assignment || !myReviewer) return;
    try {
      await submitReview.mutateAsync({
        assignmentId: assignment.id,
        reviewerId: myReviewer.id,
        input: {
          comments: comments || null,
          // Optional KPIs left blank are skipped — the API re-normalizes weights.
          scores: assignment.template.items
            .filter((item) => scores[item.id] !== undefined && scores[item.id] !== '')
            .map((item) => ({
              appraisal_template_item_id: item.id,
              score_basis_points: Math.round(Number(scores[item.id]) * 100),
            })),
        },
      });
      toast.success('Appraisal review submitted.');
    } catch (error) { toast.error(apiErrorMessage(error)); }
  }

  const mandatoryScored = assignment?.template.items
    .filter((item) => item.is_mandatory)
    .every((item) => scores[item.id] !== undefined && scores[item.id] !== '' && Number(scores[item.id]) >= 0 && Number(scores[item.id]) <= 100) ?? false;

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
            {result && (
              <section className='grid gap-3 rounded-md border bg-fruition-50 p-4'>
                <div>
                  <p className='text-xs font-medium uppercase text-fruition-700'>Result — {statusLabel(result.status)}</p>
                  <p className='mt-1 text-2xl font-semibold'>{(result.final_score_basis_points / 100).toFixed(2)}%</p>
                  <p className='text-sm text-fruition-800'>{result.grade}</p>
                  {result.raw_score_basis_points !== null && result.raw_score_basis_points !== result.final_score_basis_points && (
                    <p className='mt-1 text-xs text-muted-foreground'>Raw score before calibration: {(result.raw_score_basis_points / 100).toFixed(2)}%</p>
                  )}
                  {result.rejected_reason && <p className='mt-1 text-xs text-danger'>Rejected: {result.rejected_reason}</p>}
                </div>
                {result.outcomes.map((outcome) => <p key={outcome.id} className='text-xs text-muted-foreground'>{outcome.type.replaceAll('_', ' ')}: {outcome.notes}</p>)}
                {result.appeals.map((item) => (
                  <p key={item.id} className='text-xs text-muted-foreground'>Appeal ({item.status}): {item.reason}{item.resolution_note ? ` — ${item.resolution_note}` : ''}</p>
                ))}
                {canManage && <ManageActions result={result} />}
                {result.is_my_result && <EmployeeActions result={result} />}
              </section>
            )}
            {myReviewer && (
              <>
                <section className='divide-y rounded-md border'>
                  {assignment.template.items.map((item) => (
                    <div key={item.id} className='grid gap-2 px-3 py-3'>
                      <div className='flex items-start justify-between gap-3'>
                        <div>
                          <p className='text-sm font-medium'>{item.kpi.name}{!item.is_mandatory && <span className='ml-1 text-xs font-normal text-muted-foreground'>(optional)</span>}</p>
                          <p className='text-xs text-muted-foreground'>{item.kpi.category} - weight {item.weight}%</p>
                        </div>
                        <Input className='w-24' type='number' min={0} max={100} step='0.01' value={scores[item.id] ?? ''} onChange={(event) => setScores((current) => ({ ...current, [item.id]: event.target.value }))} placeholder='Score %' />
                      </div>
                      {item.kpi.description && <p className='text-xs text-muted-foreground'>{item.kpi.description}</p>}
                    </div>
                  ))}
                </section>
                <div className='grid gap-2'><Label>Overall comments</Label><Input value={comments} onChange={(event) => setComments(event.target.value)} /></div>
                <Button disabled={!mandatoryScored || submitReview.isPending} onClick={submit}>Submit review</Button>
                <p className='text-xs text-muted-foreground'>All mandatory KPIs must be scored. Optional KPIs left blank are excluded and remaining weights re-normalize.</p>
              </>
            )}
            {!myReviewer && !result && <p className='text-sm text-muted-foreground'>Your review is complete. Waiting for the remaining reviewers.</p>}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
