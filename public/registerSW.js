if('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Force new service worker registration with cache busting
    navigator.serviceWorker.register('/sw.js?v=' + Date.now(), { scope: '/' })
      .then(registration => {
        // Force update check
        registration.update();
        
        // If there's a new service worker waiting, activate it immediately
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New content is available, skip waiting
              newWorker.postMessage({ type: 'SKIP_WAITING' });
            }
          });
        });
      })
      .catch(err => console.error('SW registration failed:', err));
  });
}