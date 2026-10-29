import { useState } from 'react';
import {
  Flag, Plus, Search, Edit2, Trash2, Eye,
  AlertTriangle, CheckCircle2, Clock, FileWarning,
} from 'lucide-react';
import {
  FINDING_STATUSES, FINDING_SEVERITIES, FINDING_CATEGORIES,
  canTransitionFinding,
  type FindingFilters, type FindingSummaryDto, type FindingDetailDto,
  type FindingStatus, type FindingSeverity, type FindingCategory,
} from '@iams/shared';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  useFindingList, useFindingDetail, useFindingDashboard,
  useCreateFinding, useUpdateFinding, useDeleteFinding, useTransitionFinding,
} from '../hooks/useFindings';
import { useAuditUniverseList } from '../hooks/useAuditUniverse';
import { useEngagementList } from '../hooks/useEngagements';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Spinner, PageLoading } from '../components/ui/Spinner';
import { EmptyState } from '../components/ui/EmptyState';
import { ErrorState } from '../components/ui/ErrorState';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { FindingForm } from '../components/ui/FindingForm';
import { ChevronDown } from 'lucide-react';

const statusStyles: Record<FindingStatus, string> = {
  DRAFT: 'bg-neutral-100 text-neutral-700',
  OPEN: 'bg-primary-50 text-primary-700',
  MANAGEMENT_RESPONSE: 'bg-warning-50 text-warning-700',
  ACTION_PLAN: 'bg-warning-100 text-warning-800',
  REMEDIATED: 'bg-success-50 text-success-700',
  VERIFIED: 'bg-success-100 text-success-800',
  CLOSED: 'bg-neutral-100 text-neutral-500',
  CANCELLED: 'bg-neutral-100 text-neutral-400',
};

const statusLabels: Record<FindingStatus, string> = {
  DRAFT: 'Draft', OPEN: 'Open', MANAGEMENT_RESPONSE: 'Mgmt Response',
  ACTION_PLAN: 'Action Plan', REMEDIATED: 'Remediated', VERIFIED: 'Verified',
  CLOSED: 'Closed', CANCELLED: 'Cancelled',
};

const severityStyles: Record<FindingSeverity, string> = {
  LOW: 'bg-neutral-100 text-neutral-600',
  MEDIUM: 'bg-warning-50 text-warning-700',
  HIGH: 'bg-error-50 text-error-700',
  CRITICAL: 'bg-error-100 text-error-800',
};

const severityLabels: Record<FindingSeverity, string> = {
  LOW: 'Low', MEDIUM: 'Medium', HIGH: 'High', CRITICAL: 'Critical',
};

const categoryLabels: Record<FindingCategory, string> = {
  INTERNAL_CONTROL: 'Internal Control',
  COMPLIANCE: 'Compliance',
  OPERATIONAL: 'Operational',
  FINANCIAL: 'Financial',
  IT_GENERAL_CONTROLS: 'IT General Controls',
  DATA_QUALITY: 'Data Quality',
  GOVERNANCE: 'Governance',
  FRAUD: 'Fraud',
  OTHER: 'Other',
};

