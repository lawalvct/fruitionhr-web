'use client';

import { CheckCircle2, FileText, LoaderCircle, MailCheck, ShieldCheck, UploadCloud } from 'lucide-react';
import Link from 'next/link';
import { type FormEvent, useState } from 'react';

import { Button } from '@/components/ui/button';
import { api, apiErrorMessage, isConflictError, isValidationError } from '@/lib/api';
import { type AppliedRecord, forgetApplication, rememberApplication, useAppliedRecord } from './applied-vacancies';

type FieldErrors = Record<string, string | undefined>;

/** Fields with a FieldError slot below. Anything else has to reach the banner instead. */
const VISIBLE_FIELDS = new Set([
  'first_name', 'last_name', 'email', 'phone', 'city', 'state',
  'linkedin_url', 'cover_letter', 'resume', 'privacy_consent',
]);

const HONEYPOT_FIELD = 'referrer_code';

const inputClass = 'mt-2 h-12 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-fruition-500 focus:ring-4 focus:ring-fruition-100';
const textareaClass = 'mt-2 min-h-36 w-full resize-y rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-fruition-500 focus:ring-4 focus:ring-fruition-100';

function FieldError({ errors, name }: { errors: FieldErrors; name: string }) {
  const message = errors[name];
  return message ? <p id={`${name}-error`} className='mt-1.5 text-xs font-medium text-red-600'>{message}</p> : null;
}

