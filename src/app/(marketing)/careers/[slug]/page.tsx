import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowLeft,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  CheckCircle2,
  MapPin,
  UsersRound,
} from 'lucide-react';

import { PublicApplicationForm } from '@/features/recruitment/public-application-form';
import { getPublicVacancy } from '@/features/recruitment/public-careers';
import { CompanyLogo } from '@/features/recruitment/company-logo';

type PageProps = { params: Promise<{ slug: string }> };

function formatDate(value: string | null): string | null {
  if (!value) return null;
  return new Intl.DateTimeFormat('en-NG', { dateStyle: 'long', timeZone: 'UTC' }).format(new Date(`${value}T00:00:00Z`));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const vacancy = await getPublicVacancy(slug);

  if (!vacancy) {
    return { title: 'Vacancy unavailable', robots: { index: false, follow: false } };
  }

  return {
    title: `${vacancy.title} at ${vacancy.company.name}`,
    description: vacancy.description.replace(/\s+/g, ' ').slice(0, 155),
  };
}

export default async function VacancyPage({ params }: PageProps) {
  const { slug } = await params;
  const vacancy = await getPublicVacancy(slug);
  if (!vacancy) notFound();

  const closingDate = formatDate(vacancy.closes_at);
  const openingDate = formatDate(vacancy.opens_at);

  return (
    <main className='bg-[#f8fbf9]'>
      <section className='border-b border-fruition-100 bg-white'>
        <div className='mx-auto max-w-[1180px] px-5 py-10 sm:px-8 sm:py-14'>
          <Link href='/careers' className='inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-fruition-700'>
            <ArrowLeft className='size-4' /> Back to all vacancies
          </Link>

          <div className='mt-8 flex flex-col gap-6 sm:flex-row sm:items-start'>
            <CompanyLogo company={vacancy.company} className='size-16 rounded-2xl text-lg sm:size-20' />
            <div className='min-w-0 flex-1'>
              <p className='text-sm font-bold text-fruition-700'>{vacancy.company.name}</p>
              <h1 className='mt-2 max-w-4xl text-3xl leading-tight font-extrabold tracking-[-0.035em] text-slate-950 sm:text-5xl'>{vacancy.title}</h1>
              <div className='mt-5 flex flex-wrap gap-x-5 gap-y-3 text-sm text-slate-500'>
                {vacancy.location && <span className='inline-flex items-center gap-2'><MapPin className='size-4 text-fruition-600' />{vacancy.location}</span>}
                {vacancy.employment_type && <span className='inline-flex items-center gap-2'><BriefcaseBusiness className='size-4 text-fruition-600' />{vacancy.employment_type.name}</span>}
                {vacancy.department && <span className='inline-flex items-center gap-2'><Building2 className='size-4 text-fruition-600' />{vacancy.department.name}</span>}
                <span className='inline-flex items-center gap-2'><UsersRound className='size-4 text-fruition-600' />{vacancy.positions_available} {vacancy.positions_available === 1 ? 'position' : 'positions'}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className='mx-auto grid max-w-[1180px] gap-8 px-5 py-10 sm:px-8 sm:py-14 lg:grid-cols-[minmax(0,1fr)_430px] lg:items-start'>
        <article className='min-w-0'>
          <div className='rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_15px_45px_rgba(15,23,42,0.04)] sm:p-8'>
            <section>
              <p className='text-sm font-bold tracking-wide text-fruition-700 uppercase'>The opportunity</p>
              <h2 className='mt-2 text-2xl font-extrabold tracking-tight text-slate-900'>About the role</h2>
              <div className='mt-5 whitespace-pre-line text-[15px] leading-8 text-slate-600'>{vacancy.description}</div>
            </section>

            {vacancy.requirements && (
              <section className='mt-9 border-t border-slate-100 pt-8'>
                <p className='text-sm font-bold tracking-wide text-fruition-700 uppercase'>What you will bring</p>
                <h2 className='mt-2 text-2xl font-extrabold tracking-tight text-slate-900'>Requirements</h2>
                <div className='mt-5 whitespace-pre-line text-[15px] leading-8 text-slate-600'>{vacancy.requirements}</div>
              </section>
            )}
          </div>

          <div className='mt-6 rounded-3xl border border-fruition-100 bg-fruition-950 p-6 text-white sm:p-8'>
            <div className='flex items-start gap-4'>
              <span className='grid size-11 shrink-0 place-items-center rounded-2xl bg-white/10 text-fruition-200'><CheckCircle2 className='size-5' /></span>
              <div>
                <h2 className='text-lg font-extrabold'>A direct application to {vacancy.company.name}</h2>
                <p className='mt-2 text-sm leading-7 text-fruition-100/75'>Your application goes into the company&apos;s FruitionHR recruitment pipeline so its hiring team can review and manage it securely.</p>
              </div>
            </div>
          </div>
        </article>

        <aside id='apply' className='scroll-mt-28 lg:sticky lg:top-28'>
          <div className='mb-5 grid grid-cols-2 gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-sm'>
            <div>
              <p className='text-xs font-semibold tracking-wide text-slate-400 uppercase'>Applications</p>
              <p className='mt-1 font-bold text-slate-800'>{closingDate ? `Close ${closingDate}` : 'Open until filled'}</p>
            </div>
            <div>
              <p className='text-xs font-semibold tracking-wide text-slate-400 uppercase'>Posted</p>
              <p className='mt-1 inline-flex items-center gap-1.5 font-bold text-slate-800'><CalendarDays className='size-4 text-fruition-600' />{openingDate ?? 'Recently'}</p>
            </div>
          </div>
          <PublicApplicationForm slug={vacancy.slug} vacancyTitle={vacancy.title} companyName={vacancy.company.name} />
        </aside>
      </section>
    </main>
  );
}
