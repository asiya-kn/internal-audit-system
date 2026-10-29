import { useState, type FormEvent } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { Input } from './Input';
import { ChevronDown } from 'lucide-react';
import {
  FINDING_CATEGORIES,
  FINDING_SEVERITIES,
  type FindingCategory,
  type FindingSeverity,
  type CreateFindingRequest,
  type AuditUniverseSummaryDto,
  type EngagementSummaryDto,
  type FindingDetailDto,
} from '@iams/shared';

interface FindingFormProps {
  open: boolean;
  mode: 'create' | 'edit';
  initialValues?: Partial<FindingDetailDto>;
  auditEntities: AuditUniverseSummaryDto[];
  engagements: EngagementSummaryDto[];
  onSubmit: (values: CreateFindingRequest) => void;
  onCancel: () => void;
  loading?: boolean;
  serverError?: string;
}

interface FormState {
  reference: string;
  title: string;
  engagementId: string;
  auditEntityId: string;
  category: FindingCategory;
  severity: FindingSeverity;
  condition: string;
  criteria: string;
  cause: string;
  impact: string;
  recommendations: string;
  responsibleOwnerId: string;
  targetResolutionDate: string;
}

function buildInitial(values: Partial<FindingDetailDto> | undefined): FormState {
  return {
    reference: values?.reference ?? '',
    title: values?.title ?? '',
    engagementId: values?.engagementId ?? '',
    auditEntityId: values?.auditEntityId ?? '',
    category: (values?.category as FindingCategory) ?? 'OTHER',
    severity: (values?.severity as FindingSeverity) ?? 'MEDIUM',
    condition: values?.condition ?? '',
    criteria: values?.criteria ?? '',
    cause: values?.cause ?? '',
    impact: values?.impact ?? '',
    recommendations: values?.recommendations ?? '',
    responsibleOwnerId: values?.responsibleOwnerId ?? '',
    targetResolutionDate: values?.targetResolutionDate ? values.targetResolutionDate.slice(0, 10) : '',
  };
}

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

const severityLabels: Record<FindingSeverity, string> = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  CRITICAL: 'Critical',
};

