import { EventEmitter } from 'events';

export type SICIEventMap = {
  'meeting:transcribed': { meetingId: string; clientId: string };
  'summary:approved': { summaryId: string; clientId: string; approvedBy: string };
  'briefing:sent': { briefingId: string; clientId: string; type: string };
  'report:uploaded': { reportId: string; clientId: string };
  'notification:push': { userId: string; type: string; title: string; message?: string };
};

class TypedEventBus extends EventEmitter {
  emit<K extends keyof SICIEventMap>(event: K, data: SICIEventMap[K]): boolean {
    return super.emit(event as string, data);
  }

  on<K extends keyof SICIEventMap>(
    event: K,
    listener: (data: SICIEventMap[K]) => void
  ): this {
    return super.on(event as string, listener);
  }

  once<K extends keyof SICIEventMap>(
    event: K,
    listener: (data: SICIEventMap[K]) => void
  ): this {
    return super.once(event as string, listener);
  }

  off<K extends keyof SICIEventMap>(
    event: K,
    listener: (data: SICIEventMap[K]) => void
  ): this {
    return super.off(event as string, listener);
  }
}

export const eventBus = new TypedEventBus();
eventBus.setMaxListeners(50);
