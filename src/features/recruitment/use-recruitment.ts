'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { RecruitmentApplication, Requisition, Vacancy } from '@/features/recruitment/types';
import { api, ensureCsrf } from '@/lib/api';

interface Collection<T> { data: T[] }
interface Item<T> { data: T }

export const recruitmentKeys = {
  all: ['recruitment'] as const,
  requisitions: ['recruitment', 'requisitions'] as const,
  vacancies: ['recruitment', 'vacancies'] as const,
  applications: ['recruitment', 'applications'] as const,
  application: (id: number | null) => ['recruitment', 'applications', id] as const,
};

export function useRequisitions() {
  return useQuery({
    queryKey: recruitmentKeys.requisitions,
    queryFn: async () => (await api.get<Collection<Requisition>>('/api/v1/recruitment/requisitions', { params: { per_page: 100 } })).data.data,
  });
}

export function useVacancies() {
  return useQuery({
    queryKey: recruitmentKeys.vacancies,
    queryFn: async () => (await api.get<Collection<Vacancy>>('/api/v1/recruitment/vacancies', { params: { per_page: 100 } })).data.data,
  });
}

export function useApplications() {
  return useQuery({
    queryKey: recruitmentKeys.applications,
    queryFn: async () => (await api.get<Collection<RecruitmentApplication>>('/api/v1/recruitment/applications', { params: { per_page: 100 } })).data.data,
  });
}

export function useApplication(id: number | null) {
  return useQuery({
    queryKey: recruitmentKeys.application(id),
    enabled: id !== null,
    queryFn: async () => (await api.get<Item<RecruitmentApplication>>('/api/v1/recruitment/applications/' + id)).data.data,
  });
}

function useAction<TInput>(run: (input: TInput) => Promise<unknown>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: TInput) => {
      await ensureCsrf();
      return run(input);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: recruitmentKeys.all }),
  });
}

export const useCreateRequisition = () => useAction<Record<string, unknown>>((input) => api.post('/api/v1/recruitment/requisitions', input));
export const useSubmitRequisition = () => useAction<number>((id) => api.post('/api/v1/recruitment/requisitions/' + id + '/submit'));
export const useCreateVacancy = () => useAction<Record<string, unknown>>((input) => api.post('/api/v1/recruitment/vacancies', input));
export const useVacancyAction = () => useAction<{ id: number; action: 'open' | 'close' }>(({ id, action }) => api.post('/api/v1/recruitment/vacancies/' + id + '/' + action));
export const useCreateApplication = () => useAction<Record<string, unknown>>((input) => api.post('/api/v1/recruitment/applications', input));
export const useMoveApplication = () => useAction<{ id: number; stage: string; notes?: string }>(({ id, ...input }) => api.post('/api/v1/recruitment/applications/' + id + '/move', input));
export const useScheduleInterview = () => useAction<{ id: number; input: Record<string, unknown> }>(({ id, input }) => api.post('/api/v1/recruitment/applications/' + id + '/interviews', input));
export const useCreateOffer = () => useAction<{ id: number; input: Record<string, unknown> }>(({ id, input }) => api.post('/api/v1/recruitment/applications/' + id + '/offers', input));
export const useOfferAction = () => useAction<{ applicationId: number; offerId: number; action: 'send' | 'accept' | 'decline' }>(({ applicationId, offerId, action }) => api.post('/api/v1/recruitment/applications/' + applicationId + '/offers/' + offerId + '/' + action));
export const useCompleteOnboardingTask = () => useAction<{ applicationId: number; taskId: number }>(({ applicationId, taskId }) => api.post('/api/v1/recruitment/applications/' + applicationId + '/onboarding-tasks/' + taskId + '/complete'));
export const useHireCandidate = () => useAction<number>((id) => api.post('/api/v1/recruitment/applications/' + id + '/hire'));
