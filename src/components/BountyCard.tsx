'use client';

import React, { useState } from 'react';
import { Gift, X, ChevronDown } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/lib/events';

interface BountyCardProps {
  questionId: string;
  isAuthor: boolean;
}

export function BountyCard({ questionId, isAuthor }: BountyCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showOfferForm, setShowOfferForm] = useState(false);
  const queryClient = useQueryClient();

  const { data: bounties = [], isLoading } = useQuery({
    queryKey: ['bounties', questionId],
    queryFn: async () => {
      const res = await fetch(`/api/v1/questions/${questionId}/bounties`);
      if (!res.ok) throw new Error('Failed to fetch bounties');
      return res.json();
    },
  });

  const activeBounties = bounties.filter((b: any) => b.status === 'ACTIVE');
  const totalBounty = activeBounties.reduce((sum: number, b: any) => sum + b.reputation_amount, 0);

  if (!isExpanded && bounties.length === 0) {
    return null;
  }

  return (
    <div className="mt-6 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-4">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between hover:bg-amber-100 rounded px-2 py-1 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Gift className="h-5 w-5 text-amber-600" />
          <span className="font-semibold text-gray-900">
            {totalBounty > 0 ? `+${totalBounty} reputation bounty` : 'No bounties'}
          </span>
        </div>
        <ChevronDown
          className={`h-4 w-4 text-gray-600 transition-transform ${
            isExpanded ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isExpanded && (
        <div className="mt-3 space-y-3">
          {bounties.length === 0 ? (
            <p className="text-sm text-gray-600">No bounties yet</p>
          ) : (
            bounties.map((bounty: any) => (
              <BountyItem
                key={bounty.id}
                bounty={bounty}
                questionId={questionId}
                isAuthor={isAuthor}
              />
            ))
          )}

          {!isAuthor && !showOfferForm && (
            <button
              onClick={() => setShowOfferForm(true)}
              className="w-full mt-3 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              + Offer Bounty
            </button>
          )}

          {showOfferForm && (
            <OfferBountyForm
              questionId={questionId}
              onSuccess={() => {
                setShowOfferForm(false);
                queryClient.invalidateQueries({ queryKey: ['bounties', questionId] });
              }}
              onCancel={() => setShowOfferForm(false)}
            />
          )}
        </div>
      )}
    </div>
  );
}

interface BountyItemProps {
  bounty: any;
  questionId: string;
  isAuthor: boolean;
}

function BountyItem({ bounty, questionId, isAuthor }: BountyItemProps) {
  const queryClient = useQueryClient();

  const cancelMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/v1/bounties/${bounty.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to cancel bounty');
      return res.json();
    },
    onSuccess: () => {
      toast.success('Bounty cancelled and reputation refunded');
      queryClient.invalidateQueries({ queryKey: ['bounties', questionId] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to cancel bounty');
    },
  });

  const isOwner = true; // This would be checked from user session
  const timeRemaining = bounty.time_remaining || 0;
  const daysRemaining = Math.ceil(timeRemaining / (1000 * 60 * 60 * 24));

  return (
    <div className="bg-white rounded border border-amber-200 p-3 space-y-2">
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-amber-700 text-lg">+{bounty.reputation_amount}</span>
            <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded">
              {bounty.status}
            </span>
          </div>
          <p className="text-xs text-gray-600 mt-1">
            Offered by <span className="font-medium">@{bounty.offered_by.username}</span>
          </p>
        </div>

        {isOwner && bounty.status === 'ACTIVE' && (
          <button
            onClick={() => cancelMutation.mutate()}
            disabled={cancelMutation.isPending}
            className="text-red-600 hover:text-red-700 transition-colors"
            title="Cancel bounty"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {bounty.status === 'ACTIVE' && daysRemaining > 0 && (
        <p className="text-xs text-amber-700">Expires in {daysRemaining} days</p>
      )}

      {bounty.status === 'AWARDED' && (
        <p className="text-xs text-green-700">
          ✓ Awarded to <span className="font-medium">@{bounty.awarded_to?.username}</span>
        </p>
      )}
    </div>
  );
}

interface OfferBountyFormProps {
  questionId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

function OfferBountyForm({ questionId, onSuccess, onCancel }: OfferBountyFormProps) {
  const [reputation, setReputation] = useState(50);
  const [durationDays, setDurationDays] = useState(7);

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/v1/questions/${questionId}/bounties`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reputation_amount: reputation,
          duration_days: durationDays,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error?.message || 'Failed to offer bounty');
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success(`Bounty of +${reputation} reputation offered!`);
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  return (
    <div className="bg-white rounded border border-amber-200 p-4 space-y-3">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Reputation Amount: {reputation}
        </label>
        <input
          type="range"
          min="10"
          max="500"
          step="10"
          value={reputation}
          onChange={(e) => setReputation(parseInt(e.target.value))}
          className="w-full"
        />
        <p className="text-xs text-gray-600 mt-1">Min: 10, Max: 5000</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Duration: {durationDays} days
        </label>
        <select
          value={durationDays}
          onChange={(e) => setDurationDays(parseInt(e.target.value))}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
        >
          {[1, 3, 7, 14, 30].map((days) => (
            <option key={days} value={days}>
              {days} days
            </option>
          ))}
        </select>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending}
          className="flex-1 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
        >
          {mutation.isPending ? 'Offering...' : 'Offer Bounty'}
        </button>
        <button
          onClick={onCancel}
          className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-900 rounded-lg text-sm font-medium transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
