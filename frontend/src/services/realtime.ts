// BusWise AI - Supabase Realtime Synchronization Service
// Synchronizes fleet status, forecasts, optimization runs, and transfer approvals in real-time.

export interface RealtimeStatus {
  isConnected: boolean;
  channelName: string;
  lastSyncedAt: string;
  eventCount: number;
}

type RealtimeCallback = (payload: any) => void;

class RealtimeManager {
  private listeners: Map<string, Set<RealtimeCallback>> = new Map();
  private isConnected = false;
  private eventCount = 0;

  constructor() {
    this.initMockRealtimeSocket();
  }

  private initMockRealtimeSocket() {
    // Simulates websocket heartbeat and live synchronization
    this.isConnected = true;
    setInterval(() => {
      this.eventCount += 1;
      this.notifyListeners('heartbeat', { timestamp: new Date().toISOString(), events: this.eventCount });
    }, 15000);
  }

  public subscribe(event: string, callback: RealtimeCallback): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    // Return cleanup function to prevent memory leaks and duplicate subscriptions
    return () => {
      const set = this.listeners.get(event);
      if (set) {
        set.delete(callback);
      }
    };
  }

  public notifyListeners(event: string, payload: any) {
    const set = this.listeners.get(event);
    if (set) {
      set.forEach((cb) => cb(payload));
    }
  }

  public getStatus(): RealtimeStatus {
    return {
      isConnected: this.isConnected,
      channelName: 'buswise_realtime_hub',
      lastSyncedAt: new Date().toLocaleTimeString(),
      eventCount: this.eventCount,
    };
  }
}

export const realtimeService = new RealtimeManager();
