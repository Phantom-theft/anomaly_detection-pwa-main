/**
 * suppressErrors.js
 * MUST BE IMPORTED AT THE ABSOLUTE TOP OF index.js
 */
(function() {
  if (typeof window === 'undefined') return;

  const isResizeObserverError = (err) => {
    const msg = typeof err === 'string' ? err : err?.message || err?.toString() || "";
    return msg.toLowerCase().includes('resizeobserver loop');
  };

  // 1. Engine Proxy (constructor-level)
  const OriginalRO = window.ResizeObserver;
  window.ResizeObserver = new Proxy(OriginalRO, {
    construct(target, args) {
      const callback = args[0];
      const wrappedCallback = (entries, observer) => {
        window.requestAnimationFrame(() => {
          try {
            callback(entries, observer);
          } catch (e) {
            if (!isResizeObserverError(e)) throw e;
          }
        });
      };
      return new target(wrappedCallback);
    }
  });

  // 2. Global Event Interception (Capture Phase)
  const blockError = (e) => {
    const msg = e.message || (e.reason ? e.reason.message : "");
    if (isResizeObserverError(msg)) {
      e.stopImmediatePropagation();
      if (e.preventDefault) e.preventDefault();
      
      // Physically hide the overlay div
      const overlays = document.querySelectorAll('webpack-dev-server-client-overlay, iframe[style*="z-index: 2147483647"]');
      overlays.forEach(n => {
        n.style.display = 'none';
        n.remove();
      });
      return true;
    }
  };

  window.addEventListener('error', blockError, true);
  window.addEventListener('unhandledrejection', blockError, true);

  // 3. console.error suppression
  const originalConsoleError = console.error;
  console.error = (...args) => {
    if (args.length > 0 && isResizeObserverError(args[0])) return;
    originalConsoleError.apply(console, args);
  };

  // 4. CSS Shield
  const style = document.createElement('style');
  style.innerHTML = `
    webpack-dev-server-client-overlay, 
    #webpack-dev-server-client-overlay,
    iframe[style*="z-index: 2147483647"] { 
      display: none !important; 
      visibility: hidden !important;
      opacity: 0 !important;
      pointer-events: none !important;
    }
  `;
  document.head ? document.head.appendChild(style) : setTimeout(() => document.head && document.head.appendChild(style), 0);

  // 5. Polling Cleaner (Last Resort)
  setInterval(() => {
    const nodes = document.querySelectorAll('webpack-dev-server-client-overlay, iframe[style*="z-index: 2147483647"]');
    if (nodes.length > 0) nodes.forEach(n => n.remove());
  }, 100);

  console.log("🚀 ResizeObserver Protective Shield Active");
})();
