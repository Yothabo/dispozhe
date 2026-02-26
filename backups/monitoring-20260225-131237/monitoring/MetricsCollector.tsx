import { useEffect, useRef } from 'react';

interface Metrics {
  sessionCreationTime: number[];
  websocketConnectionTime: number[];
  messageLatency: number[];
  errors: Array<{ type: string; timestamp: number; message: string }>;
  activeSessions: number;
  totalSessions: number;
  messagesSent: number;
  messagesReceived: number;
}

class MetricsCollector {
  private metrics: Metrics = {
    sessionCreationTime: [],
    websocketConnectionTime: [],
    messageLatency: [],
    errors: [],
    activeSessions: 0,
    totalSessions: 0,
    messagesSent: 0,
    messagesReceived: 0
  };

  private listeners: Set<(metrics: Metrics) => void> = new Set();

  trackSessionCreation(duration: number) {
    this.metrics.sessionCreationTime.push(duration);
    this.metrics.totalSessions++;
    this.metrics.activeSessions++;
    this.notify();
  }

  trackWebSocketConnection(duration: number) {
    this.metrics.websocketConnectionTime.push(duration);
    this.notify();
  }

  trackMessageLatency(latency: number) {
    this.metrics.messageLatency.push(latency);
    // Keep only last 100 messages for memory efficiency
    if (this.metrics.messageLatency.length > 100) {
      this.metrics.messageLatency.shift();
    }
    this.notify();
  }

  trackMessageSent() {
    this.metrics.messagesSent++;
    this.notify();
  }

  trackMessageReceived() {
    this.metrics.messagesReceived++;
    this.notify();
  }

  trackError(type: string, message: string) {
    this.metrics.errors.push({
      type,
      timestamp: Date.now(),
      message
    });
    // Keep only last 50 errors
    if (this.metrics.errors.length > 50) {
      this.metrics.errors.shift();
    }
    this.notify();
  }

  sessionEnded() {
    this.metrics.activeSessions--;
    this.notify();
  }

  getAverageLatency(): number {
    if (this.metrics.messageLatency.length === 0) return 0;
    const sum = this.metrics.messageLatency.reduce((a, b) => a + b, 0);
    return Math.round(sum / this.metrics.messageLatency.length);
  }

  getAverageConnectionTime(): number {
    if (this.metrics.websocketConnectionTime.length === 0) return 0;
    const sum = this.metrics.websocketConnectionTime.reduce((a, b) => a + b, 0);
    return Math.round(sum / this.metrics.websocketConnectionTime.length);
  }

  getMetrics(): Metrics {
    return { ...this.metrics };
  }

  subscribe(listener: (metrics: Metrics) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach(listener => listener(this.getMetrics()));
  }
}

export const metricsCollector = new MetricsCollector();
