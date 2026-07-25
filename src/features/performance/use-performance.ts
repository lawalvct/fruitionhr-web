'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { AppraisalAssignment, AppraisalCycle, AppraisalTemplate, Goal, PerformanceCategory, PerformanceKpi, PerformanceSummary, Pip, RatingScale } from '@/features/performance/types';
import { api, ensureCsrf } from '@/lib/api';

interface Collection<T> { data: T[] }
interface Item<T> { data: T }
export interface PerformanceEmployee { id: number; full_name: string; user_id: number | null }

export const performanceKeys = {
  all: ['performance'] as const,
  categories: ['performance', 'categories'] as const,
  kpis: ['performance', 'kpis'] as const,
  scales: ['performance', 'scales'] as const,
  templates: ['performance', 'templates'] as const,
  cycles: ['performance', 'cycles'] as const,
  assignments: ['performance', 'assignments'] as const,
  assignment: (id: number | null) => ['performance', 'assignments', id] as const,
  goals: ['performance', 'goals'] as const,
  employees: ['performance', 'employees'] as const,
  pips: ['performance', 'pips'] as const,
  summary: (cycleId: number | null) => ['performance', 'summary', cycleId] as const,
};

const collectionQuery = async <T,>(url: string): Promise<T[]> => (await api.get<Collection<T>>(url)).data.data;

export const usePerformanceCategories = () => useQuery({ queryKey: performanceKeys.categories, queryFn: () => collectionQuery<PerformanceCategory>('/api/v1/performance/categories') });
export const usePerformanceKpis = () => useQuery({ queryKey: performanceKeys.kpis, queryFn: () => collectionQuery<PerformanceKpi>('/api/v1/performance/kpis') });
export const useRatingScales = () => useQuery({ queryKey: performanceKeys.scales, queryFn: () => collectionQuery<RatingScale>('/api/v1/performance/rating-scales') });
export const useAppraisalTemplates = () => useQuery({ queryKey: performanceKeys.templates, queryFn: () => collectionQuery<AppraisalTemplate>('/api/v1/performance/templates') });
export const useAppraisalCycles = () => useQuery({ queryKey: performanceKeys.cycles, queryFn: () => collectionQuery<AppraisalCycle>('/api/v1/performance/cycles') });
export const useAppraisalAssignments = () => useQuery({ queryKey: performanceKeys.assignments, queryFn: () => collectionQuery<AppraisalAssignment>('/api/v1/performance/assignments') });
export const useGoals = () => useQuery({ queryKey: performanceKeys.goals, queryFn: () => collectionQuery<Goal>('/api/v1/goals') });
export const usePerformanceEmployees = () => useQuery({
  queryKey: performanceKeys.employees,
  queryFn: async () => (await api.get<Collection<PerformanceEmployee>>('/api/v1/employees', { params: { per_page: 100 } })).data.data,
});

export function useAppraisalAssignment(id: number | null) {
  return useQuery({
    queryKey: performanceKeys.assignment(id),
    enabled: id !== null,
    queryFn: async () => (await api.get<Item<AppraisalAssignment>>('/api/v1/performance/assignments/' + id)).data.data,
  });
}

function useAction<TInput>(run: (input: TInput) => Promise<unknown>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: TInput) => { await ensureCsrf(); return run(input); },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: performanceKeys.all }),
  });
}

export const useCreateCategory = () => useAction<Record<string, unknown>>((input) => api.post('/api/v1/performance/categories', input));
export const useCreateKpi = () => useAction<Record<string, unknown>>((input) => api.post('/api/v1/performance/kpis', input));
export const useCreateRatingScale = () => useAction<Record<string, unknown>>((input) => api.post('/api/v1/performance/rating-scales', input));
export const useCreateTemplate = () => useAction<Record<string, unknown>>((input) => api.post('/api/v1/performance/templates', input));
export const useCreateCycle = () => useAction<Record<string, unknown>>((input) => api.post('/api/v1/performance/cycles', input));
export const useCycleAction = () => useAction<{ id: number; action: 'open' | 'close' }>(({ id, action }) => api.post('/api/v1/performance/cycles/' + id + '/' + action));
export const useCreateAssignment = () => useAction<Record<string, unknown>>((input) => api.post('/api/v1/performance/assignments', input));
export const useSubmitAppraisalReview = () => useAction<{ assignmentId: number; reviewerId: number; input: Record<string, unknown> }>(({ assignmentId, reviewerId, input }) =>
  api.post('/api/v1/performance/assignments/' + assignmentId + '/reviewers/' + reviewerId + '/submit', input),
);
export const useCreateGoal = () => useAction<Record<string, unknown>>((input) => api.post('/api/v1/goals', input));
export const useGoalCheckin = () => useAction<{ id: number; input: Record<string, unknown> }>(({ id, input }) => api.post('/api/v1/goals/' + id + '/check-ins', input));

