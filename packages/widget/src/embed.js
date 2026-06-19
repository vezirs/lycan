// Minimal embed snippet for Lycan widget (development)
(function (w, d) {
  const API_BASE = (w.__LYCAN_API_URL__ || 'http://localhost:4000');

  function createIframe(widgetId) {
    const iframe = d.createElement('iframe');
    iframe.src = `${API_BASE}/widget-host?widgetId=${encodeURIComponent(widgetId)}`;
    iframe.style.position = 'fixed';
    iframe.style.right = '20px';
    iframe.style.bottom = '20px';
    iframe.style.width = '360px';
    iframe.style.height = '480px';
    iframe.style.border = 'none';
    iframe.style.zIndex = '999999';
    return iframe;
  }

  function init(widgetId) {
    if (!widgetId) return console.error('Lycan.init requires widgetId');
    // fetch widget settings (optional)
    fetch(`${API_BASE}/api/widgets/${encodeURIComponent(widgetId)}`)
      .then((r) => r.json())
      .then((data) => {
        const iframe = createIframe(widgetId);
        d.body.appendChild(iframe);
        // Listen to messages from iframe
        window.addEventListener('message', (ev) => {
          try {
            const payload = ev.data;
            if (payload && payload.type === 'lycan.widget.event') {
              console.log('Widget event', payload);
              // Here you could forward events to your analytics or take actions
            }
          } catch (e) {
            // ignore
          }
        });
      })
      .catch((err) => {
        console.error('Failed to load widget settings', err);
      });
  }

  // Expose minimal API
  w.Lycan = w.Lycan || {};
  w.Lycan.init = init;
})(window, document);