export function FindingsPage() {
  const { hasPermission } = useAuth();
  const { toast } = useToast();

  const canCreate = hasPermission('findings.create');
  const canUpdate = hasPermission('findings.update');

  const [filters, setFilters] = useState<FindingFilters>({ page: 1, pageSize: 20, sortBy: 'createdAt', sortOrder: 'desc' });
  const [searchInput, setSearchInput] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [transitionState, setTransitionState] = useState<{ id: string; status: FindingStatus } | null>(null);
  const [mgmtResponse, setMgmtResponse] = useState('');
  const [verificationNotes, setVerificationNotes] = useState('');

  const listQuery = useFindingList(filters);
  const dashboardQuery = useFindingDashboard();
  const detailQuery = useFindingDetail(detailId);
  const auditEntitiesQuery = useAuditUniverseList({ pageSize: 100 });
  const engagementsQuery = useEngagementList({ pageSize: 100 });
  const createMutation = useCreateFinding();
  const updateMutation = useUpdateFinding(editingId ?? '');
  const deleteMutation = useDeleteFinding();
  const transitionMutation = useTransitionFinding();

  const auditEntities = auditEntitiesQuery.data?.items ?? [];
  const engagements = engagementsQuery.data?.items ?? [];
  const isFormLoading = formMode === 'create' ? createMutation.isPending : updateMutation.isPending;

  function applySearch() {
    setFilters((f) => ({ ...f, search: searchInput.trim() || undefined, page: 1 }));
  }

  function handleCreate() {
    setFormMode('create');
    setEditingId(null);
    setFormOpen(true);
  }

  function handleEdit(finding: FindingSummaryDto) {
    setFormMode('edit');
    setEditingId(finding.id);
    setDetailId(null);
    setFormOpen(true);
  }

  function handleSubmit(values: Parameters<typeof createMutation.mutate>[0]) {
    if (formMode === 'create') {
      createMutation.mutate(values, {
        onSuccess: () => { toast('Finding created successfully', 'success'); setFormOpen(false); },
        onError: (e) => toast(e.message, 'error'),
      });
    } else if (editingId) {
      updateMutation.mutate(values, {
        onSuccess: () => { toast('Finding updated successfully', 'success'); setFormOpen(false); },
        onError: (e) => toast(e.message, 'error'),
      });
    }
  }

  function handleDeleteConfirm() {
    if (!deleteId) return;
    deleteMutation.mutate(deleteId, {
      onSuccess: () => { toast('Finding deleted', 'success'); setDeleteId(null); },
      onError: (e) => toast(e.message, 'error'),
    });
  }

  function handleTransitionConfirm() {
    if (!transitionState) return;
    const needsResponse = transitionState.status === 'MANAGEMENT_RESPONSE';
    const needsNotes = transitionState.status === 'VERIFIED';
    transitionMutation.mutate(
      {
        id: transitionState.id,
        status: transitionState.status,
        managementResponse: needsResponse ? mgmtResponse.trim() || undefined : undefined,
        verificationNotes: needsNotes ? verificationNotes.trim() || undefined : undefined,
      },
      {
        onSuccess: () => {
          toast(`Status changed to ${statusLabels[transitionState.status]}`, 'success');
          setTransitionState(null);
          setMgmtResponse('');
          setVerificationNotes('');
        },
        onError: (e) => toast(e.message, 'error'),
      },
    );
  }

  const dashboard = dashboardQuery.data;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Audit Findings</h1>
          <p className="mt-1 text-sm text-neutral-500">Register, track, and resolve audit findings through the remediation lifecycle</p>
        </div>
        {canCreate && (
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4" />
            New Finding
          </Button>
        )}
      </div>

      {dashboard ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <SummaryCard icon={<Flag className="h-5 w-5" />} label="Total Findings" value={dashboard.totalFindings} tone="neutral" />
          <SummaryCard icon={<FileWarning className="h-5 w-5" />} label="Open" value={dashboard.openCount} tone="primary" />
          <SummaryCard icon={<AlertTriangle className="h-5 w-5" />} label="Overdue" value={dashboard.overdueCount} tone="error" />
          <SummaryCard icon={<CheckCircle2 className="h-5 w-5" />} label="Closed/Verified" value={dashboard.closedCount + dashboard.verifiedCount} tone="success" />
        </div>
      ) : dashboardQuery.isLoading ? (
        <div className="flex justify-center py-8"><Spinner /></div>
      ) : null}

      {dashboard && dashboard.totalFindings > 0 && (
        <div className="rounded-xl border border-neutral-200 bg-white p-5">
          <h3 className="text-sm font-semibold text-neutral-800">Severity Distribution</h3>
          <div className="mt-4 space-y-2">
            {FINDING_SEVERITIES.filter((s) => dashboard.bySeverity[s] > 0).map((sev) => {
              const count = dashboard.bySeverity[sev];
              const pct = dashboard.totalFindings > 0 ? (count / dashboard.totalFindings) * 100 : 0;
              return (
                <div key={sev} className="flex items-center gap-2">
                  <span className="w-20 text-xs font-medium text-neutral-600">{severityLabels[sev]}</span>
                  <div className="flex-1 h-5 rounded bg-neutral-100 overflow-hidden">
                    <div className={`h-full ${severityStyles[sev].split(' ')[0]}`} style={{ width: `${pct}%` }} />
                  </div>
                  <span className="w-8 text-right text-xs font-semibold text-neutral-700">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="rounded-xl border border-neutral-200 bg-white p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[200px]">
            <Input label="Search" name="search" value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') applySearch(); }}
              placeholder="Search by reference, title, entity…" />
          </div>
          <FilterSelect label="Status" value={filters.status ?? ''}
            onChange={(v) => setFilters((f) => ({ ...f, status: (v || undefined) as FindingStatus | undefined, page: 1 }))}
            options={FINDING_STATUSES} labels={statusLabels} />
          <FilterSelect label="Severity" value={filters.severity ?? ''}
            onChange={(v) => setFilters((f) => ({ ...f, severity: (v || undefined) as FindingSeverity | undefined, page: 1 }))}
            options={FINDING_SEVERITIES} labels={severityLabels} />
          <FilterSelect label="Category" value={filters.category ?? ''}
            onChange={(v) => setFilters((f) => ({ ...f, category: (v || undefined) as FindingCategory | undefined, page: 1 }))}
            options={FINDING_CATEGORIES} labels={categoryLabels} />
          <Button variant="secondary" onClick={applySearch}><Search className="h-4 w-4" />Search</Button>
        </div>
      </div>

      {listQuery.isLoading ? (
        <PageLoading />
      ) : listQuery.isError ? (
        <ErrorState message="Failed to load findings" onRetry={() => listQuery.refetch()} />
      ) : listQuery.data && listQuery.data.items.length > 0 ? (
        <div className="overflow-x-auto rounded-xl border border-neutral-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50">
                <th className="px-4 py-3 text-left font-semibold text-neutral-700">Finding</th>
                <th className="px-4 py-3 text-left font-semibold text-neutral-700">Audit Entity</th>
                <th className="px-4 py-3 text-left font-semibold text-neutral-700">Category</th>
                <th className="px-4 py-3 text-left font-semibold text-neutral-700">Severity</th>
                <th className="px-4 py-3 text-left font-semibold text-neutral-700">Status</th>
                <th className="px-4 py-3 text-left font-semibold text-neutral-700">Owner</th>
                <th className="px-4 py-3 text-left font-semibold text-neutral-700">Due Date</th>
                <th className="px-4 py-3 text-right font-semibold text-neutral-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {listQuery.data.items.map((finding) => (
                <tr key={finding.id} className="cursor-pointer hover:bg-neutral-50" onClick={() => setDetailId(finding.id)}>
                  <td className="px-4 py-3">
                    <div className="font-medium text-neutral-900">{finding.title}</div>
                    <div className="text-xs text-neutral-500">{finding.reference}{finding.engagementReference ? ` · ${finding.engagementReference}` : ''}</div>
                  </td>
                  <td className="px-4 py-3 text-neutral-700">
                    <div className="text-xs font-medium">{finding.auditEntityCode}</div>
                    <div className="text-xs text-neutral-500">{finding.auditEntityName}</div>
                  </td>
                  <td className="px-4 py-3"><span className="text-xs text-neutral-600">{categoryLabels[finding.category]}</span></td>
                  <td className="px-4 py-3"><span className={`badge ${severityStyles[finding.severity]}`}>{severityLabels[finding.severity]}</span></td>
                  <td className="px-4 py-3">
                    <span className={`badge ${statusStyles[finding.status]}`}>{statusLabels[finding.status]}</span>
                    {finding.isOverdue && <span className="badge bg-error-50 text-error-700 ml-1"><AlertTriangle className="h-3 w-3" />Overdue</span>}
                  </td>
                  <td className="px-4 py-3 text-xs text-neutral-700">
                    {finding.responsibleOwnerName ?? <span className="text-neutral-400">—</span>}
                  </td>
                  <td className="px-4 py-3 text-xs text-neutral-600">
                    {finding.targetResolutionDate ? new Date(finding.targetResolutionDate).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
                      <button className="rounded-md p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700" onClick={() => setDetailId(finding.id)} title="View"><Eye className="h-4 w-4" /></button>
                      {canUpdate && (
                        <button className="rounded-md p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700" onClick={() => handleEdit(finding)} title="Edit"><Edit2 className="h-4 w-4" /></button>
                      )}
                      {canUpdate && (finding.status === 'DRAFT' || finding.status === 'CANCELLED') && (
                        <button className="rounded-md p-1.5 text-neutral-400 hover:bg-error-50 hover:text-error-600" onClick={() => setDeleteId(finding.id)} title="Delete"><Trash2 className="h-4 w-4" /></button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          icon={<Flag className="h-12 w-12" />}
          title="No audit findings found"
          description="Create your first audit finding to start tracking issues, management responses, and remediation."
          action={canCreate ? <Button onClick={handleCreate}><Plus className="h-4 w-4" />New Finding</Button> : undefined}
        />
      )}

      {listQuery.data && listQuery.data.total > (filters.pageSize ?? 20) && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-neutral-500">
            Showing {((filters.page ?? 1) - 1) * (filters.pageSize ?? 20) + 1}–{Math.min((filters.page ?? 1) * (filters.pageSize ?? 20), listQuery.data.total)} of {listQuery.data.total}
          </p>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" disabled={(filters.page ?? 1) <= 1} onClick={() => setFilters((f) => ({ ...f, page: (f.page ?? 1) - 1 }))}>Previous</Button>
            <Button variant="secondary" size="sm" disabled={(filters.page ?? 1) * (filters.pageSize ?? 20) >= listQuery.data.total} onClick={() => setFilters((f) => ({ ...f, page: (f.page ?? 1) + 1 }))}>Next</Button>
          </div>
        </div>
      )}

      <FindingForm
        open={formOpen}
        mode={formMode}
        initialValues={formMode === 'edit' ? detailQuery.data ?? undefined : undefined}
        auditEntities={auditEntities}
        engagements={engagements}
        onSubmit={handleSubmit}
        onCancel={() => setFormOpen(false)}
        loading={isFormLoading}
        serverError={formMode === 'create' ? createMutation.error?.message : updateMutation.error?.message}
      />

      <DetailModal
        open={Boolean(detailId)}
        finding={detailQuery.data ?? null}
        loading={detailQuery.isLoading}
        onClose={() => setDetailId(null)}
        canEdit={canUpdate}
        onEdit={() => { if (detailQuery.data) { handleEdit(detailQuery.data); } }}
        onTransition={(status) => {
          setDetailId(null);
          setTransitionState({ id: detailId ?? '', status });
        }}
      />

      <ConfirmDialog
        open={Boolean(deleteId)}
        title="Delete Audit Finding"
        message="Are you sure you want to delete this finding? Only draft or cancelled findings can be deleted."
        confirmLabel="Delete"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteId(null)}
      />

      <TransitionDialog
        open={Boolean(transitionState)}
        targetStatus={transitionState?.status ?? null}
        managementResponse={mgmtResponse}
        setManagementResponse={setMgmtResponse}
        verificationNotes={verificationNotes}
        setVerificationNotes={setVerificationNotes}
        onConfirm={handleTransitionConfirm}
        onCancel={() => { setTransitionState(null); setMgmtResponse(''); setVerificationNotes(''); }}
        loading={transitionMutation.isPending}
      />
    </div>
  );
}

function SummaryCard({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: number | string; tone: 'neutral' | 'error' | 'primary' | 'success' }) {
  const toneClasses = {
    neutral: 'bg-neutral-50 text-neutral-700',
    error: 'bg-error-50 text-error-700',
    primary: 'bg-primary-50 text-primary-700',
    success: 'bg-success-50 text-success-700',
  };
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4">
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${toneClasses[tone]}`}>{icon}</div>
        <div>
          <div className="text-2xl font-bold text-neutral-900">{value}</div>
          <div className="text-xs text-neutral-500">{label}</div>
        </div>
      </div>
    </div>
  );
}

function FilterSelect({ label, value, onChange, options, labels }: { label: string; value: string; onChange: (v: string) => void; options: readonly string[]; labels: Record<string, string> }) {
  return (
    <div>
      <label className="label">{label}</label>
      <div className="relative">
        <select className="input appearance-none pr-9" value={value} onChange={(e) => onChange(e.target.value)}>
          <option value="">All</option>
          {options.map((o) => <option key={o} value={o}>{labels[o] ?? o}</option>)}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
      </div>
    </div>
  );
}

function DetailModal({
  open, finding, loading, onClose, onEdit, onTransition, canEdit,
}: {
  open: boolean;
  finding: FindingDetailDto | null;
  loading: boolean;
  onClose: () => void;
  onEdit: () => void;
  onTransition: (status: FindingStatus) => void;
  canEdit: boolean;
}) {
  return (
    <Modal open={open} onClose={onClose} title="Finding Details" size="lg">
      {loading ? (
        <div className="flex items-center justify-center py-12"><Spinner /></div>
      ) : finding ? (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`badge ${statusStyles[finding.status]}`}>{statusLabels[finding.status]}</span>
            <span className={`badge ${severityStyles[finding.severity]}`}>Severity: {severityLabels[finding.severity]}</span>
            <span className="badge bg-neutral-100 text-neutral-700">{categoryLabels[finding.category]}</span>
            {finding.isOverdue && <span className="badge bg-error-50 text-error-700"><AlertTriangle className="h-3 w-3" />Overdue</span>}
            {finding.verifiedAt && (
              <span className="badge bg-success-50 text-success-700"><CheckCircle2 className="h-3 w-3" />Verified {new Date(finding.verifiedAt).toLocaleDateString()}</span>
            )}
            {finding.closedAt && (
              <span className="badge bg-neutral-100 text-neutral-600"><CheckCircle2 className="h-3 w-3" />Closed {new Date(finding.closedAt).toLocaleDateString()}</span>
            )}
          </div>

          <div>
            <h3 className="text-lg font-semibold text-neutral-900">{finding.title}</h3>
            <p className="mt-1 text-sm text-neutral-500">{finding.reference}</p>
            <p className="mt-1 text-xs text-neutral-400">{finding.auditEntityCode} — {finding.auditEntityName}</p>
            {finding.engagementReference && <p className="mt-1 text-xs text-primary-600">Engagement: {finding.engagementReference}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <DetailMetric label="Responsible Owner" value={finding.responsibleOwnerName ?? '—'} />
            <DetailMetric label="Target Resolution" value={finding.targetResolutionDate ? new Date(finding.targetResolutionDate).toLocaleDateString() : '—'} />
            <DetailMetric label="Created By" value={finding.createdByName ?? '—'} />
            <DetailMetric label="Mgmt Responded" value={finding.managementRespondedAt ? new Date(finding.managementRespondedAt).toLocaleDateString() : '—'} />
          </div>

          <div>
            <h4 className="text-sm font-semibold text-neutral-700">Condition</h4>
            <p className="mt-1 whitespace-pre-wrap text-sm text-neutral-600">{finding.condition}</p>
          </div>

          {finding.criteria && (
            <div>
              <h4 className="text-sm font-semibold text-neutral-700">Criteria</h4>
              <p className="mt-1 whitespace-pre-wrap text-sm text-neutral-600">{finding.criteria}</p>
            </div>
          )}

          {finding.cause && (
            <div>
              <h4 className="text-sm font-semibold text-neutral-700">Cause</h4>
              <p className="mt-1 whitespace-pre-wrap text-sm text-neutral-600">{finding.cause}</p>
            </div>
          )}

          {finding.impact && (
            <div>
              <h4 className="text-sm font-semibold text-neutral-700">Impact</h4>
              <p className="mt-1 whitespace-pre-wrap text-sm text-neutral-600">{finding.impact}</p>
            </div>
          )}

          {finding.recommendations && (
            <div>
              <h4 className="text-sm font-semibold text-neutral-700">Recommendations</h4>
              <p className="mt-1 whitespace-pre-wrap text-sm text-neutral-600">{finding.recommendations}</p>
            </div>
          )}

          {finding.managementResponse && (
            <div className="rounded-lg border border-warning-200 bg-warning-50 p-3">
              <h4 className="text-sm font-semibold text-warning-800">Management Response</h4>
              <p className="mt-1 whitespace-pre-wrap text-sm text-neutral-700">{finding.managementResponse}</p>
              {finding.managementRespondedByName && (
                <p className="mt-2 text-xs text-neutral-500">— {finding.managementRespondedByName}</p>
              )}
            </div>
          )}

          {finding.verificationNotes && (
            <div className="rounded-lg border border-success-200 bg-success-50 p-3">
              <h4 className="text-sm font-semibold text-success-800">Verification Notes</h4>
              <p className="mt-1 whitespace-pre-wrap text-sm text-neutral-700">{finding.verificationNotes}</p>
              {finding.verifiedByName && (
                <p className="mt-2 text-xs text-neutral-500">— {finding.verifiedByName}</p>
              )}
            </div>
          )}

          {canEdit && finding.status !== 'CLOSED' && finding.status !== 'CANCELLED' && (
            <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3">
              <h4 className="text-sm font-semibold text-neutral-700">Workflow Actions</h4>
              <div className="mt-2 flex flex-wrap gap-2">
                {FINDING_STATUSES.filter((s) => canTransitionFinding(finding.status, s)).map((s) => (
                  <Button key={s} size="sm" variant="secondary" onClick={() => onTransition(s)}>
                    {s === 'CLOSED' && <CheckCircle2 className="h-3.5 w-3.5" />}
                    {s === 'VERIFIED' && <CheckCircle2 className="h-3.5 w-3.5" />}
                    {s === 'CANCELLED' && <Trash2 className="h-3.5 w-3.5" />}
                    {s === 'MANAGEMENT_RESPONSE' && <FileWarning className="h-3.5 w-3.5" />}
                    {s === 'ACTION_PLAN' && <Clock className="h-3.5 w-3.5" />}
                    Move to {statusLabels[s]}
                  </Button>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={onClose}>Close</Button>
            {canEdit && finding.status !== 'CLOSED' && finding.status !== 'CANCELLED' && (
              <Button onClick={onEdit}><Edit2 className="h-4 w-4" />Edit</Button>
            )}
          </div>
        </div>
      ) : (
        <div className="py-12 text-center text-sm text-neutral-500">Finding details could not be loaded.</div>
      )}
    </Modal>
  );
}

function DetailMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3">
      <div className="text-xs text-neutral-500">{label}</div>
      <div className="mt-0.5 text-sm font-semibold text-neutral-900">{value}</div>
    </div>
  );
}

function TransitionDialog({
  open, targetStatus, managementResponse, setManagementResponse,
  verificationNotes, setVerificationNotes, onConfirm, onCancel, loading,
}: {
  open: boolean;
  targetStatus: FindingStatus | null;
  managementResponse: string;
  setManagementResponse: (v: string) => void;
  verificationNotes: string;
  setVerificationNotes: (v: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}) {
  const needsResponse = targetStatus === 'MANAGEMENT_RESPONSE';
  const needsNotes = targetStatus === 'VERIFIED';

  return (
    <Modal open={open} onClose={onCancel} title={`Move to ${targetStatus ? statusLabels[targetStatus] : ''}`}>
      <div className="space-y-4">
        {needsResponse && (
          <div>
            <label htmlFor="mgmt-response" className="label">Management Response</label>
            <textarea
              id="mgmt-response"
              className="input min-h-[100px]"
              value={managementResponse}
              onChange={(e) => setManagementResponse(e.target.value)}
              placeholder="Enter management's response to this finding…"
              maxLength={10000}
            />
          </div>
        )}
        {needsNotes && (
          <div>
            <label htmlFor="verification-notes" className="label">Verification Notes</label>
            <textarea
              id="verification-notes"
              className="input min-h-[100px]"
              value={verificationNotes}
              onChange={(e) => setVerificationNotes(e.target.value)}
              placeholder="Enter verification notes…"
              maxLength={10000}
            />
          </div>
        )}
        {!needsResponse && !needsNotes && (
          <p className="text-sm text-neutral-600">Confirm status change to {targetStatus ? statusLabels[targetStatus] : ''}?</p>
        )}
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onCancel}>Cancel</Button>
          <Button onClick={onConfirm} loading={loading}>Confirm</Button>
        </div>
      </div>
    </Modal>
  );
}
