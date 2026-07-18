'use client';

import { FileDown } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { MoneyText } from '@/components/money-text';
import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { applicationStages } from '@/features/recruitment/types';
import {
  useApplication,
  useCompleteOnboardingTask,
  useCreateOffer,
  useHireCandidate,
  useMoveApplication,
  useOfferAction,
  useScheduleInterview,
} from '@/features/recruitment/use-recruitment';
import { api, apiErrorMessage } from '@/lib/api';

const selectClass = 'h-9 rounded-md border bg-background px-2 text-sm';

export function CandidateSheet({ applicationId, onOpenChange }: { applicationId: number | null; onOpenChange: (open: boolean) => void }) {
  const { data: application, isLoading } = useApplication(applicationId);
  const move = useMoveApplication();
  const schedule = useScheduleInterview();
  const createOffer = useCreateOffer();
  const offerAction = useOfferAction();
  const completeTask = useCompleteOnboardingTask();
  const hire = useHireCandidate();
  const [stage, setStage] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [location, setLocation] = useState('');
  const [annualSalary, setAnnualSalary] = useState('');
  const [startDate, setStartDate] = useState('');
  const [resumePending, setResumePending] = useState(false);

  async function run(action: () => Promise<unknown>, success: string) {
    try {
      await action();
      toast.success(success);
    } catch (error) {
      toast.error(apiErrorMessage(error));
    }
  }

  async function downloadResume() {
    if (!application) return;
    setResumePending(true);
    try {
      const response = await api.get(`/api/v1/recruitment/applications/${application.id}/resume`, { responseType: 'blob' });
      const url = URL.createObjectURL(response.data);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = application.applicant.resume_file_name ?? `${application.applicant.name}-resume`;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      toast.error(apiErrorMessage(error));
    } finally {
      setResumePending(false);
    }
  }

  const latestOffer = application?.offers?.at(-1);
  const tasks = application?.onboarding_tasks ?? [];
  const canHire = application?.stage === 'accepted' && tasks.length > 0 && tasks.every((task) => task.status === 'completed');

  return (
    <Sheet open={applicationId !== null} onOpenChange={onOpenChange}>
      <SheetContent className='w-full overflow-y-auto sm:max-w-xl'>
        <SheetHeader>
          <SheetTitle>{application?.applicant.name ?? 'Candidate'}</SheetTitle>
          <SheetDescription>{application ? application.vacancy.title + ' - ' + application.applicant.email : 'Loading candidate...'}</SheetDescription>
        </SheetHeader>
        {isLoading && <p className='px-4 text-sm text-muted-foreground'>Loading candidate...</p>}
        {application && (
          <div className='grid gap-6 px-4 pb-6'>
            <section className='grid gap-3 border-b pb-5'>
              <div className='flex flex-wrap items-start justify-between gap-3'>
                <div className='text-sm'>
                  <p>{application.applicant.email}</p>
                  <p className='text-muted-foreground'>{application.applicant.phone ?? 'No phone number'}</p>
                  {(application.applicant.city || application.applicant.state) && <p className='text-muted-foreground'>{[application.applicant.city, application.applicant.state].filter(Boolean).join(', ')}</p>}
                </div>
                {application.applicant.has_resume && (
                  <Button size='sm' variant='outline' disabled={resumePending} onClick={downloadResume}>
                    <FileDown className='size-4' />
                    {resumePending ? 'Downloading...' : 'Resume'}
                  </Button>
                )}
              </div>
              {application.applicant.linkedin_url && <a className='text-sm font-medium text-primary hover:underline' href={application.applicant.linkedin_url} target='_blank' rel='noreferrer'>LinkedIn profile</a>}
            </section>
            <section className='grid gap-3 border-b pb-5'>
              <div className='flex items-center justify-between'>
                <h3 className='text-sm font-semibold'>Pipeline stage</h3>
                <StatusBadge status={application.stage} />
              </div>
              <div className='flex gap-2'>
                <select className={selectClass + ' min-w-0 flex-1'} value={stage || application.stage} onChange={(event) => setStage(event.target.value)}>
                  {applicationStages.filter((item) => item !== 'hired').map((item) => <option key={item} value={item}>{item.replaceAll('_', ' ')}</option>)}
                </select>
                <Button variant='outline' disabled={!stage || stage === application.stage || move.isPending} onClick={() => run(() => move.mutateAsync({ id: application.id, stage }), 'Candidate stage updated.')}>Update</Button>
              </div>
            </section>

            {tasks.length > 0 && (
              <section className='grid gap-3'>
                <h3 className='text-sm font-semibold'>Onboarding</h3>
                <ul className='divide-y rounded-md border'>
                  {tasks.map((task) => (
                    <li key={task.id} className='flex items-center justify-between gap-3 px-3 py-2'>
                      <div>
                        <p className='text-sm font-medium'>{task.title}</p>
                        {task.due_date && <p className='text-xs text-muted-foreground'>Due {task.due_date}</p>}
                      </div>
                      {task.status === 'pending' ? (
                        <Button size='sm' variant='outline' onClick={() => run(
                          () => completeTask.mutateAsync({ applicationId: application.id, taskId: task.id }),
                          'Onboarding task completed.',
                        )}>Complete</Button>
                      ) : <StatusBadge status={task.status} />}
                    </li>
                  ))}
                </ul>
                <Button disabled={!canHire || hire.isPending} onClick={() => run(() => hire.mutateAsync(application.id), 'Employee record created.')}>
                  Create employee record
                </Button>
              </section>
            )}
            <section className='grid gap-3 border-b pb-5'>
              <h3 className='text-sm font-semibold'>Interview</h3>
              <div className='grid grid-cols-2 gap-3'>
                <div className='grid gap-2'><Label>Date and time</Label><Input type='datetime-local' value={scheduledAt} onChange={(event) => setScheduledAt(event.target.value)} /></div>
                <div className='grid gap-2'><Label>Location</Label><Input value={location} onChange={(event) => setLocation(event.target.value)} /></div>
              </div>
              <Button
                variant='outline'
                disabled={!scheduledAt || schedule.isPending}
                onClick={() => run(
                  () => schedule.mutateAsync({ id: application.id, input: { type: 'interview', scheduled_at: scheduledAt, location: location || null } }),
                  'Interview scheduled.',
                )}
              >
                Schedule interview
              </Button>
              {application.interviews?.map((interview) => (
                <p key={interview.id} className='text-xs text-muted-foreground'>
                  {new Date(interview.scheduled_at).toLocaleString('en-NG')} {interview.location ? '- ' + interview.location : ''}
                </p>
              ))}
            </section>

            <section className='grid gap-3 border-b pb-5'>
              <div className='flex items-center justify-between'>
                <h3 className='text-sm font-semibold'>Offer</h3>
                {latestOffer && <StatusBadge status={latestOffer.status} />}
              </div>
              {!latestOffer && (
                <>
                  <div className='grid grid-cols-2 gap-3'>
                    <div className='grid gap-2'><Label>Annual salary (kobo)</Label><Input type='number' min={0} value={annualSalary} onChange={(event) => setAnnualSalary(event.target.value)} /></div>
                    <div className='grid gap-2'><Label>Start date</Label><Input type='date' value={startDate} onChange={(event) => setStartDate(event.target.value)} /></div>
                  </div>
                  <Button variant='outline' disabled={!startDate || createOffer.isPending} onClick={() => run(
                    () => createOffer.mutateAsync({ id: application.id, input: { annual_salary: annualSalary ? Number(annualSalary) : null, start_date: startDate } }),
                    'Offer prepared.',
                  )}>Prepare offer</Button>
                </>
              )}
              {latestOffer && (
                <>
                  <p className='text-sm'><MoneyText kobo={latestOffer.annual_salary} /> annually, starting {latestOffer.start_date}</p>
                  <div className='flex flex-wrap gap-2'>
                    {latestOffer.status === 'draft' && <Button onClick={() => run(() => offerAction.mutateAsync({ applicationId: application.id, offerId: latestOffer.id, action: 'send' }), 'Offer sent.')}>Send offer</Button>}
                    {latestOffer.status === 'sent' && (
                      <>
                        <Button onClick={() => run(() => offerAction.mutateAsync({ applicationId: application.id, offerId: latestOffer.id, action: 'accept' }), 'Offer accepted.')}>Mark accepted</Button>
                        <Button variant='outline' onClick={() => run(() => offerAction.mutateAsync({ applicationId: application.id, offerId: latestOffer.id, action: 'decline' }), 'Offer declined.')}>Mark declined</Button>
                      </>
                    )}
                  </div>
                </>
              )}
            </section>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
