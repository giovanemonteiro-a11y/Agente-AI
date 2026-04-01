import { create } from 'zustand';

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message?: string;
  read_at?: string | null;
  data_json?: Record<string, unknown>;
  created_at: string;
}

interface NotificationState {
  notifications: NotificationItem[];
  unreadCount: number;
  sseConnected: boolean;
  addNotification: (notification: NotificationItem) => void;
  setNotifications: (notifications: NotificationItem[]) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  setSseConnected: (connected: boolean) => void;
}

export const useNotificationStore = create<NotificationState>()((set, get) => ({
  notifications: [],
  unreadCount: 0,
  sseConnected: false,

  addNotification: (notification: NotificationItem) => {
    const notifications = [notification, ...get().notifications];
    const unreadCount = notifications.filter((n) => !n.read_at).length;
    set({ notifications, unreadCount });
  },

  setNotifications: (notifications: NotificationItem[]) => {
    const unreadCount = notifications.filter((n) => !n.read_at).length;
    set({ notifications, unreadCount });
  },

  markAsRead: (id: string) => {
    const notifications = get().notifications.map((n) =>
      n.id === id ? { ...n, read_at: new Date().toISOString() } : n
    );
    const unreadCount = notifications.filter((n) => !n.read_at).length;
    set({ notifications, unreadCount });
  },

  markAllAsRead: () => {
    const notifications = get().notifications.map((n) => ({
      ...n,
      read_at: n.read_at ?? new Date().toISOString(),
    }));
    set({ notifications, unreadCount: 0 });
  },

  setSseConnected: (connected: boolean) => {
    set({ sseConnected: connected });
  },
}));
