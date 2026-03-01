// Simple performance monitoring
export const measurePerformance = () => {
  if (typeof window !== 'undefined' && 'performance' in window) {
    const perfData = performance.getEntriesByType('navigation')[0] as any;
    
    if (!perfData) return null;

    const navigationStart = perfData.startTime || 0;
    
    const metrics = {
      dns: perfData.domainLookupEnd - perfData.domainLookupStart || 0,
      tcp: perfData.connectEnd - perfData.connectStart || 0,
      ttfb: perfData.responseStart - perfData.requestStart || 0,
      domLoad: perfData.domContentLoadedEventEnd - navigationStart || 0,
      fullLoad: perfData.loadEventEnd - navigationStart || 0,
    };

    
    if (metrics.fullLoad > 3000) {
      console.warn('Slow page load detected');
    }

    return metrics;
  }
  return null;
};

export const measureResourceTiming = () => {
  if (typeof window === 'undefined' || !('performance' in window)) return;
  
  const resources = performance.getEntriesByType('resource');
  const slowResources = resources
    .filter(r => r.duration > 1000)
    .map(r => ({
      name: r.name.split('/').pop() || r.name,
      duration: Math.round(r.duration),
      size: (r as any).transferSize || 0,
    }));
  
  if (slowResources.length > 0) {
    console.warn('Slow resources:', slowResources);
  }
};
