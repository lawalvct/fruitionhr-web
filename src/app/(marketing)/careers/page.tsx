import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  MapPin,
  Search,
  SlidersHorizontal,
  UsersRound,
  X,
} from 'lucide-react';

import {
  type CareerFilterOption,
  getPublicVacancies,
  type PublicCareersQuery,
  type PublicVacancy,
} from '@/features/recruitment/public-careers';
import { CompanyLogo } from '@/features/recruitment/company-logo';

export const metadata: Metadata = {
  title: 'Careers',
  description: 'Discover open roles from growing companies using FruitionHR and apply directly through our careers portal.',
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? '' : value ?? '';
}

function formatDate(value: string | null): string | null {
  if (!value) return null;
  return new Intl.DateTimeFormat('en-NG', { dateStyle: 'medium', timeZone: 'UTC' }).format(new Date(`${value}T00:00:00Z`));
}

function excerpt(value: string): string {
  const text = value.replace(/\s+/g, ' ').trim();
  return text.length > 180 ? `${text.slice(0, 177)}...` : text;
}

function careersHref(query: PublicCareersQuery, page: number): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries({ ...query, page })) {
    if (value !== undefined && value !== '') params.set(key, String(value));
  }
  return `/careers?${params.toString()}`;
}

function FilterSelect({
  label,
  name,
  value,
  options,
  allLabel,
}: {
  label: string;
  name: string;
  value: string;
  options: CareerFilterOption[];
  allLabel: string;
}) {
  return (
    <label className='block text-xs font-bold tracking-wide text-slate-500 uppercase'>
      {label}
      <select name={name} defaultValue={value} className='mt-2 h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none transition focus:border-fruition-500 focus:ring-4 focus:ring-fruition-100'>
        <option value=''>{allLabel}</option>
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    </label>
  );
}

function VacancyCard({ vacancy }: { vacancy: PublicVacancy }) {
  const closingDate = formatDate(vacancy.closes_at);

  return (
    <article className='group flex h-full flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_15px_45px_rgba(15,23,42,0.045)] transition duration-300 hover:-translate-y-1 hover:border-fruition-200 hover:shadow-[0_22px_55px_rgba(4,120,87,0.1)]'>
      <div className='flex items-start gap-4'>
        <CompanyLogo company={vacancy.company} className='size-12 rounded-2xl text-sm' />
        <div className='min-w-0'>
          <p className='truncate text-sm font-semibold text-fruition-700'>{vacancy.company.name}</p>
          <h2 className='mt-1 text-xl leading-7 font-extrabold tracking-tight text-slate-900'>{vacancy.title}</h2>
        </div>
      </div>

      <div className='mt-5 flex flex-wrap gap-2 text-xs font-medium text-slate-600'>
        {vacancy.location && <span className='inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5'><MapPin className='size-3.5' />{vacancy.location}</span>}
        {vacancy.employment_type && <span className='inline-flex items-center gap-1.5 rounded-full bg-fruition-50 px-3 py-1.5 text-fruition-800'><BriefcaseBusiness className='size-3.5' />{vacancy.employment_type.name}</span>}
        {vacancy.department && <span className='inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5'><Building2 className='size-3.5' />{vacancy.department.name}</span>}
      </div>

      <p className='mt-5 flex-1 text-sm leading-7 text-slate-500'>{excerpt(vacancy.description)}</p>

      <div className='mt-6 flex items-center justify-between gap-4 border-t border-slate-100 pt-5'>
        <p className='text-xs text-slate-400'>{closingDate ? `Closes ${closingDate}` : 'Applications open'}</p>
        <Link href={`/careers/${vacancy.slug}`} className='inline-flex items-center gap-1.5 text-sm font-bold text-fruition-700 transition group-hover:gap-2.5 hover:text-fruition-900'>
          View role <ArrowRight className='size-4' />
        </Link>
      </div>
    </article>
  );
}

