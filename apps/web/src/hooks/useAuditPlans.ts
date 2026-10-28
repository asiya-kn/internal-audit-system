import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, ApiError } from '../lib/api';
import type {
  AuditPlanFilters,
  AuditPlanDetailDto,
  AuditPlanDashboardDto,
  CreateAuditPlanRequest,
  UpdateAuditPlanRequest,
  AuditPlanStatus,
} from '@iams/shared';

const LIST_KEY = ['audit-plans', 'list'] as const;
const DASH_KEY = ['audit-plans', 'dashboard'] as const;

export function useAuditPlanList(filters: AuditPlanFilters) {
  return useQuery({
    queryKey: [...LIST_KEY, filters],
    queryFn: () => api.listAuditPlans(filters),
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  });
}

export function useAuditPlanDetail(id: string | null) {
  return useQuery({
    queryKey: ['audit-plans', 'detail', id],
    queryFn: () => api.getAuditPlan(id!),
    enabled: Boolean(id),
  });
}

export function useAuditPlanDashboard() {
  return useQuery({
    queryKey: DASH_KEY,
    queryFn: () => api.getAuditPlanDashboard(),
    staleTime: 60_000,
  });
}

function useInvalidatePlans() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: LIST_KEY });
    queryClient.invalidateQueries({ queryKey: DASH_KEY });
    queryClient.invalidateQueries({ queryKey: ['audit-plans', 'detail'] });
  };
}

export function useCreateAuditPlan() {
  const invalidate = useInvalidatePlans();
  return useMutation<AuditPlanDetailDto, ApiError, CreateAuditPlanRequest>({
    mutationFn: (data) => api.createAuditPlan(data),
    onSuccess: invalidate,
  });
}

export function useUpdateAuditPlan(id: string) {
  const invalidate = useInvalidatePlans();
  return useMutation<AuditPlanDetailDto, ApiError, UpdateAuditPlanRequest>({
    mutationFn: (data) => api.updateAuditPlan(id, data),
    onSuccess: invalidate,
  });
}

export function useTransitionAuditPlan() {
  const invalidate = useInvalidatePlans();
  return useMutation<AuditPlanDetailDto, ApiError, { id: string; status: AuditPlanStatus }>({
    mutationFn: ({ id, status }) => api.transitionAuditPlan(id, status),
    onSuccess: invalidate,
  });
}

export function useDeleteAuditPlan() {
  const invalidate = useInvalidatePlans();
  return useMutation<{ message: string }, ApiError, string>({
    mutationFn: (id) => api.deleteAuditPlan(id),
    onSuccess: invalidate,
  });
}
