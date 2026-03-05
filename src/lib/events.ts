type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastPayload {
    id: string;
    message: string;
    type: ToastType;
    duration?: number;
}

type Handler = (payload: ToastPayload) => void;

class EventBus {
    private handlers: Handler[] = [];

    subscribe(handler: Handler) {
        this.handlers.push(handler);
        return () => {
            this.handlers = this.handlers.filter(h => h !== handler);
        };
    }

    emit(payload: ToastPayload) {
        this.handlers.forEach(handler => handler(payload));
    }
}

export const eventBus = new EventBus();

export const showToast = (message: string, type: ToastType = 'info', duration: number = 4000) => {
    eventBus.emit({
        id: Math.random().toString(36).substring(2, 9),
        message,
        type,
        duration
    });
};

export const toast = {
    success: (msg: string, duration?: number) => showToast(msg, 'success', duration),
    error: (msg: string, duration?: number) => showToast(msg, 'error', duration),
    info: (msg: string, duration?: number) => showToast(msg, 'info', duration),
    warning: (msg: string, duration?: number) => showToast(msg, 'warning', duration),
};
