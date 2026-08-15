import 'server-only';

export interface PublicVacancy {
  slug: string;
  title: string;
  description: string;
  requirements: string | null;
  location: string | null;
  positions_available: number;
  opens_at: string | null;
  closes_at: string | null;
  published_at: string | null;
  company: { name: string; slug: string };
  employment_type: { name: string } | null;
  position: { title: string } | null;
  department: { name: string } | null;
}

export interface CareerFilterOption {
  value: string;
  label: string;
}

export interface PublicVacancyCollection {
  data: PublicVacancy[];
  links: {
    first: string | null;
    last: string | null;
    prev: string | null;
    next: string | null;
  };
  meta: {
    current_page: number;
    from: number | null;
    last_page: number;
    per_page: number;
    to: number | null;
    total: number;
  };
  filters: {
    companies: CareerFilterOption[];
    locations: CareerFilterOption[];
    employment_types: CareerFilterOption[];
    departments: CareerFilterOption[];
  };
  summary: {
    open_vacancies: number;
    open_positions: number;
    companies: number;
  };
}

export type PublicCareersQuery = {
  search?: string;
  location?: string;
  company?: string;
  employment_type?: string;
  department?: string;
  page?: number;
};

function apiUrl(path: string, query?: PublicCareersQuery): string {
  const base = process.env.API_INTERNAL_URL
    ?? process.env.NEXT_PUBLIC_API_URL
    ?? 'http://localhost:8010';
  const url = new URL(path, base.endsWith('/') ? base : `${base}/`);

  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== '') url.searchParams.set(key, String(value));
  }

  return url.toString();
}

export async function getPublicVacancies(query: PublicCareersQuery): Promise<PublicVacancyCollection> {
  const response = await fetch(apiUrl('/api/v1/careers', { ...query, page: query.page ?? 1 }), {
    cache: 'no-store',
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) {
    throw new Error('The careers catalogue is temporarily unavailable.');
  }

  return response.json() as Promise<PublicVacancyCollection>;
}

export async function getPublicVacancy(slug: string): Promise<PublicVacancy | null> {
  const response = await fetch(apiUrl(`/api/v1/careers/${encodeURIComponent(slug)}`), {
    cache: 'no-store',
    headers: { Accept: 'application/json' },
  });

  if (response.status === 404) return null;
  if (!response.ok) throw new Error('This vacancy is temporarily unavailable.');

  const payload = await response.json() as { data: PublicVacancy };
  return payload.data;
}
