type RealtimeCallback = (data: any) => void;

class RealtimeEventEmitter {
  private listeners: Set<RealtimeCallback> = new Set();

  subscribe(callback: RealtimeCallback) {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  notify(data?: any) {
    this.listeners.forEach((fn) => fn(data));
  }
}

export const checkInRealtimeChannel = new RealtimeEventEmitter();
