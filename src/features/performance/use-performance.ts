'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { AppraisalAssignment, AppraisalCycle, AppraisalTemplate, Goal, PerformanceCategory, PerformanceKpi, RatingScale } from '@/features/performance/types';
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
