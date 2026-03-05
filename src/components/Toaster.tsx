'use client';

import React, { useEffect, useState } from 'react';
import { eventBus, ToastPayload } from '@/lib/events';
import { CheckCircle2, XCircle, Info, AlertTriangle, X } from 'lucide-react';

export function Toaster() {
    const [toasts, setToasts] = useState<ToastPayload[]>([]);

    useEffect(() => {
        const unsubscribe = eventBus.subscribe((toast) => {
            setToasts((prev) => [...prev, toast]);

            if (toast.duration !== 0) {
                setTimeout(() => {
                    removeToast(toast.id);
                }, toast.duration || 4000);
            }
        });

        return () => unsubscribe();
    }, []);

    const removeToast = (id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    };

    return (
        <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none w-full max-w-sm sm:w-auto">
            {toasts.map((toast) => (
                <div
                    key={toast.id}
                    className={`
                        pointer-events-auto flex items-start gap-3 p-4 rounded-2xl shadow-2xl border
                        animate-in slide-in-from-right-full fade-in duration-300
                        ${toast.type === 'success' ? 'bg-white border-green-100' :
                            toast.type === 'error' ? 'bg-white border-red-100' :
                                toast.type === 'warning' ? 'bg-white border-yellow-100' : 'bg-white border-blue-100'}
                    `}
                >
                    <div className={`mt-0.5 ${toast.type === 'success' ? 'text-green-500' :
                            toast.type === 'error' ? 'text-red-500' :
                                toast.type === 'warning' ? 'text-yellow-500' : 'text-blue-500'
                        }`}>
                        {toast.type === 'success' && <CheckCircle2 className="w-5 h-5" />}
                        {toast.type === 'error' && <XCircle className="w-5 h-5" />}
                        {toast.type === 'warning' && <AlertTriangle className="w-5 h-5" />}
                        {toast.type === 'info' && <Info className="w-5 h-5" />}
                    </div>

                    <div className="flex-1">
                        <p className="text-sm font-bold text-gray-900 leading-tight">
                            {toast.message}
                        </p>
                    </div>

                    <button
                        onClick={() => removeToast(toast.id)}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>

                    {/* Progress Bar (Visual Only) */}
                    <div className="absolute bottom-0 left-0 h-1 bg-gray-50 overflow-hidden rounded-b-2xl w-full">
                        <div
                            className={`h-full opacity-30 ${toast.type === 'success' ? 'bg-green-500' :
                                    toast.type === 'error' ? 'bg-red-500' :
                                        toast.type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
                                }`}
                            style={{
                                animation: `shrink ${toast.duration || 4000}ms linear forwards`
                            }}
                        />
                    </div>
                </div>
            ))}
            <style jsx>{`
                @keyframes shrink {
                    from { width: 100%; }
                    to { width: 0%; }
                }
            `}</style>
        </div>
    );
}
