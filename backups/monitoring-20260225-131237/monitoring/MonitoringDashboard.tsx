import React, { useState, useEffect } from 'react';
import { metricsCollector } from './MetricsCollector';

const MonitoringDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState(metricsCollector.getMetrics());
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const unsubscribe = metricsCollector.subscribe(setMetrics);
    return unsubscribe;
  }, []);

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          zIndex: 9999,
          background: '#64FFDA',
          color: '#0A192F',
          border: 'none',
          borderRadius: '8px',
          padding: '8px 16px',
          fontWeight: 'bold',
          cursor: 'pointer'
        }}
      >
        Show Monitoring
      </button>
    );
  }

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      zIndex: 9999,
      background: '#112240',
      border: '1px solid #64FFDA',
      borderRadius: '8px',
      padding: '20px',
      color: '#E6F1FF',
      fontFamily: 'monospace',
      fontSize: '12px',
      maxWidth: '400px',
      maxHeight: '80vh',
      overflowY: 'auto',
      boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
        <h3 style={{ color: '#64FFDA', margin: 0 }}>System Metrics</h3>
        <button
          onClick={() => setIsVisible(false)}
          style={{
            background: 'none',
            border: 'none',
            color: '#64FFDA',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          ✕
        </button>
      </div>

      <div style={{ marginBottom: '15px' }}>
        <h4 style={{ color: '#8892B0', marginBottom: '5px' }}>Active Sessions</h4>
        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#64FFDA' }}>
          {metrics.activeSessions}
        </div>
      </div>

      <div style={{ marginBottom: '15px' }}>
        <h4 style={{ color: '#8892B0', marginBottom: '5px' }}>Total Sessions</h4>
        <div style={{ fontSize: '18px' }}>{metrics.totalSessions}</div>
      </div>

      <div style={{ marginBottom: '15px' }}>
        <h4 style={{ color: '#8892B0', marginBottom: '5px' }}>Messages</h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <div>
            <div style={{ color: '#8892B0', fontSize: '11px' }}>Sent</div>
            <div style={{ fontSize: '16px' }}>{metrics.messagesSent}</div>
          </div>
          <div>
            <div style={{ color: '#8892B0', fontSize: '11px' }}>Received</div>
            <div style={{ fontSize: '16px' }}>{metrics.messagesReceived}</div>
          </div>
        </div>
      </div>

      <div style={{ marginBottom: '15px' }}>
        <h4 style={{ color: '#8892B0', marginBottom: '5px' }}>Average Latency</h4>
        <div style={{ fontSize: '18px' }}>{metricsCollector.getAverageLatency()}ms</div>
      </div>

      <div style={{ marginBottom: '15px' }}>
        <h4 style={{ color: '#8892B0', marginBottom: '5px' }}>Avg Connection Time</h4>
        <div style={{ fontSize: '18px' }}>{metricsCollector.getAverageConnectionTime()}ms</div>
      </div>

      {metrics.errors.length > 0 && (
        <div>
          <h4 style={{ color: '#F87171', marginBottom: '5px' }}>Recent Errors</h4>
          <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
            {metrics.errors.slice(-5).map((error, i) => (
              <div key={i} style={{
                padding: '5px',
                marginBottom: '5px',
                background: 'rgba(248, 113, 113, 0.1)',
                borderLeft: '2px solid #F87171',
                fontSize: '11px'
              }}>
                <div>{error.type}</div>
                <div style={{ color: '#8892B0' }}>{error.message}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MonitoringDashboard;
