import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';

export interface Notification {
    id: string;
    type: 'ANSWER' | 'MENTION' | 'SYSTEM';
    reference_id: string;
    is_read: boolean;
    created_at: string;
    actor: {
        id: string;
        username: string;
    };
}

export function useNotifications() {
    const { data: session } = useSession();
    const queryClient = useQueryClient();

    const { data, isLoading, error, refetch } = useQuery({
        queryKey: ['notifications'],
        queryFn: async () => {
            const response = await fetch('/api/v1/notifications');
            if (!response.ok) {
                throw new Error('Failed to fetch notifications');
            }
            const result = await response.json();
            return result.data as Notification[];
        },
        enabled: !!session?.user,
        refetchInterval: 30000,
    });

    const markAsReadMutation = useMutation({
        mutationFn: async (notificationIds?: string[]) => {
            const response = await fetch('/api/v1/notifications/read', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ notificationIds }),
            });
            if (!response.ok) throw new Error('Failed to mark as read');
            return response.json();
        },
        onMutate: async (notificationIds) => {
            await queryClient.cancelQueries({ queryKey: ['notifications'] });
            const previousNotifications = queryClient.getQueryData<Notification[]>(['notifications']);

            if (previousNotifications) {
                queryClient.setQueryData(['notifications'], previousNotifications.map(n => {
                    if (!notificationIds || notificationIds.includes(n.id)) {
                        return { ...n, is_read: true };
                    }
                    return n;
                }));
            }

            return { previousNotifications };
        },
        onError: (err, _, context) => {
            if (context?.previousNotifications) {
                queryClient.setQueryData(['notifications'], context.previousNotifications);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        },
    });

    const unreadCount = data?.filter(n => !n.is_read).length ?? 0;

    return {
        notifications: data ?? [],
        unreadCount,
        isLoading,
        error,
        refetch,
        markAsRead: markAsReadMutation.mutate,
        isMarkingRead: markAsReadMutation.isPending,
    };
}
