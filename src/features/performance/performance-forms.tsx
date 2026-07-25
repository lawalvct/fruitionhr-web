'use client';

import { useState } from 'react';
import { toast } from 'sonner';

import { FormDialog } from '@/components/form-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useMe, useCan } from '@/features/auth/use-auth';
import { useCompanyOptions } from '@/features/company/use-company';
import { APPRAISAL_TYPES, type AppraisalCycle, type AppraisalTemplate } from '@/features/performance/types';
import {
  type PerformanceEmployee,
  useCreateAssignment,
  useCreateCycle,
  useCreateGoal,
} from '@/features/performance/use-performance';
import { apiErrorMessage } from '@/lib/api';

const selectClass = 'h-9 rounded-md border bg-background px-2 text-sm';
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <div className='grid gap-2'><Label>{label}</Label>{children}</div>; }

function typeLabel(value: string) {
  return value.replaceAll('_', ' ').replace(/^./, (letter) => letter.toUpperCase());
}

export function CycleForm({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const create = useCreateCycle();
  const [name, setName] = useState('');
  const [appraisalType, setAppraisalType] = useState('annual');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [reviewStart, setReviewStart] = useState('');
  const [reviewEnd, setReviewEnd] = useState('');
  const [selfReview, setSelfReview] = useState(true);
  const [calibration, setCalibration] = useState(false);
  const [appealDays, setAppealDays] = useState('7');

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    try {
      await create.mutateAsync({
        name,
        appraisal_type: appraisalType,
        starts_at: start,
        ends_at: end,
        review_starts_at: reviewStart || null,
        review_ends_at: reviewEnd || null,
        self_review_enabled: selfReview,
        calibration_enabled: calibration,
        appeal_window_days: Number(appealDays) || 7,
      });
      toast.success('Appraisal cycle created.');
      onOpenChange(false);
      setName('');
    } catch (error) { toast.error(apiErrorMessage(error)); }
  }

  return (
    <FormDialog open={open} onOpenChange={onOpenChange} title='New appraisal cycle' description='Define the appraisal type, windows, and review configuration.' formId='cycle-form' isPending={create.isPending}>
      <form id='cycle-form' onSubmit={submit} className='grid gap-4 py-2'>
        <div className='grid grid-cols-2 gap-3'>
          <Field label='Cycle name'><Input value={name} onChange={(event) => setName(event.target.value)} required /></Field>
          <Field label='Appraisal type'>
            <select className={selectClass} value={appraisalType} onChange={(event) => setAppraisalType(event.target.value)}>
              {APPRAISAL_TYPES.map((type) => <option key={type} value={type}>{typeLabel(type)}</option>)}
            </select>
          </Field>
        </div>
        <div className='grid grid-cols-2 gap-3'><Field label='Performance starts'><Input type='date' value={start} onChange={(event) => setStart(event.target.value)} required /></Field><Field label='Performance ends'><Input type='date' value={end} onChange={(event) => setEnd(event.target.value)} required /></Field></div>
        <div className='grid grid-cols-2 gap-3'><Field label='Review starts'><Input type='date' value={reviewStart} onChange={(event) => setReviewStart(event.target.value)} /></Field><Field label='Review ends'><Input type='date' value={reviewEnd} onChange={(event) => setReviewEnd(event.target.value)} /></Field></div>
        <div className='grid grid-cols-2 gap-3'>
          <label className='flex items-center gap-2 text-sm'>
            <input type='checkbox' checked={selfReview} onChange={(event) => setSelfReview(event.target.checked)} className='size-4 accent-fruition-600' />
            Allow self review
          </label>
          <label className='flex items-center gap-2 text-sm'>
            <input type='checkbox' checked={calibration} onChange={(event) => setCalibration(event.target.checked)} className='size-4 accent-fruition-600' />
            HR calibration before approval
          </label>
        </div>
        <Field label='Appeal window (days after approval)'><Input type='number' min={1} max={90} value={appealDays} onChange={(event) => setAppealDays(event.target.value)} /></Field>
      </form>
    </FormDialog>
  );
}

