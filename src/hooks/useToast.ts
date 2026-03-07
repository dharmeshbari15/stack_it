'use client';

import { useCallback } from 'react';
import { showToast } from '@/lib/events';

type ToastType = 'success' | 'error' | 'info' | 'warning';

export function useToast() {
    const show = useCallback((message: string, type: ToastType = 'info', duration?: number) => {
        showToast(message, type, duration);
    }, []);

    return {
        showToast: show,
    };
}

