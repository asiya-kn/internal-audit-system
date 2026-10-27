import { useState, useMemo } from 'react';
import {
  ShieldAlert, Plus, Search, Edit2, Trash2, AlertTriangle,
  TrendingUp, Gauge, ClipboardList, Clock,
} from 'lucide-react';
import {
  RISK_LEVELS, RISK_STATUSES, ACTION_STATUSES,
  type RiskFilters, type RiskSummaryDto, type RiskDetailDto,
  type RiskLevel, type RiskStatus, type ActionStatus,
  type CreateRiskRequest, type RiskActionDto, type CreateRiskActionRequest,
} from '@iams/shared';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useRiskList, useRiskDetail, useRiskDashboard, useCreateRisk, useUpdateRisk, useDeleteRisk, useCreateRiskAction, useDeleteRiskAction } from '../hooks/useRisks';
import { useAuditUniverseList } from '../hooks/useAuditUniverse';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Spinner, PageLoading } from '../components/ui/Spinner';
import { EmptyState } from '../components/ui/EmptyState';
import { ErrorState } from '../components/ui/ErrorState';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { RiskForm } from '../components/ui/RiskForm';
import { ChevronDown } from 'lucide-react';

const levelStyles: Record<RiskLevel, string> = {
  LOW: 'bg-success-50 text-success-700 border-success-200',
  MEDIUM: 'bg-warning-50 text-warning-700 border-warning-200',
  HIGH: 'bg-orange-50 text-orange-700 border-orange-200',
  CRITICAL: 'bg-error-50 text-error-700 border-error-200',
};

const statusStyles: Record<RiskStatus, string> = {
  OPEN: 'bg-neutral-100 text-neutral-700',
  MITIGATING: 'bg-primary-50 text-primary-700',
  MONITORING: 'bg-warning-50 text-warning-700',
  CLOSED: 'bg-success-50 text-success-700',
};

const actionStatusStyles: Record<ActionStatus, string> = {
  OPEN: 'bg-neutral-100 text-neutral-700',
  IN_PROGRESS: 'bg-primary-50 text-primary-700',
  COMPLETED: 'bg-success-50 text-success-700',
  OVERDUE: 'bg-error-50 text-error-700',
  CANCELLED: 'bg-neutral-100 text-neutral-500',
};

