import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, ApiError } from '../lib/api';
import type {
  EngagementFilters,
  EngagementDetailDto,
  EngagementDashboardDto,
  CreateEngagementRequest,
  UpdateEngagementRequest,
  EngagementStatus,
  AddTeamMemberRequest,
  UpdateTeamMemberRequest,
} from '@iams/shared';

const LIST_KEY = ['engagements', 'list'] as const;
const DASH_KEY = ['engagements', 'dashboard'] as const;

export function useEngagementList(filters: EngagementFilters) {
  return useQuery({
    queryKey: [...LIST_KEY, filters],
    queryFn: () => api.listEngagements(filters),
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  });
}

export function useEngagementDetail(id: string | null) {
  return useQuery({
    queryKey: ['engagements', 'detail', id],
    queryFn: () => api.getEngagement(id!),
    enabled: Boolean(id),
  });
}

export function useEngagementDashboard() {
  return useQuery({
    queryKey: DASH_KEY,
    queryFn: () => api.getEngagementDashboard(),
    staleTime: 60_000,
  });
}

function useInvalidateEngagements() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: LIST_KEY });
    queryClient.invalidateQueries({ queryKey: DASH_KEY });
    queryClient.invalidateQueries({ queryKey: ['engagements', 'detail'] });
  };
}

export function useCreateEngagement() {
  const invalidate = useInvalidateEngagements();
  return useMutation<EngagementDetailDto, ApiError, CreateEngagementRequest>({
    mutationFn: (data) => api.createEngagement(data),
    onSuccess: invalidate,
  });
}

export function useUpdateEngagement(id: string) {
  const invalidate = useInvalidateEngagements();
  return useMutation<EngagementDetailDto, ApiError, UpdateEngagementRequest>({
    mutationFn: (data) => api.updateEngagement(id, data),
    onSuccess: invalidate,
  });
}

export function useTransitionEngagement() {
  const invalidate = useInvalidateEngagements();
  return useMutation<EngagementDetailDto, ApiError, { id: string; status: EngagementStatus; closureNotes?: string }>({
    mutationFn: ({ id, status, closureNotes }) => api.transitionEngagement(id, status, closureNotes),
    onSuccess: invalidate,
  });
}

export function useDeleteEngagement() {
  const invalidate = useInvalidateEngagements();
  return useMutation<{ message: string }, ApiError, string>({
    mutationFn: (id) => api.deleteEngagement(id),
    onSuccess: invalidate,
  });
}

export function useAddTeamMember(engagementId: string) {
  const invalidate = useInvalidateEngagements();
  return useMutation({
    mutationFn: (data: AddTeamMemberRequest) => api.addEngagementTeamMember(engagementId, data),
    onSuccess: invalidate,
  });
}

export function useRemoveTeamMember(engagementId: string) {
  const invalidate = useInvalidateEngagements();
  return useMutation({
    mutationFn: (userId: string) => api.removeEngagementTeamMember(engagementId, userId),
    onSuccess: invalidate,
  });
}
