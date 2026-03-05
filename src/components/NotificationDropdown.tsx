'use client';

import React from 'react';
import Link from 'next/link';
import { useNotifications, Notification } from '@/hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';
import { MessageSquare, AtSign, Settings, Check } from 'lucide-react';

interface NotificationDropdownProps {
    onClose: () => void;
}

export function NotificationDropdown({ onClose }: NotificationDropdownProps) {
    const { notifications, unreadCount, markAsRead, isMarkingRead } = useNotifications();

    const handleMarkAllRead = (e: React.MouseEvent) => {
        e.stopPropagation();
        markAsRead(undefined);
    };

    const handleItemClick = (notification: Notification) => {
        if (!notification.is_read) {
            markAsRead([notification.id]);
        }
        onClose();
    };

    return (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-[100] animate-in fade-in zoom-in-95 duration-200 origin-top-right">
            {/* Header */}
            <div className="p-4 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
                <h3 className="font-bold text-gray-900">Notifications</h3>
                {unreadCount > 0 && (
                    <button
                        onClick={handleMarkAllRead}
                        disabled={isMarkingRead}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-700 disabled:opacity-50 transition-colors flex items-center gap-1"
                    >
                        <Check className="w-3 h-3" />
                        Mark all as read
                    </button>
                )}
            </div>

            {/* List */}
            <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                {notifications.length === 0 ? (
                    <div className="p-12 text-center text-gray-400">
                        <div className="bg-gray-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                            <AtSign className="w-6 h-6 opacity-20" />
                        </div>
                        <p className="text-sm">No notifications yet</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-50">
                        {notifications.map((n) => (
                            <Link
                                key={n.id}
                                href={`/questions/${n.reference_id}`}
                                onClick={() => handleItemClick(n)}
                                className={`
                                    flex items-start gap-3 p-4 transition-colors hover:bg-gray-50
                                    ${!n.is_read ? 'bg-blue-50/30' : ''}
                                `}
                            >
                                <div className={`
                                    p-2 rounded-xl shrink-0
                                    ${n.type === 'ANSWER' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}
                                `}>
                                    {n.type === 'ANSWER' ? <MessageSquare className="w-4 h-4" /> : <AtSign className="w-4 h-4" />}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-gray-900 leading-snug">
                                        <span className="font-bold">{n.actor.username}</span>
                                        {n.type === 'ANSWER' ? ' shared a new response to your question' : ' mentioned you'}
                                    </p>
                                    <p className="text-[11px] text-gray-400 mt-1">
                                        {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                                    </p>
                                </div>

                                {!n.is_read && (
                                    <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 shrink-0" />
                                )}
                            </Link>
                        ))}
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-gray-50 bg-gray-50/30 text-center">
                <button className="text-xs font-bold text-gray-500 hover:text-gray-900 transition-colors">
                    View older activity
                </button>
            </div>
        </div>
    );
}
