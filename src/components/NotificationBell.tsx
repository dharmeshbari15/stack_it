'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useNotifications } from '@/hooks/useNotifications';
import { Bell } from 'lucide-react';
import { NotificationDropdown } from './NotificationDropdown';

export function NotificationBell() {
    const { unreadCount } = useNotifications();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                id="navbar-notifications"
                aria-label="View notifications"
                onClick={() => setIsOpen(!isOpen)}
                className={`
                    relative rounded-full p-2 transition-all active:scale-95 group
                    ${isOpen ? 'bg-gray-100 text-gray-900 border-gray-200' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'}
                `}
            >
                <Bell className={`h-6 w-6 stroke-[1.5] transition-transform ${isOpen ? 'scale-110' : 'group-hover:scale-110'}`} />

                {unreadCount > 0 && (
                    <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white animate-in zoom-in duration-300">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}

                {unreadCount > 0 && !isOpen && (
                    <span className="absolute right-1 top-1 h-4 w-4 rounded-full bg-red-500 opacity-40 animate-ping pointer-events-none" />
                )}
            </button>

            {isOpen && (
                <NotificationDropdown onClose={() => setIsOpen(false)} />
            )}
        </div>
    );
}