export function FindingForm({
  open, mode, initialValues, auditEntities, engagements,
  onSubmit, onCancel, loading, serverError,
}: FindingFormProps) {
  const [state, setState] = useState<FormState>(() => buildInitial(initialValues));

  const [lastOpen, setLastOpen] = useState(open);
  if (open !== lastOpen) {
    setLastOpen(open);
    if (open) setState(buildInitial(initialValues));
  }

  const errors: Partial<Record<keyof FormState, string>> = {};
  if (!state.reference.trim()) errors.reference = 'Reference is required';
  else if (!/^[A-Za-z0-9\-_.]+$/.test(state.reference.trim())) errors.reference = 'Only letters, numbers, dashes, underscores and dots';
  if (!state.title.trim()) errors.title = 'Title is required';
  if (!state.auditEntityId) errors.auditEntityId = 'An audit entity is required';
  if (!state.condition.trim()) errors.condition = 'Condition is required';

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setState((s) => ({ ...s, [key]: value }));
  }

  const filteredEngagements = state.auditEntityId
    ? engagements.filter((e) => e.auditEntityId === state.auditEntityId)
    : engagements;

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const payload: CreateFindingRequest = {
      reference: state.reference.trim(),
      title: state.title.trim(),
      engagementId: state.engagementId || null,
      auditEntityId: state.auditEntityId,
      category: state.category,
      severity: state.severity,
      condition: state.condition.trim(),
      criteria: state.criteria.trim() || undefined,
      cause: state.cause.trim() || undefined,
      impact: state.impact.trim() || undefined,
      recommendations: state.recommendations.trim() || undefined,
      responsibleOwnerId: state.responsibleOwnerId || null,
      targetResolutionDate: state.targetResolutionDate ? new Date(state.targetResolutionDate).toISOString() : null,
    };
    onSubmit(payload);
  }

  return (
    <Modal open={open} onClose={onCancel} title={mode === 'create' ? 'Create Audit Finding' : 'Edit Audit Finding'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Reference"
            name="reference"
            value={state.reference}
            onChange={(e) => update('reference', e.target.value)}
            error={errors.reference}
            placeholder="e.g. FIND-2026-001"
            required
            disabled={mode === 'edit'}
          />
          <div>
            <label htmlFor="finding-category" className="label">Category</label>
            <div className="relative">
              <select
                id="finding-category"
                className="input appearance-none pr-9"
                value={state.category}
                onChange={(e) => update('category', e.target.value as FindingCategory)}
              >
                {FINDING_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{categoryLabels[c]}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            </div>
          </div>
        </div>

        <Input
          label="Title"
          name="title"
          value={state.title}
          onChange={(e) => update('title', e.target.value)}
          error={errors.title}
          placeholder="e.g. Inadequate segregation of duties in accounts payable"
          required
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="finding-auditEntity" className="label">Audit Entity</label>
            <div className="relative">
              <select
                id="finding-auditEntity"
                className={`input appearance-none pr-9 ${errors.auditEntityId ? 'border-error-500' : ''}`}
                value={state.auditEntityId}
                onChange={(e) => update('auditEntityId', e.target.value)}
                required
              >
                <option value="">Select an entity…</option>
                {auditEntities.map((a) => (
                  <option key={a.id} value={a.id}>{a.code} — {a.name}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            </div>
            {errors.auditEntityId && <p className="mt-1 text-xs text-error-600">{errors.auditEntityId}</p>}
          </div>
          <div>
            <label htmlFor="finding-engagement" className="label">Engagement (optional)</label>
            <div className="relative">
              <select
                id="finding-engagement"
                className="input appearance-none pr-9"
                value={state.engagementId}
                onChange={(e) => update('engagementId', e.target.value)}
                disabled={filteredEngagements.length === 0}
              >
                <option value="">{filteredEngagements.length === 0 ? 'No engagements for this entity' : 'None'}</option>
                {filteredEngagements.map((en) => (
                  <option key={en.id} value={en.id}>{en.reference} — {en.title}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            </div>
          </div>
          <div>
            <label htmlFor="finding-severity" className="label">Severity</label>
            <div className="relative">
              <select
                id="finding-severity"
                className="input appearance-none pr-9"
                value={state.severity}
                onChange={(e) => update('severity', e.target.value as FindingSeverity)}
              >
                {FINDING_SEVERITIES.map((s) => (
                  <option key={s} value={s}>{severityLabels[s]}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            </div>
          </div>
        </div>

        <div>
          <label htmlFor="finding-condition" className="label">Condition (What Was Found)</label>
          <textarea
            id="finding-condition"
            className={`input min-h-[80px] ${errors.condition ? 'border-error-500' : ''}`}
            value={state.condition}
            onChange={(e) => update('condition', e.target.value)}
            maxLength={10000}
            required
          />
          {errors.condition && <p className="mt-1 text-xs text-error-600">{errors.condition}</p>}
        </div>

        <div>
          <label htmlFor="finding-criteria" className="label">Criteria (What Should Be)</label>
          <textarea
            id="finding-criteria"
            className="input min-h-[60px]"
            value={state.criteria}
            onChange={(e) => update('criteria', e.target.value)}
            maxLength={10000}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="finding-cause" className="label">Cause (Why It Happened)</label>
            <textarea
              id="finding-cause"
              className="input min-h-[60px]"
              value={state.cause}
              onChange={(e) => update('cause', e.target.value)}
              maxLength={10000}
            />
          </div>
          <div>
            <label htmlFor="finding-impact" className="label">Impact (Effect/Risk)</label>
            <textarea
              id="finding-impact"
              className="input min-h-[60px]"
              value={state.impact}
              onChange={(e) => update('impact', e.target.value)}
              maxLength={10000}
            />
          </div>
        </div>

        <div>
          <label htmlFor="finding-recommendations" className="label">Recommendations</label>
          <textarea
            id="finding-recommendations"
            className="input min-h-[60px]"
            value={state.recommendations}
            onChange={(e) => update('recommendations', e.target.value)}
            maxLength={10000}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Input
            label="Responsible Owner (User UUID)"
            name="responsibleOwnerId"
            value={state.responsibleOwnerId}
            onChange={(e) => update('responsibleOwnerId', e.target.value)}
            placeholder="Leave blank to unassign"
          />
          <Input
            label="Target Resolution Date"
            name="targetResolutionDate"
            type="date"
            value={state.targetResolutionDate}
            onChange={(e) => update('targetResolutionDate', e.target.value)}
          />
        </div>

        {serverError && (
          <div className="rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700">
            {serverError}
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" type="button" onClick={onCancel}>Cancel</Button>
          <Button type="submit" loading={loading}>
            {mode === 'create' ? 'Create Finding' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
