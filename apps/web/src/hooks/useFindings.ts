import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, ApiError } from '../lib/api';
import type {
  FindingFilters,
  FindingDetailDto,
  FindingDashboardDto,
  CreateFindingRequest,
  UpdateFindingRequest,
  FindingStatus,
} from '@iams/shared';

const LIST_KEY = ['findings', 'list'] as const;
const DASH_KEY = ['findings', 'dashboard'] as const;

export function useFindingList(filters: FindingFilters) {
  return useQuery({
    queryKey: [...LIST_KEY, filters],
    queryFn: () => api.listFindings(filters),
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  });
}

export function useFindingDetail(id: string | null) {
  return useQuery({
    queryKey: ['findings', 'detail', id],
    queryFn: () => api.getFinding(id!),
    enabled: Boolean(id),
  });
}

export function useFindingDashboard() {
  return useQuery({
    queryKey: DASH_KEY,
    queryFn: () => api.getFindingDashboard(),
    staleTime: 60_000,
  });
}

function useInvalidateFindings() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: LIST_KEY });
    queryClient.invalidateQueries({ queryKey: DASH_KEY });
    queryClient.invalidateQueries({ queryKey: ['findings', 'detail'] });
  };
}

export function useCreateFinding() {
  const invalidate = useInvalidateFindings();
  return useMutation<FindingDetailDto, ApiError, CreateFindingRequest>({
    mutationFn: (data) => api.createFinding(data),
    onSuccess: invalidate,
  });
}

export function useUpdateFinding(id: string) {
  const invalidate = useInvalidateFindings();
  return useMutation<FindingDetailDto, ApiError, UpdateFindingRequest>({
    mutationFn: (data) => api.updateFinding(id, data),
    onSuccess: invalidate,
  });
}

export function useTransitionFinding() {
  const invalidate = useInvalidateFindings();
  return useMutation<FindingDetailDto, ApiError, { id: string; status: FindingStatus; managementResponse?: string; verificationNotes?: string }>({
    mutationFn: ({ id, status, managementResponse, verificationNotes }) => api.transitionFinding(id, status, managementResponse, verificationNotes),
    onSuccess: invalidate,
  });
}

export function useDeleteFinding() {
  const invalidate = useInvalidateFindings();
  return useMutation<{ message: string }, ApiError, string>({
    mutationFn: (id) => api.deleteFinding(id),
    onSuccess: invalidate,
  });
}
