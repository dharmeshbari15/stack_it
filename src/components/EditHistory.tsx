'use client';

import React, { useState } from 'react';
import { History, ChevronDown, RotateCcw } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/lib/events';

interface EditHistoryProps {
  type: 'question' | 'answer';
  entityId: string;
  isAuthor: boolean;
}

export function EditHistory({ type, entityId, isAuthor }: EditHistoryProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<number | null>(null);
  const [diffVersion, setDiffVersion] = useState<number | null>(null);
  const queryClient = useQueryClient();

  const { data: versions = [] } = useQuery({
    queryKey: ['versions', type, entityId],
    queryFn: async () => {
      const endpoint =
        type === 'question'
          ? `/api/v1/questions/${entityId}/versions`
          : `/api/v1/answers/${entityId}/versions`;
      const res = await fetch(endpoint);
      if (!res.ok) throw new Error('Failed to fetch versions');
      const result = await res.json();
      return result.versions || [];
    },
  });

  const { data: diffData } = useQuery({
    queryKey: ['diff', type, entityId, selectedVersion, diffVersion],
    queryFn: async () => {
      if (!selectedVersion || !diffVersion) return null;
      const res = await fetch(
        `/api/v1/versions/diff?type=${type}&entity_id=${entityId}&from_version=${Math.min(
          selectedVersion,
          diffVersion
        )}&to_version=${Math.max(selectedVersion, diffVersion)}`
      );
      if (!res.ok) throw new Error('Failed to fetch diff');
      return res.json();
    },
    enabled: !!selectedVersion && !!diffVersion,
  });

  if (versions.length <= 1) {
    return null;
  }

  return (
    <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between hover:bg-gray-100 rounded px-2 py-1 transition-colors"
      >
        <div className="flex items-center gap-2">
          <History className="h-5 w-5 text-gray-600" />
          <span className="font-semibold text-gray-900">Edit History ({versions.length})</span>
        </div>
        <ChevronDown
          className={`h-4 w-4 text-gray-600 transition-transform ${
            isExpanded ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isExpanded && (
        <div className="mt-4 space-y-3">
          {/* Version List */}
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {versions.map((version: any, index: number) => (
              <VersionItem
                key={version.version_number}
                version={version}
                isLatest={index === 0}
                isSelected={selectedVersion === version.version_number}
                isAuthor={isAuthor}
                entityId={entityId}
                type={type}
                onSelect={(v) => setSelectedVersion(v)}
              />
            ))}
          </div>

          {/* Diff View */}
          {selectedVersion && diffVersion && (
            <DiffView
              data={diffData}
              type={type}
              onClose={() => setDiffVersion(null)}
            />
          )}
        </div>
      )}
    </div>
  );
}

interface VersionItemProps {
  version: any;
  isLatest: boolean;
  isSelected: boolean;
  isAuthor: boolean;
  entityId: string;
  type: 'question' | 'answer';
  onSelect: (version: number) => void;
}

function VersionItem({
  version,
  isLatest,
  isSelected,
  isAuthor,
  entityId,
  type,
  onSelect,
}: VersionItemProps) {
  const queryClient = useQueryClient();

  const rollbackMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/v1/versions/rollback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          entity_id: entityId,
          version_number: version.version_number,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error?.message || 'Failed to rollback');
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success(`Rolled back to version ${version.version_number}`);
      queryClient.invalidateQueries({
        queryKey: ['versions', type, entityId],
      });
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const date = new Date(version.edited_at);
  const dateStr = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();

  return (
    <div
      className={`border rounded-lg p-3 transition-colors cursor-pointer ${
        isSelected
          ? 'bg-blue-50 border-blue-300'
          : 'bg-white border-gray-200 hover:bg-gray-50'
      }`}
      onClick={() => onSelect(version.version_number)}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm text-gray-900">v{version.version_number}</span>
            {isLatest && (
              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                Latest
              </span>
            )}
          </div>
          <p className="text-xs text-gray-600 mt-1">@{version.edited_by.username}</p>
          <p className="text-xs text-gray-500 mt-1">{dateStr}</p>
          {version.edit_reason && (
            <p className="text-xs text-gray-700 italic mt-2">"{version.edit_reason}"</p>
          )}
        </div>

        {isAuthor && !isLatest && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              rollbackMutation.mutate();
            }}
            disabled={rollbackMutation.isPending}
            className="text-gray-600 hover:text-blue-600 transition-colors p-1 rounded hover:bg-blue-100"
            title="Rollback to this version"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}

interface DiffViewProps {
  data: any;
  type: 'question' | 'answer';
  onClose: () => void;
}

function DiffView({ data, type, onClose }: DiffViewProps) {
  if (!data) return null;

  return (
    <div className="mt-4 bg-white border border-gray-300 rounded-lg p-4 space-y-4">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-semibold text-gray-900">
          Diff: v{data.from_version} → v{data.to_version}
        </h3>
        <button
          onClick={onClose}
          className="text-gray-600 hover:text-gray-900 transition-colors"
        >
          ✕
        </button>
      </div>

      {type === 'question' && (
        <>
          <DiffSection
            label="Title"
            diff={data.title?.diff}
            summary={data.title?.summary}
          />
          <DiffSection
            label="Description"
            diff={data.description?.diff}
            summary={data.description?.summary}
          />
          {data.tags && (
            <div>
              <h4 className="font-medium text-sm text-gray-900 mb-2">Tags</h4>
              <p className="text-xs text-gray-600">
                From: {data.tags.from.join(', ')} → To: {data.tags.to.join(', ')}
              </p>
            </div>
          )}
        </>
      )}

      {type === 'answer' && (
        <DiffSection label="Body" diff={data.body?.diff} summary={data.body?.summary} />
      )}
    </div>
  );
}

interface DiffSectionProps {
  label: string;
  diff: any[];
  summary: any;
}

function DiffSection({ label, diff, summary }: DiffSectionProps) {
  return (
    <div>
      <h4 className="font-medium text-sm text-gray-900 mb-2">{label}</h4>
      {summary && (
        <p className="text-xs text-gray-600 mb-2">
          +{summary.added} -{summary.removed}
        </p>
      )}
      <div className="bg-gray-50 rounded border border-gray-200 p-2 text-xs font-mono max-h-48 overflow-y-auto">
        {diff?.map((line: any, idx: number) => (
          <div
            key={idx}
            className={`px-2 py-1 whitespace-pre-wrap word-wrap ${
              line.type === 'add'
                ? 'bg-green-50 text-green-900'
                : line.type === 'remove'
                ? 'bg-red-50 text-red-900'
                : 'text-gray-700'
            }`}
          >
            {line.type === 'add' && '+ '}
            {line.type === 'remove' && '- '}
            {line.content}
          </div>
        ))}
      </div>
    </div>
  );
}
