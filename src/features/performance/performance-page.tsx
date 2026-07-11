'use client';

import { ExternalLink, Plus, Settings2, Target } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Can } from '@/components/can';
import { PageHeader } from '@/components/page-header';
import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { useCan } from '@/features/auth/use-auth';
import { GoalCheckinDialog } from '@/features/performance/goal-checkin-dialog';
import { AssignmentForm, CycleForm, GoalForm } from '@/features/performance/performance-forms';
import { PerformanceSetup } from '@/features/performance/performance-setup';
import { ReviewSheet } from '@/features/performance/review-sheet';
import type { Goal } from '@/features/performance/types';
import {
  useAppraisalAssignments,
  useAppraisalCycles,
  useAppraisalTemplates,
  useCycleAction,
  useGoals,
  usePerformanceEmployees,
} from '@/features/performance/use-performance';
import { apiErrorMessage } from '@/lib/api';

const allTabs = ['Reviews', 'Goals', 'Cycles', 'Setup'] as const;
type Tab = (typeof allTabs)[number];
function Empty({ children }: { children: React.ReactNode }) { return <p className='rounded-md border border-dashed px-4 py-10 text-center text-sm text-muted-foreground'>{children}</p>; }

export function PerformancePage() {
  const canManage = useCan('performance.manage');
  const tabs = canManage ? allTabs : allTabs.filter((item) => item === 'Reviews' || item === 'Goals');
  const [tab, setTab] = useState<Tab>('Reviews');
  const [cycleOpen, setCycleOpen] = useState(false);
  const [assignmentOpen, setAssignmentOpen] = useState(false);
  const [goalOpen, setGoalOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<number | null>(null);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const { data: assignments = [], isLoading: assignmentsLoading } = useAppraisalAssignments();
  const { data: cycles = [], isLoading: cyclesLoading } = useAppraisalCycles();
  const { data: templates = [] } = useAppraisalTemplates();
  const { data: goals = [], isLoading: goalsLoading } = useGoals();
  const { data: employees = [] } = usePerformanceEmployees();
  const cycleAction = useCycleAction();

  async function run(action: () => Promise<unknown>, success: string) {
    try { await action(); toast.success(success); } catch (error) { toast.error(apiErrorMessage(error)); }
  }

  const actions = tab === 'Setup' ? null : (
    <Can permission={tab === 'Goals' ? 'goals.manage' : 'performance.manage'}>
      <Button onClick={() => {
        if (tab === 'Reviews') setAssignmentOpen(true);
        if (tab === 'Goals') setGoalOpen(true);
        if (tab === 'Cycles') setCycleOpen(true);
      }}>
        <Plus className='size-4' />
        {tab === 'Reviews' ? 'Assign appraisal' : tab === 'Goals' ? 'New goal' : 'New cycle'}
      </Button>
    </Can>
  );

  return (
    <div className='space-y-6'>
      <PageHeader title='Performance' description='Run weighted appraisals, complete reviews, and track measurable goals.' actions={actions} />
      <div className='flex gap-1 overflow-x-auto border-b'>
        {tabs.map((item) => <button key={item} type='button' onClick={() => setTab(item)} className={'border-b-2 px-3 py-2 text-sm font-medium ' + (tab === item ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground')}>{item}</button>)}
      </div>

      {tab === 'Reviews' && (
        assignmentsLoading ? <p className='text-sm text-muted-foreground'>Loading appraisals...</p> :
        assignments.length === 0 ? <Empty>No appraisals have been assigned.</Empty> :
        <div className='overflow-x-auto rounded-md border'>
          <table className='w-full text-sm'>
            <thead><tr className='border-b bg-muted/50 text-left'>
              <th className='px-4 py-2 font-medium'>Employee</th><th className='px-4 py-2 font-medium'>Cycle</th><th className='px-4 py-2 font-medium'>Reviewers</th><th className='px-4 py-2 font-medium'>Result</th><th className='px-4 py-2 font-medium'>Status</th><th className='w-12 px-4 py-2'><span className='sr-only'>Open</span></th>
            </tr></thead>
            <tbody>{assignments.map((item) => {
              const submitted = item.reviewers.filter((reviewer) => reviewer.status === 'submitted').length;
              return (
                <tr key={item.id} className='border-b last:border-0'>
                  <td className='px-4 py-3 font-medium'>{item.employee.name}</td>
                  <td className='px-4 py-3'>{item.cycle.name}</td>
                  <td className='px-4 py-3'>{submitted}/{item.reviewers.length} submitted</td>
                  <td className='px-4 py-3'>{item.result ? (item.result.final_score_basis_points / 100).toFixed(2) + '% - ' + item.result.grade : '-'}</td>
                  <td className='px-4 py-3'><StatusBadge status={item.status} /></td>
                  <td className='px-4 py-3'><Button size='icon-sm' variant='ghost' title='Open appraisal' onClick={() => setSelectedAssignment(item.id)}><ExternalLink className='size-4' /></Button></td>
                </tr>
              );
            })}</tbody>
          </table>
        </div>
      )}

      {tab === 'Goals' && (
        goalsLoading ? <p className='text-sm text-muted-foreground'>Loading goals...</p> :
        goals.length === 0 ? <Empty><span className='inline-flex items-center gap-2'><Target className='size-4' />No goals have been created.</span></Empty> :
        <div className='overflow-x-auto rounded-md border'>
          <table className='w-full text-sm'>
            <thead><tr className='border-b bg-muted/50 text-left'>
              <th className='px-4 py-2 font-medium'>Goal</th><th className='px-4 py-2 font-medium'>Owner</th><th className='px-4 py-2 font-medium'>Level</th><th className='px-4 py-2 font-medium'>Progress</th><th className='px-4 py-2 font-medium'>Due</th><th className='px-4 py-2 font-medium'>Status</th><th className='px-4 py-2 text-right font-medium'>Action</th>
            </tr></thead>
            <tbody>{goals.map((goal) => (
              <tr key={goal.id} className='border-b last:border-0'>
                <td className='px-4 py-3'><p className='font-medium'>{goal.title}</p><p className='max-w-xs truncate text-xs text-muted-foreground'>{goal.description}</p></td>
                <td className='px-4 py-3'>{goal.employee?.name ?? goal.department?.name ?? goal.owner?.name ?? 'Company'}</td>
                <td className='px-4 py-3 capitalize'>{goal.level}</td>
                <td className='min-w-36 px-4 py-3'><div className='h-2 overflow-hidden rounded-full bg-muted'><div className='h-full bg-fruition-600' style={{ width: goal.progress + '%' }} /></div><span className='mt-1 block text-xs text-muted-foreground'>{goal.progress}%</span></td>
                <td className='px-4 py-3'>{goal.due_at ?? '-'}</td>
                <td className='px-4 py-3'><StatusBadge status={goal.status} /></td>
                <td className='px-4 py-3 text-right'>{goal.status !== 'completed' && goal.status !== 'cancelled' && <Can permission='goals.manage'><Button size='sm' variant='outline' onClick={() => setSelectedGoal(goal)}>Check in</Button></Can>}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}

      {tab === 'Cycles' && canManage && (
        cyclesLoading ? <p className='text-sm text-muted-foreground'>Loading cycles...</p> :
        cycles.length === 0 ? <Empty>No appraisal cycles have been configured.</Empty> :
        <div className='overflow-x-auto rounded-md border'>
          <table className='w-full text-sm'>
            <thead><tr className='border-b bg-muted/50 text-left'><th className='px-4 py-2 font-medium'>Cycle</th><th className='px-4 py-2 font-medium'>Performance period</th><th className='px-4 py-2 text-right font-medium'>Assignments</th><th className='px-4 py-2 font-medium'>Status</th><th className='px-4 py-2 text-right font-medium'>Action</th></tr></thead>
            <tbody>{cycles.map((cycle) => (
              <tr key={cycle.id} className='border-b last:border-0'>
                <td className='px-4 py-3 font-medium'>{cycle.name}</td>
                <td className='px-4 py-3'>{cycle.starts_at} to {cycle.ends_at}</td>
                <td className='px-4 py-3 text-right'>{cycle.assignments_count}</td>
                <td className='px-4 py-3'><StatusBadge status={cycle.status} /></td>
                <td className='px-4 py-3 text-right'>{cycle.status === 'draft' ? <Button size='sm' variant='outline' onClick={() => run(() => cycleAction.mutateAsync({ id: cycle.id, action: 'open' }), 'Appraisal cycle opened.')}>Open</Button> : cycle.status === 'open' ? <Button size='sm' variant='outline' onClick={() => run(() => cycleAction.mutateAsync({ id: cycle.id, action: 'close' }), 'Appraisal cycle closed.')}>Close</Button> : null}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}

      {tab === 'Setup' && canManage && <><div className='flex items-center gap-2 text-sm text-muted-foreground'><Settings2 className='size-4' />Appraisal configuration</div><PerformanceSetup /></>}

      <CycleForm open={cycleOpen} onOpenChange={setCycleOpen} />
      <AssignmentForm open={assignmentOpen} onOpenChange={setAssignmentOpen} cycles={cycles} templates={templates} employees={employees} />
      <GoalForm open={goalOpen} onOpenChange={setGoalOpen} employees={employees} />
      <ReviewSheet key={selectedAssignment ?? 'closed'} assignmentId={selectedAssignment} onOpenChange={(open) => !open && setSelectedAssignment(null)} />
      <GoalCheckinDialog key={selectedGoal?.id ?? 'closed'} goal={selectedGoal} onOpenChange={(open) => !open && setSelectedGoal(null)} />
    </div>
  );
}
