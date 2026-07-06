import { TelemetryEvent } from "../events";

export type EventListener = (event: TelemetryEvent) => void | Promise<void>;

class TelemetryEventBus {
  private listeners: Set<EventListener> = new Set();

  public subscribe(listener: EventListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public publish(event: TelemetryEvent): void {
    // We run listeners synchronously but don't await them if they are promises
    // The bus just broadcasts and moves on.
    this.listeners.forEach((listener) => {
      try {
        const result = listener(event);
        if (result instanceof Promise) {
          result.catch((e) => console.error("Telemetry consumer error (async):", e));
        }
      } catch (e) {
        console.error("Telemetry consumer error (sync):", e);
      }
    });
  }
}

export const eventBus = new TelemetryEventBus();
