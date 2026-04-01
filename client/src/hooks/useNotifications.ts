import { useEffect, useRef } from 'react';
import { useNotificationStore } from '@/store/notificationStore';
import { useAuthStore } from '@/store/authStore';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api';

export function useNotifications() {
  const { notifications, unreadCount, sseConnected, addNotification, setSseConnected } =
    useNotificationStore();
  const { token } = useAuthStore();
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!token) return;

    const connect = () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      const url = `${API_URL}/notifications/stream?token=${encodeURIComponent(token)}`;
      const es = new EventSource(url);

      es.onopen = () => {
        setSseConnected(true);
      };

      es.addEventListener('notification', (event: MessageEvent) => {
        try {
          const notification = JSON.parse(event.data as string);
          addNotification(notification);
        } catch {
          // ignore parse errors
        }
      });

      es.onerror = () => {
        setSseConnected(false);
        es.close();
        // Reconnect after 5 seconds
        setTimeout(connect, 5000);
      };

      eventSourceRef.current = es;
    };

    connect();

    return () => {
      eventSourceRef.current?.close();
      setSseConnected(false);
    };
  }, [token, addNotification, setSseConnected]);

  return { notifications, unreadCount, sseConnected };
}