export function AssignmentForm({
  open,
  onOpenChange,
  cycles,
  templates,
  employees,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cycles: AppraisalCycle[];
  templates: AppraisalTemplate[];
  employees: PerformanceEmployee[];
}) {
  const create = useCreateAssignment();
  const [cycleId, setCycleId] = useState('');
  const [templateId, setTemplateId] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [managerUserId, setManagerUserId] = useState('');
  const [selfWeight, setSelfWeight] = useState('10');
  const [dueDate, setDueDate] = useState('');
  const employee = employees.find((item) => item.id === Number(employeeId));
  const selfReviewWeight = employee?.user_id ? Number(selfWeight) : 0;
  const managerWeight = 100 - selfReviewWeight;

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const reviewers: Array<Record<string, unknown>> = [];
    if (employee?.user_id && selfReviewWeight > 0) reviewers.push({ reviewer_user_id: employee.user_id, reviewer_type: 'self', weight: selfReviewWeight });
    reviewers.push({ reviewer_user_id: Number(managerUserId), reviewer_type: 'manager', weight: managerWeight });
    try {
      await create.mutateAsync({
        appraisal_cycle_id: Number(cycleId),
        appraisal_template_id: Number(templateId),
        employee_id: Number(employeeId),
        due_date: dueDate || null,
        reviewers,
      });
      toast.success('Appraisal assigned.');
      onOpenChange(false);
    } catch (error) { toast.error(apiErrorMessage(error)); }
  }

  return (
    <FormDialog open={open} onOpenChange={onOpenChange} title='Assign appraisal' description='Choose the employee, template, and reviewer-source weights.' formId='assignment-form' isPending={create.isPending}>
      <form id='assignment-form' onSubmit={submit} className='grid gap-4 py-2'>
        <Field label='Open cycle'><select className={selectClass} value={cycleId} onChange={(event) => setCycleId(event.target.value)} required><option value=''>Select cycle</option>{cycles.filter((item) => item.status === 'open').map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></Field>
        <Field label='Template'><select className={selectClass} value={templateId} onChange={(event) => setTemplateId(event.target.value)} required><option value=''>Select template</option>{templates.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></Field>
        <Field label='Employee'><select className={selectClass} value={employeeId} onChange={(event) => setEmployeeId(event.target.value)} required><option value=''>Select employee</option>{employees.map((item) => <option key={item.id} value={item.id}>{item.full_name}</option>)}</select></Field>
        <Field label='Manager reviewer'><select className={selectClass} value={managerUserId} onChange={(event) => setManagerUserId(event.target.value)} required><option value=''>Select reviewer</option>{employees.filter((item) => item.user_id && item.id !== Number(employeeId)).map((item) => <option key={item.id} value={item.user_id!}>{item.full_name}</option>)}</select></Field>
        <div className='grid grid-cols-2 gap-3'>
          <Field label='Self weight %'><Input type='number' min={0} max={99} value={selfWeight} disabled={!employee?.user_id} onChange={(event) => setSelfWeight(event.target.value)} /></Field>
          <Field label='Manager weight %'><Input value={managerWeight} disabled /></Field>
        </div>
        <Field label='Review due date'><Input type='date' value={dueDate} onChange={(event) => setDueDate(event.target.value)} /></Field>
      </form>
    </FormDialog>
  );
}

export function GoalForm({
  open,
  onOpenChange,
  employees,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employees: PerformanceEmployee[];
}) {
  const create = useCreateGoal();
  const canManagePerformance = useCan('performance.manage');
  const { data: me } = useMe();
  const { departments } = useCompanyOptions();
  const [level, setLevel] = useState('individual');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [weight, setWeight] = useState('20');
  const [target, setTarget] = useState('');
  const [unit, setUnit] = useState('');
  const [dueDate, setDueDate] = useState('');

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    try {
      await create.mutateAsync({
        level: canManagePerformance ? level : 'individual',
        title,
        description: description || null,
        employee_id: level === 'individual' && employeeId ? Number(employeeId) : me?.employee?.id ?? null,
        department_id: level === 'department' && departmentId ? Number(departmentId) : null,
        weight: Number(weight),
        target_value: target ? Number(target) : null,
        measurement_unit: unit || null,
        progress: 0,
        status: 'active',
        due_at: dueDate || null,
      });
      toast.success('Goal created.');
      onOpenChange(false);
      setTitle('');
      setDescription('');
    } catch (error) { toast.error(apiErrorMessage(error)); }
  }

  return (
    <FormDialog open={open} onOpenChange={onOpenChange} title='New goal' description='Create a measurable company, department, or individual objective.' formId='goal-form' isPending={create.isPending}>
      <form id='goal-form' onSubmit={submit} className='grid gap-4 py-2'>
        {canManagePerformance && <Field label='Goal level'><select className={selectClass} value={level} onChange={(event) => setLevel(event.target.value)}><option value='company'>Company</option><option value='department'>Department</option><option value='individual'>Individual</option></select></Field>}
        {canManagePerformance && level === 'department' && <Field label='Department'><select className={selectClass} value={departmentId} onChange={(event) => setDepartmentId(event.target.value)} required><option value=''>Select department</option>{departments.data?.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></Field>}
        {canManagePerformance && level === 'individual' && <Field label='Employee'><select className={selectClass} value={employeeId} onChange={(event) => setEmployeeId(event.target.value)} required><option value=''>Select employee</option>{employees.map((item) => <option key={item.id} value={item.id}>{item.full_name}</option>)}</select></Field>}
        <Field label='Goal title'><Input value={title} onChange={(event) => setTitle(event.target.value)} required /></Field>
        <Field label='Description'><Input value={description} onChange={(event) => setDescription(event.target.value)} /></Field>
        <div className='grid grid-cols-2 gap-3'><Field label='Weight %'><Input type='number' min={0} max={100} value={weight} onChange={(event) => setWeight(event.target.value)} required /></Field><Field label='Due date'><Input type='date' value={dueDate} onChange={(event) => setDueDate(event.target.value)} /></Field></div>
        <div className='grid grid-cols-2 gap-3'><Field label='Target value'><Input type='number' value={target} onChange={(event) => setTarget(event.target.value)} /></Field><Field label='Unit'><Input value={unit} onChange={(event) => setUnit(event.target.value)} placeholder='Sales, modules, percent...' /></Field></div>
      </form>
    </FormDialog>
  );
}