export default async function CareersPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const rawPage = Number(first(params.page));
  const query: PublicCareersQuery = {
    search: first(params.search).trim() || undefined,
    location: first(params.location).trim() || undefined,
    company: first(params.company).trim() || undefined,
    employment_type: first(params.employment_type).trim() || undefined,
    department: first(params.department).trim() || undefined,
    page: Number.isInteger(rawPage) && rawPage > 0 ? rawPage : 1,
  };
  const result = await getPublicVacancies(query);
  const hasFilters = Boolean(query.search || query.location || query.company || query.employment_type || query.department);

  return (
    <main className='bg-[#f8fbf9]'>
      <section className='relative overflow-hidden border-b border-fruition-100 bg-white'>
        <div className='pointer-events-none absolute inset-y-0 right-0 w-3/5 bg-[radial-gradient(circle_at_70%_40%,rgba(134,239,172,0.25),transparent_52%)]' />
        <div className='pointer-events-none absolute top-10 right-[12%] size-64 rounded-full border border-fruition-100' />
        <div className='relative mx-auto max-w-[1280px] px-5 py-16 sm:px-8 sm:py-20'>
          <span className='inline-flex items-center gap-2 rounded-full border border-fruition-200 bg-fruition-50 px-4 py-2 text-sm font-bold text-fruition-800'>
            <BriefcaseBusiness className='size-4' /> FruitionHR Careers
          </span>
          <div className='mt-7 grid gap-10 lg:grid-cols-[1fr_.75fr] lg:items-end'>
            <div>
              <h1 className='max-w-3xl text-4xl leading-tight font-extrabold tracking-[-0.04em] text-slate-950 sm:text-6xl'>Find work where your contribution matters.</h1>
              <p className='mt-5 max-w-2xl text-base leading-8 text-slate-500 sm:text-lg'>Explore verified opportunities from growing organisations across Africa, then apply directly to their hiring teams.</p>
            </div>
            <div className='grid grid-cols-3 gap-3'>
              <div className='rounded-2xl border border-fruition-100 bg-white/90 p-4 shadow-sm'>
                <p className='text-2xl font-extrabold text-slate-900'>{result.summary.open_vacancies}</p>
                <p className='mt-1 text-xs text-slate-500'>Open vacancies</p>
              </div>
              <div className='rounded-2xl border border-fruition-100 bg-white/90 p-4 shadow-sm'>
                <p className='text-2xl font-extrabold text-slate-900'>{result.summary.open_positions}</p>
                <p className='mt-1 text-xs text-slate-500'>Open positions</p>
              </div>
              <div className='rounded-2xl border border-fruition-100 bg-white/90 p-4 shadow-sm'>
                <p className='text-2xl font-extrabold text-slate-900'>{result.summary.companies}</p>
                <p className='mt-1 text-xs text-slate-500'>Hiring companies</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className='mx-auto max-w-[1280px] px-5 py-10 sm:px-8 sm:py-14'>
        <form action='/careers' method='get' className='rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_16px_50px_rgba(15,23,42,0.06)] sm:p-6'>
          <div className='flex items-center gap-2 text-sm font-extrabold text-slate-900'><SlidersHorizontal className='size-4 text-fruition-700' /> Search and filter vacancies</div>
          <div className='mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-5'>
            <label className='block text-xs font-bold tracking-wide text-slate-500 uppercase'>
              Keywords
              <span className='relative mt-2 block'>
                <Search className='pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-slate-400' />
                <input name='search' defaultValue={query.search ?? ''} className='h-12 w-full rounded-xl border border-slate-200 bg-white pr-3 pl-10 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-fruition-500 focus:ring-4 focus:ring-fruition-100' placeholder='Role, skill, or company' />
              </span>
            </label>
            <FilterSelect label='Location' name='location' value={query.location ?? ''} options={result.filters.locations} allLabel='All locations' />
            <FilterSelect label='Company' name='company' value={query.company ?? ''} options={result.filters.companies} allLabel='All companies' />
            <FilterSelect label='Employment type' name='employment_type' value={query.employment_type ?? ''} options={result.filters.employment_types} allLabel='All types' />
            <FilterSelect label='Department' name='department' value={query.department ?? ''} options={result.filters.departments} allLabel='All departments' />
          </div>
          <div className='mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-5'>
            <p className='text-sm text-slate-500'>Showing <strong className='text-slate-800'>{result.meta.total}</strong> matching {result.meta.total === 1 ? 'vacancy' : 'vacancies'}</p>
            <div className='flex items-center gap-2'>
              {hasFilters && <Link href='/careers' className='inline-flex h-11 items-center gap-1.5 rounded-xl px-4 text-sm font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-800'><X className='size-4' /> Clear filters</Link>}
              <button type='submit' className='inline-flex h-11 items-center gap-2 rounded-xl bg-fruition-700 px-5 text-sm font-bold text-white shadow-[0_10px_22px_rgba(4,120,87,0.18)] transition hover:bg-fruition-800'>
                <Search className='size-4' /> Find vacancies
              </button>
            </div>
          </div>
        </form>

        <div className='mt-10 flex items-end justify-between gap-4'>
          <div>
            <p className='text-sm font-bold tracking-wide text-fruition-700 uppercase'>Latest opportunities</p>
            <h2 className='mt-2 text-3xl font-extrabold tracking-tight text-slate-900'>Open roles</h2>
          </div>
          <p className='hidden text-sm text-slate-400 sm:block'>Published by companies hiring through FruitionHR</p>
        </div>

        {result.data.length > 0 ? (
          <div className='mt-7 grid gap-5 md:grid-cols-2 xl:grid-cols-3'>
            {result.data.map((vacancy) => <VacancyCard key={vacancy.slug} vacancy={vacancy} />)}
          </div>
        ) : (
          <div className='mt-7 rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center'>
            <span className='mx-auto grid size-14 place-items-center rounded-2xl bg-slate-100 text-slate-500'><UsersRound className='size-6' /></span>
            <h2 className='mt-5 text-xl font-extrabold text-slate-900'>No vacancies match these filters</h2>
            <p className='mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500'>Try a broader keyword or clear one of the filters to see more opportunities.</p>
            <Link href='/careers' className='mt-5 inline-flex items-center gap-2 text-sm font-bold text-fruition-700 hover:text-fruition-900'>View all vacancies <ArrowRight className='size-4' /></Link>
          </div>
        )}

        {result.meta.last_page > 1 && (
          <nav className='mt-10 flex items-center justify-between border-t border-slate-200 pt-6' aria-label='Vacancy pages'>
            {result.meta.current_page > 1 ? (
              <Link href={careersHref(query, result.meta.current_page - 1)} className='rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:border-fruition-300 hover:text-fruition-700'>Previous</Link>
            ) : <span />}
            <p className='text-sm text-slate-500'>Page {result.meta.current_page} of {result.meta.last_page}</p>
            {result.meta.current_page < result.meta.last_page ? (
              <Link href={careersHref(query, result.meta.current_page + 1)} className='rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:border-fruition-300 hover:text-fruition-700'>Next</Link>
            ) : <span />}
          </nav>
        )}
      </section>
    </main>
  );
}
