import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, ApiError } from '../lib/api';
import type {
  AuditUniverseFilters,
  AuditUniverseDetailDto,
  CreateAuditUniverseRequest,
  UpdateAuditUniverseRequest,
  AuditEntityStatus,
} from '@iams/shared';

const LIST_KEY = ['audit-universe', 'list'] as const;

export function useAuditUniverseList(filters: AuditUniverseFilters) {
  return useQuery({
    queryKey: [...LIST_KEY, filters],
    queryFn: () => api.listAuditUniverse(filters),
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  });
}

export function useAuditUniverseDetail(id: string | null) {
  return useQuery({
    queryKey: ['audit-universe', 'detail', id],
    queryFn: () => api.getAuditUniverse(id!),
    enabled: Boolean(id),
  });
}

function useInvalidateAuditUniverse() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: LIST_KEY });
    queryClient.invalidateQueries({ queryKey: ['audit-universe', 'detail'] });
  };
}

export function useCreateAuditUniverse() {
  const invalidate = useInvalidateAuditUniverse();
  return useMutation<AuditUniverseDetailDto, ApiError, CreateAuditUniverseRequest>({
    mutationFn: (data) => api.createAuditUniverse(data),
    onSuccess: invalidate,
  });
}

export function useUpdateAuditUniverse(id: string) {
  const invalidate = useInvalidateAuditUniverse();
  return useMutation<AuditUniverseDetailDto, ApiError, UpdateAuditUniverseRequest>({
    mutationFn: (data) => api.updateAuditUniverse(id, data),
    onSuccess: invalidate,
  });
}

export function useSetAuditUniverseStatus(id: string) {
  const invalidate = useInvalidateAuditUniverse();
  return useMutation<AuditUniverseDetailDto, ApiError, AuditEntityStatus>({
    mutationFn: (status) => api.setAuditUniverseStatus(id, status),
    onSuccess: invalidate,
  });
}

export function useDeleteAuditUniverse() {
  const invalidate = useInvalidateAuditUniverse();
  return useMutation<{ message: string }, ApiError, string>({
    mutationFn: (id) => api.deleteAuditUniverse(id),
    onSuccess: invalidate,
  });
}
