'use client';

import { BriefcaseBusiness, Copy, ExternalLink, Globe2, LockKeyhole, Plus, Send } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Can } from '@/components/can';
import { PageHeader } from '@/components/page-header';
import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { CandidateSheet } from '@/features/recruitment/candidate-sheet';
import { CandidateForm, RequisitionForm, VacancyForm } from '@/features/recruitment/recruitment-forms';
import {
  useApplications,
  useRequisitions,
  useSubmitRequisition,
  useVacancies,
  useVacancyAction,
  useVacancyVisibilityAction,
} from '@/features/recruitment/use-recruitment';
import { apiErrorMessage } from '@/lib/api';
import { publicVacancyUrl } from '@/lib/site';

const tabs = ['Requisitions', 'Vacancies', 'Candidates'] as const;
type Tab = (typeof tabs)[number];

function Empty({ children }: { children: React.ReactNode }) {
  return <p className='rounded-md border border-dashed px-4 py-10 text-center text-sm text-muted-foreground'>{children}</p>;
}

export function RecruitmentPage() {
  const [tab, setTab] = useState<Tab>('Requisitions');
  const [requisitionOpen, setRequisitionOpen] = useState(false);
  const [vacancyOpen, setVacancyOpen] = useState(false);
  const [candidateOpen, setCandidateOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<number | null>(null);
  const { data: requisitions = [], isLoading: requisitionsLoading } = useRequisitions();
  const { data: vacancies = [], isLoading: vacanciesLoading } = useVacancies();
  const { data: applications = [], isLoading: applicationsLoading } = useApplications();
  const submitRequisition = useSubmitRequisition();
  const vacancyAction = useVacancyAction();
  const visibilityAction = useVacancyVisibilityAction();

  async function run(action: () => Promise<unknown>, success: string) {
    try {
      await action();
      toast.success(success);
    } catch (error) {
      toast.error(apiErrorMessage(error));
    }
  }

  async function copyPublicLink(slug: string) {
    try {
      await navigator.clipboard.writeText(publicVacancyUrl(slug));
      toast.success('Public vacancy link copied.');
    } catch {
      toast.error('The public link could not be copied.');
    }
  }

  const action = (
    <Can permission='recruitment.manage'>
      <Button onClick={() => {
        if (tab === 'Requisitions') setRequisitionOpen(true);
        if (tab === 'Vacancies') setVacancyOpen(true);
        if (tab === 'Candidates') setCandidateOpen(true);
      }}>
        <Plus className='size-4' />
        {tab === 'Requisitions' ? 'New requisition' : tab === 'Vacancies' ? 'Create vacancy' : 'Add candidate'}
      </Button>
    </Can>
  );

  return (
    <div className='space-y-6'>
      <PageHeader title='Recruitment' description='Manage approved headcount, vacancies, candidates, offers, and onboarding.' actions={action} />
      <div className='flex gap-1 border-b'>
        {tabs.map((item) => (
          <button
            key={item}
            type='button'
            onClick={() => setTab(item)}
            className={'border-b-2 px-3 py-2 text-sm font-medium ' + (tab === item ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground')}
          >
            {item}
          </button>
        ))}
      </div>

      {tab === 'Requisitions' && (
        requisitionsLoading ? <p className='text-sm text-muted-foreground'>Loading requisitions...</p> :
        requisitions.length === 0 ? <Empty>No manpower requisitions yet.</Empty> :
        <div className='overflow-x-auto rounded-md border'>
          <table className='w-full text-sm'>
            <thead><tr className='border-b bg-muted/50 text-left'>
              <th className='px-4 py-2 font-medium'>Role</th>
              <th className='px-4 py-2 font-medium'>Department</th>
              <th className='px-4 py-2 text-right font-medium'>Headcount</th>
              <th className='px-4 py-2 font-medium'>Target start</th>
              <th className='px-4 py-2 font-medium'>Status</th>
              <th className='w-12 px-4 py-2'><span className='sr-only'>Actions</span></th>
            </tr></thead>
            <tbody>
              {requisitions.map((item) => (
                <tr key={item.id} className='border-b last:border-0'>
                  <td className='px-4 py-3'>
                    <p className='font-medium'>{item.title}</p>
                    <p className='max-w-xs truncate text-xs text-muted-foreground'>{item.reason}</p>
                  </td>
                  <td className='px-4 py-3'>{item.department?.name ?? '-'}</td>
                  <td className='px-4 py-3 text-right'>{item.headcount}</td>
                  <td className='px-4 py-3'>{item.target_start_date ?? '-'}</td>
                  <td className='px-4 py-3'><StatusBadge status={item.status} /></td>
                  <td className='px-4 py-3'>
                    {item.status === 'draft' && (
                      <Can permission='recruitment.manage'>
                        <Button size='icon-sm' variant='ghost' title='Submit for approval' disabled={submitRequisition.isPending} onClick={() => run(() => submitRequisition.mutateAsync(item.id), 'Requisition submitted for approval.')}>
                          <Send className='size-4' />
                        </Button>
                      </Can>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'Vacancies' && (
        vacanciesLoading ? <p className='text-sm text-muted-foreground'>Loading vacancies...</p> :
        vacancies.length === 0 ? <Empty>No vacancies have been created from approved requisitions.</Empty> :
        <div className='overflow-x-auto rounded-md border'>
          <table className='w-full text-sm'>
            <thead><tr className='border-b bg-muted/50 text-left'>
              <th className='px-4 py-2 font-medium'>Vacancy</th>
              <th className='px-4 py-2 font-medium'>Location</th>
              <th className='px-4 py-2 text-right font-medium'>Openings</th>
              <th className='px-4 py-2 text-right font-medium'>Candidates</th>
              <th className='px-4 py-2 font-medium'>Status</th>
              <th className='px-4 py-2 font-medium'>Visibility</th>
              <th className='px-4 py-2 text-right font-medium'>Action</th>
            </tr></thead>
            <tbody>
              {vacancies.map((item) => (
                <tr key={item.id} className='border-b last:border-0'>
                  <td className='px-4 py-3'><p className='font-medium'>{item.title}</p><p className='text-xs text-muted-foreground'>{item.code ?? item.requisition.title}</p></td>
                  <td className='px-4 py-3'>{item.location ?? '-'}</td>
                  <td className='px-4 py-3 text-right'>{item.positions_available}</td>
                  <td className='px-4 py-3 text-right'>{item.applications_count}</td>
                  <td className='px-4 py-3'><StatusBadge status={item.status} /></td>
                  <td className='px-4 py-3'>
                    <span className='inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground'>
                      {item.visibility === 'public' ? <Globe2 className='size-3.5 text-emerald-600' /> : <LockKeyhole className='size-3.5' />}
                      {item.visibility === 'public' ? 'Public' : 'Private'}
                    </span>
                  </td>
                  <td className='px-4 py-3 text-right'>
                    <Can permission='recruitment.manage'>
                      <div className='flex justify-end gap-1'>
                        {item.visibility === 'public' && item.public_slug && (
                          <>
                            <Button size='icon-sm' variant='ghost' title='Copy public link' onClick={() => copyPublicLink(item.public_slug!)}>
                              <Copy className='size-4' />
                            </Button>
                            <Button size='icon-sm' variant='ghost' title='Open public vacancy' render={<a href={publicVacancyUrl(item.public_slug)} target='_blank' rel='noreferrer' />}>
                              <ExternalLink className='size-4' />
                            </Button>
                          </>
                        )}
                        {item.status !== 'closed' && (
                          <Button
                            size='icon-sm'
                            variant='ghost'
                            title={item.visibility === 'public' ? 'Make vacancy private' : 'Publish vacancy'}
                            disabled={visibilityAction.isPending}
                            onClick={() => run(
                              () => visibilityAction.mutateAsync({ id: item.id, action: item.visibility === 'public' ? 'unpublish' : 'publish' }),
                              item.visibility === 'public' ? 'Vacancy is now private.' : 'Vacancy published.',
                            )}
                          >
                            {item.visibility === 'public' ? <LockKeyhole className='size-4' /> : <Globe2 className='size-4' />}
                          </Button>
                        )}
                        {item.status === 'draft' && <Button size='sm' variant='outline' onClick={() => run(() => vacancyAction.mutateAsync({ id: item.id, action: 'open' }), item.visibility === 'public' ? 'Vacancy opened and is live.' : 'Vacancy opened.')}>Open</Button>}
                        {item.status === 'open' && <Button size='sm' variant='outline' onClick={() => run(() => vacancyAction.mutateAsync({ id: item.id, action: 'close' }), 'Vacancy closed.')}>Close</Button>}
                      </div>
                    </Can>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'Candidates' && (
        applicationsLoading ? <p className='text-sm text-muted-foreground'>Loading candidates...</p> :
        applications.length === 0 ? (
          <Empty><span className='inline-flex items-center gap-2'><BriefcaseBusiness className='size-4' />No candidates are in the pipeline.</span></Empty>
        ) : (
          <div className='overflow-x-auto rounded-md border'>
            <table className='w-full text-sm'>
              <thead><tr className='border-b bg-muted/50 text-left'>
                <th className='px-4 py-2 font-medium'>Candidate</th>
                <th className='px-4 py-2 font-medium'>Vacancy</th>
                <th className='px-4 py-2 font-medium'>Source</th>
                <th className='px-4 py-2 font-medium'>Stage</th>
                <th className='px-4 py-2 font-medium'>Applied</th>
                <th className='w-12 px-4 py-2'><span className='sr-only'>Open</span></th>
              </tr></thead>
              <tbody>
                {applications.map((item) => (
                  <tr key={item.id} className='border-b last:border-0'>
                    <td className='px-4 py-3'><p className='font-medium'>{item.applicant.name}</p><p className='text-xs text-muted-foreground'>{item.applicant.email}</p></td>
                    <td className='px-4 py-3'>{item.vacancy.title}</td>
                    <td className='px-4 py-3'>{item.source ?? '-'}</td>
                    <td className='px-4 py-3'><StatusBadge status={item.stage} /></td>
                    <td className='px-4 py-3'>{new Date(item.applied_at).toLocaleDateString('en-NG')}</td>
                    <td className='px-4 py-3'>
                      <Button size='icon-sm' variant='ghost' title='Open candidate' onClick={() => setSelectedApplication(item.id)}>
                        <ExternalLink className='size-4' />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      <RequisitionForm open={requisitionOpen} onOpenChange={setRequisitionOpen} />
      <VacancyForm open={vacancyOpen} onOpenChange={setVacancyOpen} requisitions={requisitions} />
      <CandidateForm open={candidateOpen} onOpenChange={setCandidateOpen} vacancies={vacancies} />
      <CandidateSheet key={selectedApplication ?? 'closed'} applicationId={selectedApplication} onOpenChange={(open) => !open && setSelectedApplication(null)} />
    </div>
  );
}
