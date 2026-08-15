import { BriefcaseBusiness } from 'lucide-react';
import Link from 'next/link';

export default function VacancyNotFound() {
  return (
    <main className='grid min-h-[65vh] place-items-center bg-[#f8fbf9] px-5 py-16'>
      <div className='max-w-lg text-center'>
        <span className='mx-auto grid size-16 place-items-center rounded-2xl bg-fruition-50 text-fruition-700'><BriefcaseBusiness className='size-7' /></span>
        <h1 className='mt-6 text-3xl font-extrabold tracking-tight text-slate-900'>This vacancy is no longer available</h1>
        <p className='mt-3 text-base leading-7 text-slate-500'>It may have closed, been filled, or been made private by the hiring company.</p>
        <Link href='/careers' className='mt-7 inline-flex h-12 items-center rounded-xl bg-fruition-700 px-5 text-sm font-bold text-white hover:bg-fruition-800'>Browse current vacancies</Link>
      </div>
    </main>
  );
}