export function PublicApplicationForm({
  slug,
  vacancyTitle,
  companyName,
}: {
  slug: string;
  vacancyTitle: string;
  companyName: string;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [justSubmitted, setJustSubmitted] = useState(false);
  const applied = useAppliedRecord(slug);

  function recordApplication(email: string, reference: string | null) {
    const record: AppliedRecord = { reference, email, at: new Date().toISOString() };
    rememberApplication(slug, record);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const resume = data.get('resume');
    const email = String(data.get('email') ?? '');

    setFieldErrors({});
    setFormError(null);

    if (!(resume instanceof File) || resume.size === 0) {
      setFieldErrors({ resume: 'Please attach your CV or résumé.' });
      return;
    }

    if (resume.size > 5 * 1024 * 1024) {
      setFieldErrors({ resume: 'Your file must be 5 MB or smaller.' });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await api.post<{ data: { reference: string } }>(`/api/v1/careers/${slug}/apply`, data);
      setJustSubmitted(true);
      recordApplication(email, response.data.data.reference);
      form.reset();
    } catch (error) {
      if (isValidationError(error)) {
        const errors = error.response!.data.errors;
        setFieldErrors(Object.fromEntries(
          Object.entries(errors).map(([name, messages]) => [name, messages[0]]),
        ));

        // An error on a field the form does not render would otherwise vanish:
        // the spinner stops, nothing appears, and the candidate is left
        // clicking Submit forever. Everything unaccounted for goes to the
        // banner at the top of the form.
        const unattached = Object.keys(errors).filter((name) => !VISIBLE_FIELDS.has(name));
        if (unattached.includes(HONEYPOT_FIELD)) {
          setFormError('We could not verify this submission. If your browser or password manager filled the form in for you, clear it, type your details in yourself, and try again.');
        } else if (unattached.length > 0) {
          setFormError(unattached.map((name) => errors[name][0]).join(' '));
        }
      } else if (isConflictError(error)) {
        // The server has seen this address on this vacancy before — this
        // device just did not know yet. Remember it so the next visit is
        // answered without another upload.
        recordApplication(email, null);
      } else {
        setFormError(apiErrorMessage(error));
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  if (applied) {
    return (
      <AppliedPanel
        record={applied}
        justSubmitted={justSubmitted}
        vacancyTitle={vacancyTitle}
        companyName={companyName}
        onSomeoneElse={() => forgetApplication(slug)}
      />
    );
  }

  return (
    <form onSubmit={submit} className='rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_20px_55px_rgba(15,23,42,0.07)] sm:p-7' noValidate>
      <div className='flex items-start gap-3 border-b border-slate-100 pb-5'>
        <span className='grid size-11 shrink-0 place-items-center rounded-2xl bg-fruition-50 text-fruition-700'>
          <FileText className='size-5' />
        </span>
        <div>
          <h2 className='text-xl font-extrabold tracking-tight text-slate-900'>Apply for this role</h2>
          <p className='mt-1 text-sm leading-6 text-slate-500'>Share your details and résumé with the hiring team.</p>
        </div>
      </div>

      {formError && (
        <div className='mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700' role='alert'>
          {formError}
        </div>
      )}

      <div className='mt-6 grid gap-5 sm:grid-cols-2'>
        <label className='text-sm font-semibold text-slate-700' htmlFor='first_name'>
          First name <span className='text-red-500'>*</span>
          <input id='first_name' name='first_name' className={inputClass} autoComplete='given-name' required aria-invalid={Boolean(fieldErrors.first_name)} aria-describedby={fieldErrors.first_name ? 'first_name-error' : undefined} />
          <FieldError errors={fieldErrors} name='first_name' />
        </label>
        <label className='text-sm font-semibold text-slate-700' htmlFor='last_name'>
          Last name <span className='text-red-500'>*</span>
          <input id='last_name' name='last_name' className={inputClass} autoComplete='family-name' required aria-invalid={Boolean(fieldErrors.last_name)} aria-describedby={fieldErrors.last_name ? 'last_name-error' : undefined} />
          <FieldError errors={fieldErrors} name='last_name' />
        </label>
        <label className='text-sm font-semibold text-slate-700' htmlFor='email'>
          Email address <span className='text-red-500'>*</span>
          <input id='email' name='email' type='email' className={inputClass} autoComplete='email' required aria-invalid={Boolean(fieldErrors.email)} aria-describedby={fieldErrors.email ? 'email-error' : undefined} />
          <FieldError errors={fieldErrors} name='email' />
        </label>
        <label className='text-sm font-semibold text-slate-700' htmlFor='phone'>
          Phone number <span className='text-red-500'>*</span>
          <input id='phone' name='phone' type='tel' className={inputClass} autoComplete='tel' required aria-invalid={Boolean(fieldErrors.phone)} aria-describedby={fieldErrors.phone ? 'phone-error' : undefined} />
          <FieldError errors={fieldErrors} name='phone' />
        </label>
        <label className='text-sm font-semibold text-slate-700' htmlFor='city'>
          City
          <input id='city' name='city' className={inputClass} autoComplete='address-level2' aria-invalid={Boolean(fieldErrors.city)} aria-describedby={fieldErrors.city ? 'city-error' : undefined} />
          <FieldError errors={fieldErrors} name='city' />
        </label>
        <label className='text-sm font-semibold text-slate-700' htmlFor='state'>
          State
          <input id='state' name='state' className={inputClass} autoComplete='address-level1' aria-invalid={Boolean(fieldErrors.state)} aria-describedby={fieldErrors.state ? 'state-error' : undefined} />
          <FieldError errors={fieldErrors} name='state' />
        </label>
      </div>

      <label className='mt-5 block text-sm font-semibold text-slate-700' htmlFor='linkedin_url'>
        LinkedIn profile <span className='font-normal text-slate-400'>(optional)</span>
        <input id='linkedin_url' name='linkedin_url' type='url' className={inputClass} placeholder='https://linkedin.com/in/your-name' aria-invalid={Boolean(fieldErrors.linkedin_url)} aria-describedby={fieldErrors.linkedin_url ? 'linkedin_url-error' : undefined} />
        <FieldError errors={fieldErrors} name='linkedin_url' />
      </label>

      <label className='mt-5 block text-sm font-semibold text-slate-700' htmlFor='cover_letter'>
        Why are you a good fit? <span className='font-normal text-slate-400'>(optional)</span>
        <textarea id='cover_letter' name='cover_letter' className={textareaClass} placeholder='Tell the hiring team about your relevant experience and interest in this role.' aria-invalid={Boolean(fieldErrors.cover_letter)} aria-describedby={fieldErrors.cover_letter ? 'cover_letter-error' : undefined} />
        <FieldError errors={fieldErrors} name='cover_letter' />
      </label>

      <label className='mt-5 block text-sm font-semibold text-slate-700' htmlFor='resume'>
        CV or résumé <span className='text-red-500'>*</span>
        <span className='mt-2 flex cursor-pointer items-center gap-3 rounded-2xl border border-dashed border-fruition-300 bg-fruition-50/60 px-4 py-4 transition hover:bg-fruition-50'>
          <span className='grid size-10 shrink-0 place-items-center rounded-xl bg-white text-fruition-700 shadow-sm'><UploadCloud className='size-5' /></span>
          <span>
            <span className='block text-sm font-semibold text-slate-700'>Choose a PDF, DOC, or DOCX file</span>
            <span className='mt-0.5 block text-xs font-normal text-slate-500'>Maximum file size: 5 MB</span>
          </span>
        </span>
        <input id='resume' name='resume' type='file' className='sr-only' accept='.pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document' required aria-invalid={Boolean(fieldErrors.resume)} aria-describedby={fieldErrors.resume ? 'resume-error' : 'resume-help'} />
        <span id='resume-help' className='sr-only'>Accepted formats are PDF, DOC, and DOCX, up to 5 MB.</span>
        <FieldError errors={fieldErrors} name='resume' />
      </label>

      {/*
        Honeypot: off-screen, unfocusable, and hidden from assistive tech, so
        only an automated filler reaches it. The name is deliberately inert —
        it was once "website", which password managers and browser autofill
        cheerfully filled in on a contact form, turning real candidates away as
        bots. autocomplete="off" alone is advisory and widely ignored, hence
        the per-manager opt-outs. Must match PublicApplicationRequest.
      */}
      <div className='absolute -left-[10000px] top-auto size-px overflow-hidden' aria-hidden='true'>
        <label htmlFor='referrer_code'>Referrer code</label>
        <input
          id='referrer_code'
          name='referrer_code'
          type='text'
          tabIndex={-1}
          autoComplete='off'
          data-lpignore='true'
          data-1p-ignore=''
          data-bwignore=''
          data-form-type='other'
        />
      </div>

      <label className='mt-5 flex items-start gap-3 rounded-xl bg-slate-50 px-4 py-3 text-xs leading-5 text-slate-600'>
        <input name='privacy_consent' type='checkbox' value='1' className='mt-0.5 size-4 shrink-0 accent-fruition-700' required />
        <span>I consent to {companyName} and FruitionHR processing my information for this recruitment application.</span>
      </label>
      <FieldError errors={fieldErrors} name='privacy_consent' />

      <Button type='submit' size='lg' className='mt-6 h-13 w-full rounded-xl bg-linear-135 from-fruition-800 to-fruition-600 text-white shadow-[0_12px_28px_rgba(4,120,87,0.2)] hover:opacity-90' disabled={isSubmitting}>
        {isSubmitting ? <><LoaderCircle className='size-4 animate-spin' /> Submitting application...</> : 'Submit application'}
      </Button>
      <p className='mt-4 flex items-center justify-center gap-1.5 text-center text-xs text-slate-400'>
        <ShieldCheck className='size-3.5' /> Your information is sent securely to the hiring company.
      </p>
    </form>
  );
}

/**
 * Shown in place of the form once this device knows the visitor has applied —
 * whether they just did, or did so on an earlier visit.
 */
function AppliedPanel({
  record,
  justSubmitted,
  vacancyTitle,
  companyName,
  onSomeoneElse,
}: {
  record: AppliedRecord;
  justSubmitted: boolean;
  vacancyTitle: string;
  companyName: string;
  /** Clears the local record so a different person on this device can apply. */
  onSomeoneElse: () => void;
}) {
  const appliedOn = new Intl.DateTimeFormat('en-NG', { dateStyle: 'long' }).format(new Date(record.at));

  return (
    <div className='rounded-3xl border border-fruition-200 bg-fruition-50 p-6 text-center sm:p-8' role='status'>
      <span className='mx-auto grid size-14 place-items-center rounded-2xl bg-white text-fruition-700 shadow-sm'>
        {justSubmitted ? <CheckCircle2 className='size-7' /> : <MailCheck className='size-7' />}
      </span>

      <h2 className='mt-5 text-2xl font-extrabold tracking-tight text-slate-900'>
        {justSubmitted ? 'Application received' : 'You have already applied'}
      </h2>

      <p className='mt-3 text-sm leading-7 text-slate-600'>
        {justSubmitted ? (
          <>Your application for <strong>{vacancyTitle}</strong> has been sent to {companyName}.</>
        ) : (
          <>You applied for <strong>{vacancyTitle}</strong> at {companyName} on {appliedOn}. There is no need to send it again — {companyName} already has your details.</>
        )}
      </p>

      {record.reference ? (
        <div className='mt-5 rounded-xl border border-fruition-200 bg-white px-4 py-3'>
          <p className='text-xs font-semibold tracking-wide text-slate-500 uppercase'>Application reference</p>
          <p className='mt-1 text-lg font-extrabold text-fruition-800'>{record.reference}</p>
        </div>
      ) : null}

      {record.email ? (
        <p className='mt-4 text-xs leading-5 text-slate-500'>Sent using {record.email}</p>
      ) : null}

      <p className='mt-4 text-xs leading-5 text-slate-500'>
        {justSubmitted
          ? 'Keep this reference for your records. The hiring team will contact you if your profile progresses.'
          : 'The hiring team will contact you if your profile progresses.'}
      </p>

      <Button className='mt-6 rounded-xl' variant='outline' render={<Link href='/careers' />}>
        Explore more vacancies
      </Button>

      {!justSubmitted && (
        <p className='mt-5 border-t border-fruition-200 pt-4 text-xs text-slate-500'>
          Sharing this device?{' '}
          <button type='button' onClick={onSomeoneElse} className='font-semibold text-fruition-800 underline underline-offset-2 hover:text-fruition-700'>
            Apply with a different email
          </button>
        </p>
      )}
    </div>
  );
}
