import { Modal } from './Modal';
import { Button } from './Button';
import { Building as Building2, Tag, Layers, FolderTree, User as UserIcon, FileText, Briefcase, Gauge, StickyNote } from 'lucide-react';
import type { AuditUniverseDetailDto } from '@iams/shared';

interface AuditUniverseDetailDrawerProps {
  open: boolean;
  entity: AuditUniverseDetailDto | null;
  loading?: boolean;
  onClose: () => void;
  onEdit?: () => void;
  canEdit?: boolean;
}

const statusStyles: Record<string, string> = {
  ACTIVE: 'bg-success-50 text-success-700',
  INACTIVE: 'bg-neutral-100 text-neutral-600',
  ARCHIVED: 'bg-warning-50 text-warning-700',
};

function Field({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div className="flex items-start gap-3 py-2">
      <div className="mt-0.5 text-neutral-400">{icon}</div>
      <div className="min-w-0">
        <dt className="text-xs font-medium text-neutral-500">{label}</dt>
        <dd className="mt-0.5 break-words text-sm text-neutral-900">{value || '—'}</dd>
      </div>
    </div>
  );
}

export function AuditUniverseDetailDrawer({
  open,
  entity,
  loading,
  onClose,
  onEdit,
  canEdit,
}: AuditUniverseDetailDrawerProps) {
  return (
    <Modal open={open} onClose={onClose} title="Entity Details" size="lg">
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
        </div>
      ) : entity ? (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`badge ${statusStyles[entity.status] ?? 'bg-neutral-100 text-neutral-600'}`}>
              {entity.status}
            </span>
            <span className="badge bg-primary-50 text-primary-700">{entity.entityType}</span>
            {entity.childCount > 0 && (
              <span className="badge bg-neutral-100 text-neutral-600">
                {entity.childCount} child{entity.childCount === 1 ? '' : 'ren'}
              </span>
            )}
          </div>

          <div>
            <h3 className="text-lg font-semibold text-neutral-900">{entity.name}</h3>
            <p className="text-sm text-neutral-500">{entity.code}</p>
          </div>

          <dl className="divide-y divide-neutral-100">
            <Field icon={<Tag className="h-4 w-4" />} label="Code" value={entity.code} />
            <Field icon={<Building2 className="h-4 w-4" />} label="Name" value={entity.name} />
            <Field icon={<Layers className="h-4 w-4" />} label="Entity Type" value={entity.entityType} />
            <Field
              icon={<FolderTree className="h-4 w-4" />}
              label="Parent Entity"
              value={entity.parentName}
            />
            <Field icon={<Briefcase className="h-4 w-4" />} label="Department" value={entity.department} />
            <Field
              icon={<FileText className="h-4 w-4" />}
              label="Business Process"
              value={entity.businessProcess}
            />
            <Field icon={<Gauge className="h-4 w-4" />} label="Risk Rating" value={entity.riskRating} />
            <Field icon={<UserIcon className="h-4 w-4" />} label="Owner" value={entity.ownerName} />
            <Field
              icon={<StickyNote className="h-4 w-4" />}
              label="Notes"
              value={entity.notes}
            />
          </dl>

          <div className="grid grid-cols-2 gap-4 text-xs text-neutral-500">
            <div>
              <span className="font-medium">Created:</span>{' '}
              {new Date(entity.createdAt).toLocaleString()}
            </div>
            <div>
              <span className="font-medium">Updated:</span>{' '}
              {new Date(entity.updatedAt).toLocaleString()}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={onClose}>
              Close
            </Button>
            {canEdit && onEdit && (
              <Button variant="primary" onClick={onEdit}>
                Edit
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div className="py-12 text-center text-sm text-neutral-500">
          Entity details could not be loaded.
        </div>
      )}
    </Modal>
  );
}
