type RealtimeCallback = (data: any) => void;

class RealtimeEventEmitter {
  private listeners: Set<RealtimeCallback> = new Set();
  private bc: BroadcastChannel | null = null;

  constructor() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.bc = new BroadcastChannel('eventcontrol_realtime_sync');
        this.bc.onmessage = (event) => {
          this.listeners.forEach((fn) => fn(event.data));
        };
      } catch (e) {}
    }
  }

  subscribe(callback: RealtimeCallback) {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  notify(data?: any) {
    this.listeners.forEach((fn) => fn(data));
    if (this.bc) {
      try {
        this.bc.postMessage(data || { timestamp: Date.now() });
      } catch (e) {}
    }
  }
}

export const checkInRealtimeChannel = new RealtimeEventEmitter();