export function AuditRiskAssessmentPage() {
  const { hasPermission } = useAuth();
  const { toast } = useToast();

  const canCreate = hasPermission('risk.create');
  const canUpdate = hasPermission('risk.update');
  const canDelete = hasPermission('risk.delete');

  const [filters, setFilters] = useState<RiskFilters>({ page: 1, pageSize: 20, sortBy: 'inherentScore', sortOrder: 'desc' });
  const [searchInput, setSearchInput] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [actionModalRiskId, setActionModalRiskId] = useState<string | null>(null);

  const risksQuery = useRiskList(filters);
  const dashboardQuery = useRiskDashboard();
  const detailQuery = useRiskDetail(detailId);
  const auditEntitiesQuery = useAuditUniverseList({ pageSize: 100 });
  const createMutation = useCreateRisk();
  const updateMutation = useUpdateRisk(editingId ?? '');
  const deleteMutation = useDeleteRisk();
  const createActionMutation = useCreateRiskAction(actionModalRiskId ?? '');
  const deleteActionMutation = useDeleteRiskAction(detailId ?? '');

  const auditEntities = auditEntitiesQuery.data?.items ?? [];

  function applySearch() {
    setFilters((f) => ({ ...f, search: searchInput.trim() || undefined, page: 1 }));
  }

  function handleCreate() {
    setFormMode('create');
    setEditingId(null);
    setFormOpen(true);
  }

  function handleEdit(risk: RiskSummaryDto) {
    setFormMode('edit');
    setEditingId(risk.id);
    setFormOpen(true);
  }

  function handleSubmitRisk(values: CreateRiskRequest) {
    if (formMode === 'create') {
      createMutation.mutate(values, {
        onSuccess: () => { toast('Risk created successfully', 'success'); setFormOpen(false); },
        onError: (e) => toast(e.message, 'error'),
      });
    } else if (editingId) {
      updateMutation.mutate(values, {
        onSuccess: () => { toast('Risk updated successfully', 'success'); setFormOpen(false); },
        onError: (e) => toast(e.message, 'error'),
      });
    }
  }

  function handleDeleteConfirm() {
    if (!deleteId) return;
    deleteMutation.mutate(deleteId, {
      onSuccess: () => { toast('Risk deleted', 'success'); setDeleteId(null); },
      onError: (e) => toast(e.message, 'error'),
    });
  }

  function handleCreateAction(riskId: string, values: CreateRiskActionRequest) {
    createActionMutation.mutate(values, {
      onSuccess: () => { toast('Action added', 'success'); setActionModalRiskId(null); },
      onError: (e) => toast(e.message, 'error'),
    });
  }

  function handleDeleteAction(actionId: string) {
    deleteActionMutation.mutate(actionId, {
      onSuccess: () => toast('Action deleted', 'success'),
      onError: (e) => toast(e.message, 'error'),
    });
  }

  const dashboard = dashboardQuery.data;
  const isFormLoading = formMode === 'create' ? createMutation.isPending : updateMutation.isPending;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Risk Assessment</h1>
          <p className="mt-1 text-sm text-neutral-500">Risk register linked to audit universe entities</p>
        </div>
        {canCreate && (
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4" />
            Add Risk
          </Button>
        )}
      </div>

      {/* Dashboard summary */}
      {dashboard ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <SummaryCard icon={<ShieldAlert className="h-5 w-5" />} label="Total Risks" value={dashboard.totalRisks} tone="neutral" />
          <SummaryCard icon={<AlertTriangle className="h-5 w-5" />} label="Critical / High" value={dashboard.byInherentLevel.CRITICAL + dashboard.byInherentLevel.HIGH} tone="error" />
          <SummaryCard icon={<ClipboardList className="h-5 w-5" />} label="Open Actions" value={dashboard.openActions} tone="primary" />
          <SummaryCard icon={<Clock className="h-5 w-5" />} label="Overdue Actions" value={dashboard.overdueActions} tone="warning" />
        </div>
      ) : dashboardQuery.isLoading ? (
        <div className="flex justify-center py-8"><Spinner /></div>
      ) : null}

      {/* Risk level distribution */}
      {dashboard && dashboard.totalRisks > 0 && (
        <div className="rounded-xl border border-neutral-200 bg-white p-5">
          <h3 className="text-sm font-semibold text-neutral-800">Risk Level Distribution</h3>
          <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2">
            <LevelBar title="Inherent Risk" data={dashboard.byInherentLevel} total={dashboard.totalRisks} />
            <LevelBar title="Residual Risk" data={dashboard.byResidualLevel} total={dashboard.totalRisks} />
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="rounded-xl border border-neutral-200 bg-white p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[200px]">
            <Input
              label="Search"
              name="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') applySearch(); }}
              placeholder="Search risks, categories, entities…"
            />
          </div>
          <FilterSelect label="Inherent Level" value={filters.inherentLevel ?? ''} onChange={(v) => setFilters((f) => ({ ...f, inherentLevel: (v || undefined) as RiskLevel | undefined, page: 1 }))} options={RISK_LEVELS} />
          <FilterSelect label="Residual Level" value={filters.residualLevel ?? ''} onChange={(v) => setFilters((f) => ({ ...f, residualLevel: (v || undefined) as RiskLevel | undefined, page: 1 }))} options={RISK_LEVELS} />
          <FilterSelect label="Status" value={filters.status ?? ''} onChange={(v) => setFilters((f) => ({ ...f, status: (v || undefined) as RiskStatus | undefined, page: 1 }))} options={RISK_STATUSES} />
          <Button variant="secondary" onClick={applySearch}>
            <Search className="h-4 w-4" />
            Search
          </Button>
        </div>
      </div>

      {/* Risk table */}
      {risksQuery.isLoading ? (
        <PageLoading />
      ) : risksQuery.isError ? (
        <ErrorState message="Failed to load risks" onRetry={() => risksQuery.refetch()} />
      ) : risksQuery.data && risksQuery.data.items.length > 0 ? (
        <div className="overflow-x-auto rounded-xl border border-neutral-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50">
                <th className="px-4 py-3 text-left font-semibold text-neutral-700">Risk</th>
                <th className="px-4 py-3 text-left font-semibold text-neutral-700">Audit Entity</th>
                <th className="px-4 py-3 text-left font-semibold text-neutral-700">Inherent</th>
                <th className="px-4 py-3 text-left font-semibold text-neutral-700">Residual</th>
                <th className="px-4 py-3 text-left font-semibold text-neutral-700">Controls</th>
                <th className="px-4 py-3 text-left font-semibold text-neutral-700">Status</th>
                <th className="px-4 py-3 text-left font-semibold text-neutral-700">Actions</th>
                <th className="px-4 py-3 text-right font-semibold text-neutral-700">Operations</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {risksQuery.data.items.map((risk) => (
                <tr key={risk.id} className="cursor-pointer hover:bg-neutral-50" onClick={() => setDetailId(risk.id)}>
                  <td className="px-4 py-3">
                    <div className="font-medium text-neutral-900">{risk.title}</div>
                    {risk.riskCategory && <div className="text-xs text-neutral-500">{risk.riskCategory}</div>}
                  </td>
                  <td className="px-4 py-3 text-neutral-700">
                    <div className="text-xs font-medium">{risk.auditEntityCode}</div>
                    <div className="text-xs text-neutral-500">{risk.auditEntityName}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-neutral-900">{risk.inherentScore}</span>
                      <span className={`badge border ${levelStyles[risk.inherentLevel]}`}>{risk.inherentLevel}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-neutral-900">{risk.residualScore}</span>
                      <span className={`badge border ${levelStyles[risk.residualLevel]}`}>{risk.residualLevel}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <Gauge className="h-3.5 w-3.5 text-neutral-400" />
                      <span className="text-neutral-700">{risk.controlEffectiveness}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`badge ${statusStyles[risk.status]}`}>{risk.status}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-neutral-600">{risk.actionCount} total</span>
                      {risk.overdueActionCount > 0 && (
                        <span className="badge bg-error-50 text-error-700">{risk.overdueActionCount} overdue</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
                      {canUpdate && (
                        <button className="rounded-md p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700" onClick={() => handleEdit(risk)} title="Edit">
                          <Edit2 className="h-4 w-4" />
                        </button>
                      )}
                      {canDelete && (
                        <button className="rounded-md p-1.5 text-neutral-400 hover:bg-error-50 hover:text-error-600" onClick={() => setDeleteId(risk.id)} title="Delete">
                          <Trash2 className="h-4 w-4" />
                        </button>
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
          icon={<ShieldAlert className="h-12 w-12" />}
          title="No risks found"
          description="Add your first risk to start building the risk register."
          action={canCreate ? <Button onClick={handleCreate}><Plus className="h-4 w-4" />Add Risk</Button> : undefined}
        />
      )}

      {/* Pagination */}
      {risksQuery.data && risksQuery.data.total > (filters.pageSize ?? 20) && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-neutral-500">
            Showing {((filters.page ?? 1) - 1) * (filters.pageSize ?? 20) + 1}–{Math.min((filters.page ?? 1) * (filters.pageSize ?? 20), risksQuery.data.total)} of {risksQuery.data.total}
          </p>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" disabled={(filters.page ?? 1) <= 1} onClick={() => setFilters((f) => ({ ...f, page: (f.page ?? 1) - 1 }))}>Previous</Button>
            <Button variant="secondary" size="sm" disabled={(filters.page ?? 1) * (filters.pageSize ?? 20) >= risksQuery.data.total} onClick={() => setFilters((f) => ({ ...f, page: (f.page ?? 1) + 1 }))}>Next</Button>
          </div>
        </div>
      )}

      {/* Risk form modal */}
      <RiskForm
        open={formOpen}
        mode={formMode}
        initialValues={formMode === 'edit' ? detailQuery.data ?? undefined : undefined}
        auditEntities={auditEntities}
        onSubmit={handleSubmitRisk}
        onCancel={() => setFormOpen(false)}
        loading={isFormLoading}
        serverError={formMode === 'create' ? createMutation.error?.message : updateMutation.error?.message}
      />

      {/* Detail drawer */}
      <RiskDetailModal
        open={Boolean(detailId)}
        risk={detailQuery.data ?? null}
        loading={detailQuery.isLoading}
        onClose={() => setDetailId(null)}
        canEdit={canUpdate}
        onEdit={() => { if (detailQuery.data) { handleEdit(detailQuery.data); } }}
        onAddAction={() => setActionModalRiskId(detailId)}
        onDeleteAction={handleDeleteAction}
      />

      {/* Delete confirm */}
      <ConfirmDialog
        open={Boolean(deleteId)}
        title="Delete Risk"
        message="Are you sure you want to delete this risk? This will also remove all associated mitigation actions."
        confirmLabel="Delete"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteId(null)}
      />

      {/* Action form modal */}
      <ActionFormModal
        open={Boolean(actionModalRiskId)}
        loading={createActionMutation.isPending}
        serverError={createActionMutation.error?.message}
        onSubmit={(values) => actionModalRiskId && handleCreateAction(actionModalRiskId, values)}
        onCancel={() => setActionModalRiskId(null)}
      />
    </div>
  );
}

// ---- Helper components ----

function SummaryCard({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: number; tone: 'neutral' | 'error' | 'primary' | 'warning' }) {
  const toneClasses = {
    neutral: 'bg-neutral-50 text-neutral-700',
    error: 'bg-error-50 text-error-700',
    primary: 'bg-primary-50 text-primary-700',
    warning: 'bg-warning-50 text-warning-700',
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

function LevelBar({ title, data, total }: { title: string; data: Record<RiskLevel, number>; total: number }) {
  const levels: RiskLevel[] = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
  return (
    <div>
      <h4 className="text-xs font-medium text-neutral-500">{title}</h4>
      <div className="mt-2 space-y-2">
        {levels.map((level) => {
          const count = data[level] ?? 0;
          const pct = total > 0 ? (count / total) * 100 : 0;
          return (
            <div key={level} className="flex items-center gap-2">
              <span className="w-16 text-xs font-medium text-neutral-600">{level}</span>
              <div className="flex-1 h-5 rounded bg-neutral-100 overflow-hidden">
                <div className={`h-full ${levelStyles[level].split(' ')[0]}`} style={{ width: `${pct}%` }} />
              </div>
              <span className="w-8 text-right text-xs font-semibold text-neutral-700">{count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function FilterSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: readonly string[] }) {
  return (
    <div>
      <label className="label">{label}</label>
      <div className="relative">
        <select className="input appearance-none pr-9" value={value} onChange={(e) => onChange(e.target.value)}>
          <option value="">All</option>
          {options.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
      </div>
    </div>
  );
}

function RiskDetailModal({
  open, risk, loading, onClose, onEdit, canEdit, onAddAction, onDeleteAction,
}: {
  open: boolean;
  risk: RiskDetailDto | null;
  loading: boolean;
  onClose: () => void;
  onEdit: () => void;
  canEdit: boolean;
  onAddAction: () => void;
  onDeleteAction: (actionId: string) => void;
}) {
  return (
    <Modal open={open} onClose={onClose} title="Risk Details" size="lg">
      {loading ? (
        <div className="flex items-center justify-center py-12"><Spinner /></div>
      ) : risk ? (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`badge border ${levelStyles[risk.inherentLevel]}`}>Inherent: {risk.inherentLevel}</span>
            <span className={`badge border ${levelStyles[risk.residualLevel]}`}>Residual: {risk.residualLevel}</span>
            <span className={`badge ${statusStyles[risk.status]}`}>{risk.status}</span>
            {risk.overdueActionCount > 0 && <span className="badge bg-error-50 text-error-700">{risk.overdueActionCount} overdue</span>}
          </div>

          <div>
            <h3 className="text-lg font-semibold text-neutral-900">{risk.title}</h3>
            <p className="mt-1 text-sm text-neutral-500">{risk.auditEntityCode} — {risk.auditEntityName}</p>
            {risk.description && <p className="mt-2 text-sm text-neutral-700">{risk.description}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <DetailMetric label="Inherent Score" value={String(risk.inherentScore)} sub={`L:${risk.inherentLikelihood} × I:${risk.inherentImpact}`} />
            <DetailMetric label="Residual Score" value={String(risk.residualScore)} sub={`Control: ${risk.controlEffectiveness}%`} />
            <DetailMetric label="Owner" value={risk.ownerName ?? '—'} />
            <DetailMetric label="Category" value={risk.riskCategory ?? '—'} />
          </div>

          {risk.existingControls && (
            <div>
              <h4 className="text-sm font-semibold text-neutral-700">Existing Controls</h4>
              <p className="mt-1 text-sm text-neutral-600">{risk.existingControls}</p>
            </div>
          )}

          {risk.notes && (
            <div>
              <h4 className="text-sm font-semibold text-neutral-700">Notes</h4>
              <p className="mt-1 text-sm text-neutral-600">{risk.notes}</p>
            </div>
          )}

          {/* Mitigation actions */}
          <div>
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-neutral-700">Mitigation Actions ({risk.actions.length})</h4>
              {canEdit && (
                <Button size="sm" variant="secondary" onClick={onAddAction}>
                  <Plus className="h-3.5 w-3.5" />
                  Add Action
                </Button>
              )}
            </div>
            {risk.actions.length > 0 ? (
              <div className="mt-2 space-y-2">
                {risk.actions.map((action) => (
                  <ActionRow key={action.id} action={action} canEdit={canEdit} onDelete={() => onDeleteAction(action.id)} />
                ))}
              </div>
            ) : (
              <p className="mt-2 text-sm text-neutral-400">No mitigation actions yet.</p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={onClose}>Close</Button>
            {canEdit && <Button onClick={onEdit}><Edit2 className="h-4 w-4" />Edit</Button>}
          </div>
        </div>
      ) : (
        <div className="py-12 text-center text-sm text-neutral-500">Risk details could not be loaded.</div>
      )}
    </Modal>
  );
}

function DetailMetric({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3">
      <div className="text-xs text-neutral-500">{label}</div>
      <div className="mt-0.5 text-sm font-semibold text-neutral-900">{value}</div>
      {sub && <div className="text-xs text-neutral-400">{sub}</div>}
    </div>
  );
}

function ActionRow({ action, canEdit, onDelete }: { action: RiskActionDto; canEdit: boolean; onDelete: () => void }) {
  const isOverdue = action.dueDate && action.status !== 'COMPLETED' && action.status !== 'CANCELLED' && new Date(action.dueDate) < new Date();
  return (
    <div className="flex items-center justify-between rounded-lg border border-neutral-200 bg-white p-3">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-neutral-900">{action.title}</span>
          <span className={`badge ${actionStatusStyles[action.status]}`}>{action.status.replace('_', ' ')}</span>
          {isOverdue && <span className="badge bg-error-50 text-error-700">OVERDUE</span>}
        </div>
        <div className="mt-1 flex items-center gap-3 text-xs text-neutral-500">
          {action.assigneeName && <span>Assignee: {action.assigneeName}</span>}
          {action.dueDate && <span>Due: {new Date(action.dueDate).toLocaleDateString()}</span>}
        </div>
        {action.description && <p className="mt-1 text-xs text-neutral-600">{action.description}</p>}
      </div>
      {canEdit && (
        <button className="ml-2 rounded-md p-1.5 text-neutral-400 hover:bg-error-50 hover:text-error-600" onClick={onDelete} title="Delete action">
          <Trash2 className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

function ActionFormModal({
  open, loading, serverError, onSubmit, onCancel,
}: {
  open: boolean;
  loading: boolean;
  serverError?: string;
  onSubmit: (values: CreateRiskActionRequest) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [status, setStatus] = useState<ActionStatus>('OPEN');

  // Reset on open
  const [lastOpen, setLastOpen] = useState(open);
  if (open !== lastOpen) {
    setLastOpen(open);
    if (open) { setTitle(''); setDescription(''); setDueDate(''); setStatus('OPEN'); }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    onSubmit({
      title: title.trim(),
      description: description.trim() || undefined,
      dueDate: dueDate ? new Date(dueDate).toISOString() : null,
      status,
    });
  }

  return (
    <Modal open={open} onClose={onCancel} title="Add Mitigation Action" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Action Title" name="actionTitle" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Implement segregation of duties" required />
        <div>
          <label htmlFor="action-desc" className="label">Description</label>
          <textarea id="action-desc" className="input min-h-[60px]" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={2000} />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="Due Date" name="dueDate" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          <div>
            <label htmlFor="action-status" className="label">Status</label>
            <div className="relative">
              <select id="action-status" className="input appearance-none pr-9" value={status} onChange={(e) => setStatus(e.target.value as ActionStatus)}>
                {ACTION_STATUSES.filter((s) => s !== 'CANCELLED').map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            </div>
          </div>
        </div>
        {serverError && <div className="rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700">{serverError}</div>}
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" type="button" onClick={onCancel}>Cancel</Button>
          <Button type="submit" loading={loading}>Add Action</Button>
        </div>
      </form>
    </Modal>
  );
}
