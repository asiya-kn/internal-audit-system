import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, ApiError } from '../lib/api';
import type {
  RiskFilters,
  RiskDetailDto,
  RiskDashboardDto,
  RiskActionDto,
  CreateRiskRequest,
  UpdateRiskRequest,
  CreateRiskActionRequest,
  UpdateRiskActionRequest,
} from '@iams/shared';

const LIST_KEY = ['risks', 'list'] as const;
const DASH_KEY = ['risks', 'dashboard'] as const;

export function useRiskList(filters: RiskFilters) {
  return useQuery({
    queryKey: [...LIST_KEY, filters],
    queryFn: () => api.listRisks(filters),
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  });
}

export function useRiskDetail(id: string | null) {
  return useQuery({
    queryKey: ['risks', 'detail', id],
    queryFn: () => api.getRisk(id!),
    enabled: Boolean(id),
  });
}

export function useRiskDashboard() {
  return useQuery({
    queryKey: DASH_KEY,
    queryFn: () => api.getRiskDashboard(),
    staleTime: 60_000,
  });
}

function useInvalidateRisks() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: LIST_KEY });
    queryClient.invalidateQueries({ queryKey: DASH_KEY });
    queryClient.invalidateQueries({ queryKey: ['risks', 'detail'] });
  };
}

export function useCreateRisk() {
  const invalidate = useInvalidateRisks();
  return useMutation<RiskDetailDto, ApiError, CreateRiskRequest>({
    mutationFn: (data) => api.createRisk(data),
    onSuccess: invalidate,
  });
}

export function useUpdateRisk(id: string) {
  const invalidate = useInvalidateRisks();
  return useMutation<RiskDetailDto, ApiError, UpdateRiskRequest>({
    mutationFn: (data) => api.updateRisk(id, data),
    onSuccess: invalidate,
  });
}

export function useDeleteRisk() {
  const invalidate = useInvalidateRisks();
  return useMutation<{ message: string }, ApiError, string>({
    mutationFn: (id) => api.deleteRisk(id),
    onSuccess: invalidate,
  });
}

export function useCreateRiskAction(riskId: string) {
  const invalidate = useInvalidateRisks();
  return useMutation<RiskActionDto, ApiError, CreateRiskActionRequest>({
    mutationFn: (data) => api.createRiskAction(riskId, data),
    onSuccess: invalidate,
  });
}

export function useUpdateRiskAction(riskId: string, actionId: string) {
  const invalidate = useInvalidateRisks();
  return useMutation<RiskActionDto, ApiError, UpdateRiskActionRequest>({
    mutationFn: (data) => api.updateRiskAction(riskId, actionId, data),
    onSuccess: invalidate,
  });
}

export function useDeleteRiskAction(riskId: string) {
  const invalidate = useInvalidateRisks();
  return useMutation<{ message: string }, ApiError, string>({
    mutationFn: (actionId) => api.deleteRiskAction(riskId, actionId),
    onSuccess: invalidate,
  });
}
