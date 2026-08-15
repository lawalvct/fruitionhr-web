'use client';

import { CircleAlert } from 'lucide-react';

export default function CareersError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className='grid min-h-[65vh] place-items-center bg-[#f8fbf9] px-5 py-16'>
      <div className='max-w-lg text-center'>
        <span className='mx-auto grid size-16 place-items-center rounded-2xl bg-amber-50 text-amber-700'><CircleAlert className='size-7' /></span>
        <h1 className='mt-6 text-3xl font-extrabold tracking-tight text-slate-900'>We could not load careers right now</h1>
        <p className='mt-3 text-base leading-7 text-slate-500'>Please try again. Your filters and page will remain in place.</p>
        <button type='button' onClick={reset} className='mt-7 h-12 rounded-xl bg-fruition-700 px-5 text-sm font-bold text-white hover:bg-fruition-800'>Try again</button>
      </div>
    </main>
  );
}
