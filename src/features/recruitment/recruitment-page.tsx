'use client';

import { BriefcaseBusiness, Copy, ExternalLink, Globe2, LockKeyhole, Plus, Search, Send } from 'lucide-react';
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

function Metric({ label, value, detail }: { label: string; value: number; detail: string }) {
  return <div className='rounded-lg border bg-card p-4 shadow-sm'><p className='text-sm text-muted-foreground'>{label}</p><p className='mt-1 text-2xl font-semibold tracking-tight'>{value}</p><p className='mt-1 text-xs text-muted-foreground'>{detail}</p></div>;
}

function formatDate(value: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function RecruitmentPage() {
  const [tab, setTab] = useState<Tab>('Requisitions');
  const [requisitionOpen, setRequisitionOpen] = useState(false);
  const [vacancyOpen, setVacancyOpen] = useState(false);
  const [candidateOpen, setCandidateOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<number | null>(null);
  const [query, setQuery] = useState('');
  const { data: requisitions = [], isLoading: requisitionsLoading } = useRequisitions();
  const { data: vacancies = [], isLoading: vacanciesLoading } = useVacancies();
  const { data: applications = [], isLoading: applicationsLoading } = useApplications();
  const submitRequisition = useSubmitRequisition();
  const vacancyAction = useVacancyAction();
  const visibilityAction = useVacancyVisibilityAction();
  const searchTerm = query.trim().toLowerCase();
  const filteredRequisitions = requisitions.filter((item) => `${item.title} ${item.department?.name ?? ''} ${item.status}`.toLowerCase().includes(searchTerm));
  const filteredVacancies = vacancies.filter((item) => `${item.title} ${item.code ?? ''} ${item.location ?? ''} ${item.status} ${item.visibility}`.toLowerCase().includes(searchTerm));
  const filteredApplications = applications.filter((item) => `${item.applicant.name} ${item.applicant.email} ${item.vacancy.title} ${item.stage}`.toLowerCase().includes(searchTerm));
  const pendingRequisitions = requisitions.filter((item) => item.status === 'pending').length;
  const openVacancies = vacancies.filter((item) => item.status === 'open').length;
  const lateStageCandidates = applications.filter((item) => item.stage === 'offer' || item.stage === 'accepted').length;

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
      <div className='grid gap-3 sm:grid-cols-2 xl:grid-cols-4'>
        <Metric label='Open vacancies' value={openVacancies} detail='Roles currently accepting candidates' />
        <Metric label='Candidates' value={applications.length} detail='Across every hiring stage' />
        <Metric label='Late-stage candidates' value={lateStageCandidates} detail='At offer or accepted stage' />
        <Metric label='Pending requisitions' value={pendingRequisitions} detail='Awaiting headcount approval' />
      </div>

      <div role='tablist' aria-label='Recruitment sections' className='flex gap-1 overflow-x-auto border-b'>
        {tabs.map((item) => (
          <button
            key={item}
            id={`recruitment-tab-${item.toLowerCase()}`}
            type='button'
            role='tab'
            aria-selected={tab === item}
            aria-controls={`recruitment-panel-${item.toLowerCase()}`}
            onClick={() => {
              setTab(item);
              setQuery('');
            }}
            className={'border-b-2 px-3 py-2 text-sm font-medium transition-colors ' + (tab === item ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground')}
          >
            {item}
          </button>
        ))}
      </div>

      <div className='relative max-w-md'>
        <Search className='pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground' />
        <input value={query} onChange={(event) => setQuery(event.target.value)} className='h-9 w-full rounded-md border bg-background pl-9 pr-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/25' placeholder={`Search ${tab.toLowerCase()}`} aria-label={`Search ${tab.toLowerCase()}`} />
      </div>

      {tab === 'Requisitions' && (
        <section id='recruitment-panel-requisitions' role='tabpanel' aria-labelledby='recruitment-tab-requisitions'>
        {requisitionsLoading ? <p className='text-sm text-muted-foreground'>Loading requisitions...</p> :
        requisitions.length === 0 ? <Empty>No manpower requisitions yet.</Empty> :
        <>
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
              {filteredRequisitions.map((item) => (
                <tr key={item.id} className='border-b last:border-0'>
                  <td className='px-4 py-3'>
                    <p className='font-medium'>{item.title}</p>
                    {item.reason && <p className='max-w-xs truncate text-xs text-muted-foreground'>{item.reason}</p>}
                  </td>
                  <td className='px-4 py-3'>{item.department?.name ?? '-'}</td>
                  <td className='px-4 py-3 text-right'>{item.headcount}</td>
                  <td className='whitespace-nowrap px-4 py-3'>{formatDate(item.target_start_date)}</td>
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
        {filteredRequisitions.length === 0 && <Empty>No requisitions match this search.</Empty>}
        </>}
        </section>
      )}

      {tab === 'Vacancies' && (
        <section id='recruitment-panel-vacancies' role='tabpanel' aria-labelledby='recruitment-tab-vacancies'>
        {vacanciesLoading ? <p className='text-sm text-muted-foreground'>Loading vacancies...</p> :
        vacancies.length === 0 ? <Empty>No vacancies have been created from approved requisitions.</Empty> :
        <>
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
              {filteredVacancies.map((item) => (
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
                        {item.status === 'draft' && <Button size='sm' variant='outline' disabled={vacancyAction.isPending} onClick={() => run(() => vacancyAction.mutateAsync({ id: item.id, action: 'open' }), item.visibility === 'public' ? 'Vacancy opened and is live.' : 'Vacancy opened.')}>Open</Button>}
                        {item.status === 'open' && <Button size='sm' variant='outline' disabled={vacancyAction.isPending} onClick={() => run(() => vacancyAction.mutateAsync({ id: item.id, action: 'close' }), 'Vacancy closed.')}>Close</Button>}
                      </div>
                    </Can>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredVacancies.length === 0 && <Empty>No vacancies match this search.</Empty>}
        </>}
        </section>
      )}

      {tab === 'Candidates' && (
        <section id='recruitment-panel-candidates' role='tabpanel' aria-labelledby='recruitment-tab-candidates'>
        {applicationsLoading ? <p className='text-sm text-muted-foreground'>Loading candidates...</p> :
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
                {filteredApplications.map((item) => (
                  <tr key={item.id} className='border-b last:border-0'>
                    <td className='px-4 py-3'><p className='font-medium'>{item.applicant.name}</p><p className='text-xs text-muted-foreground'>{item.applicant.email}</p></td>
                    <td className='px-4 py-3'>{item.vacancy.title}</td>
                    <td className='px-4 py-3'>{item.source ?? '-'}</td>
                    <td className='px-4 py-3'><StatusBadge status={item.stage} /></td>
                    <td className='whitespace-nowrap px-4 py-3'>{formatDate(item.applied_at)}</td>
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
        )}
        {applications.length > 0 && filteredApplications.length === 0 && <Empty>No candidates match this search.</Empty>}
        </section>
      )}

      <RequisitionForm open={requisitionOpen} onOpenChange={setRequisitionOpen} />
      <VacancyForm open={vacancyOpen} onOpenChange={setVacancyOpen} requisitions={requisitions} />
      <CandidateForm open={candidateOpen} onOpenChange={setCandidateOpen} vacancies={vacancies} />
      <CandidateSheet key={selectedApplication ?? 'closed'} applicationId={selectedApplication} onOpenChange={(open) => !open && setSelectedApplication(null)} />
    </div>
  );
}