/* ── Sample library, KPI editing, template cloning ───────────────────────── */

export const useSeedPerformanceDefaults = () => useAction<void>(() => api.post('/api/v1/performance/seed-defaults'));
export const useUpdateKpi = () => useAction<{ id: number; input: Record<string, unknown> }>(({ id, input }) => api.put('/api/v1/performance/kpis/' + id, input));
export const useCloneTemplate = () => useAction<number>((id) => api.post('/api/v1/performance/templates/' + id + '/clone'));

/* ── Result workflow: calibration → approval → acknowledgment → appeal ───── */

export const useCalibrateResult = () => useAction<{ id: number; score_basis_points: number; justification: string }>(
  ({ id, ...input }) => api.post('/api/v1/performance/results/' + id + '/calibrate', input),
);
export const useFinalizeCalibration = () => useAction<number>((cycleId) => api.post('/api/v1/performance/cycles/' + cycleId + '/calibration/finalize'));
export const useApproveResult = () => useAction<number>((id) => api.post('/api/v1/performance/results/' + id + '/approve'));
export const useRejectResult = () => useAction<{ id: number; reason: string }>(({ id, reason }) => api.post('/api/v1/performance/results/' + id + '/reject', { reason }));
export const useAcknowledgeResult = () => useAction<number>((id) => api.post('/api/v1/performance/results/' + id + '/acknowledge'));
export const useAppealResult = () => useAction<{ id: number; reason: string }>(({ id, reason }) => api.post('/api/v1/performance/results/' + id + '/appeal', { reason }));
export const useResolveAppeal = () => useAction<{ id: number; input: Record<string, unknown> }>(({ id, input }) => api.post('/api/v1/performance/appeals/' + id + '/resolve', input));
export const useReturnReview = () => useAction<{ assignmentId: number; reviewerId: number }>(
  ({ assignmentId, reviewerId }) => api.post('/api/v1/performance/assignments/' + assignmentId + '/reviewers/' + reviewerId + '/return'),
);

/* ── Performance improvement plans ───────────────────────────────────────── */

export const usePips = () => useQuery({ queryKey: performanceKeys.pips, queryFn: () => collectionQuery<Pip>('/api/v1/performance/pips') });
export const useCreatePip = () => useAction<Record<string, unknown>>((input) => api.post('/api/v1/performance/pips', input));
export const useActivatePip = () => useAction<number>((id) => api.post('/api/v1/performance/pips/' + id + '/activate'));
export const useClosePip = () => useAction<{ id: number; outcome: 'successful' | 'unsuccessful'; outcome_note?: string }>(
  ({ id, ...input }) => api.post('/api/v1/performance/pips/' + id + '/close', input),
);
export const useUpdatePipMilestone = () => useAction<{ id: number; status: string; notes?: string }>(
  ({ id, ...input }) => api.put('/api/v1/performance/pip-milestones/' + id, input),
);

/* ── Reports ─────────────────────────────────────────────────────────────── */

export function usePerformanceSummary(cycleId: number | null, enabled = true) {
  return useQuery({
    queryKey: performanceKeys.summary(cycleId),
    enabled,
    queryFn: async () => (await api.get<Item<PerformanceSummary>>('/api/v1/performance/reports/summary', {
      params: cycleId ? { cycle_id: cycleId } : {},
    })).data.data,
  });
}
