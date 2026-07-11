'use client';

import { useState } from 'react';
import { toast } from 'sonner';

import { FormDialog } from '@/components/form-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCompanyOptions } from '@/features/company/use-company';
import {
  useCreateApplication,
  useCreateRequisition,
  useCreateVacancy,
} from '@/features/recruitment/use-recruitment';
import type { Requisition, Vacancy } from '@/features/recruitment/types';
import { apiErrorMessage } from '@/lib/api';

const selectClass = 'h-9 rounded-md border bg-background px-2 text-sm';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className='grid gap-2'><Label>{label}</Label>{children}</div>;
}

export function RequisitionForm({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const create = useCreateRequisition();
  const { departments, positions, employmentTypes } = useCompanyOptions();
  const [title, setTitle] = useState('');
  const [headcount, setHeadcount] = useState('1');
  const [departmentId, setDepartmentId] = useState('');
  const [positionId, setPositionId] = useState('');
  const [employmentTypeId, setEmploymentTypeId] = useState('');
  const [targetStartDate, setTargetStartDate] = useState('');
  const [reason, setReason] = useState('');

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    try {
      await create.mutateAsync({
        title,
        headcount: Number(headcount),
        department_id: departmentId ? Number(departmentId) : null,
        position_id: positionId ? Number(positionId) : null,
        employment_type_id: employmentTypeId ? Number(employmentTypeId) : null,
        target_start_date: targetStartDate || null,
        reason,
      });
      toast.success('Requisition saved as draft.');
      onOpenChange(false);
      setTitle('');
      setReason('');
    } catch (error) {
      toast.error(apiErrorMessage(error));
    }
  }

  return (
    <FormDialog open={open} onOpenChange={onOpenChange} title='New manpower requisition' description='Define the role and approved headcount needed.' formId='requisition-form' isPending={create.isPending}>
      <form id='requisition-form' onSubmit={submit} className='grid gap-4 py-2'>
        <Field label='Requisition title'><Input value={title} onChange={(event) => setTitle(event.target.value)} required /></Field>
        <div className='grid grid-cols-2 gap-3'>
          <Field label='Headcount'><Input type='number' min={1} value={headcount} onChange={(event) => setHeadcount(event.target.value)} required /></Field>
          <Field label='Target start'><Input type='date' value={targetStartDate} onChange={(event) => setTargetStartDate(event.target.value)} /></Field>
        </div>
        <Field label='Department'>
          <select className={selectClass} value={departmentId} onChange={(event) => setDepartmentId(event.target.value)}>
            <option value=''>Not assigned</option>
            {departments.data?.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
        </Field>
        <Field label='Position'>
          <select className={selectClass} value={positionId} onChange={(event) => setPositionId(event.target.value)}>
            <option value=''>Not assigned</option>
            {positions.data?.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
          </select>
        </Field>
        <Field label='Employment type'>
          <select className={selectClass} value={employmentTypeId} onChange={(event) => setEmploymentTypeId(event.target.value)}>
            <option value=''>Not assigned</option>
            {employmentTypes.data?.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
        </Field>
        <Field label='Business reason'><Input value={reason} onChange={(event) => setReason(event.target.value)} required /></Field>
      </form>
    </FormDialog>
  );
}

export function VacancyForm({ open, onOpenChange, requisitions }: { open: boolean; onOpenChange: (open: boolean) => void; requisitions: Requisition[] }) {
  const create = useCreateVacancy();
  const { employmentTypes } = useCompanyOptions();
  const [requisitionId, setRequisitionId] = useState('');
  const [title, setTitle] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [positions, setPositions] = useState('1');
  const [employmentTypeId, setEmploymentTypeId] = useState('');
  const [closesAt, setClosesAt] = useState('');

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    try {
      await create.mutateAsync({
        manpower_requisition_id: Number(requisitionId),
        employment_type_id: employmentTypeId ? Number(employmentTypeId) : null,
        title,
        code: code || null,
        description,
        location: location || null,
        positions_available: Number(positions),
        closes_at: closesAt || null,
      });
      toast.success('Vacancy created as draft.');
      onOpenChange(false);
      setTitle('');
      setDescription('');
    } catch (error) {
      toast.error(apiErrorMessage(error));
    }
  }

  return (
    <FormDialog open={open} onOpenChange={onOpenChange} title='Create vacancy' description='A vacancy must use approved requisition headcount.' formId='vacancy-form' isPending={create.isPending}>
      <form id='vacancy-form' onSubmit={submit} className='grid gap-4 py-2'>
        <Field label='Approved requisition'>
          <select className={selectClass} value={requisitionId} onChange={(event) => setRequisitionId(event.target.value)} required>
            <option value=''>Select requisition</option>
            {requisitions.filter((item) => item.status === 'approved').map((item) => <option key={item.id} value={item.id}>{item.title} ({item.headcount})</option>)}
          </select>
        </Field>
        <Field label='Vacancy title'><Input value={title} onChange={(event) => setTitle(event.target.value)} required /></Field>
        <div className='grid grid-cols-2 gap-3'>
          <Field label='Code'><Input value={code} onChange={(event) => setCode(event.target.value)} /></Field>
          <Field label='Positions'><Input type='number' min={1} value={positions} onChange={(event) => setPositions(event.target.value)} required /></Field>
        </div>
        <Field label='Employment type'>
          <select className={selectClass} value={employmentTypeId} onChange={(event) => setEmploymentTypeId(event.target.value)}>
            <option value=''>Use requisition default</option>
            {employmentTypes.data?.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
        </Field>
        <Field label='Description'><Input value={description} onChange={(event) => setDescription(event.target.value)} required /></Field>
        <div className='grid grid-cols-2 gap-3'>
          <Field label='Location'><Input value={location} onChange={(event) => setLocation(event.target.value)} /></Field>
          <Field label='Closing date'><Input type='date' value={closesAt} onChange={(event) => setClosesAt(event.target.value)} /></Field>
        </div>
      </form>
    </FormDialog>
  );
}

export function CandidateForm({ open, onOpenChange, vacancies }: { open: boolean; onOpenChange: (open: boolean) => void; vacancies: Vacancy[] }) {
  const create = useCreateApplication();
  const [vacancyId, setVacancyId] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [source, setSource] = useState('');

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    try {
      await create.mutateAsync({
        vacancy_id: Number(vacancyId),
        first_name: firstName,
        last_name: lastName,
        email,
        phone: phone || null,
        source: source || null,
      });
      toast.success('Candidate added to the pipeline.');
      onOpenChange(false);
      setFirstName('');
      setLastName('');
      setEmail('');
    } catch (error) {
      toast.error(apiErrorMessage(error));
    }
  }

  return (
    <FormDialog open={open} onOpenChange={onOpenChange} title='Add candidate' description='Add an applicant to an open vacancy.' formId='candidate-form' isPending={create.isPending}>
      <form id='candidate-form' onSubmit={submit} className='grid gap-4 py-2'>
        <Field label='Open vacancy'>
          <select className={selectClass} value={vacancyId} onChange={(event) => setVacancyId(event.target.value)} required>
            <option value=''>Select vacancy</option>
            {vacancies.filter((item) => item.status === 'open').map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
          </select>
        </Field>
        <div className='grid grid-cols-2 gap-3'>
          <Field label='First name'><Input value={firstName} onChange={(event) => setFirstName(event.target.value)} required /></Field>
          <Field label='Last name'><Input value={lastName} onChange={(event) => setLastName(event.target.value)} required /></Field>
        </div>
        <Field label='Email'><Input type='email' value={email} onChange={(event) => setEmail(event.target.value)} required /></Field>
        <div className='grid grid-cols-2 gap-3'>
          <Field label='Phone'><Input value={phone} onChange={(event) => setPhone(event.target.value)} /></Field>
          <Field label='Source'><Input value={source} onChange={(event) => setSource(event.target.value)} placeholder='Referral, LinkedIn...' /></Field>
        </div>
      </form>
    </FormDialog>
  );
}
