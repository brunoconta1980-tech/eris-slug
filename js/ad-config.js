/**
 * ERIS SLUG: PRINCIPIA DISCORDIA
 * Configuração de Monetização Google AdSense
 */
window.GOOGLE_ADSENSE = {
  publisherId: 'ca-pub-1577729186330567',
  slots: {
    homeBanner: '5303658379'
  },
  demoMode: false
};

(function initAdSense() {
  const pub = window.GOOGLE_ADSENSE.publisherId;
  if (pub && pub.startsWith('ca-pub-')) {
    if (!document.querySelector('script[src*="pagead2.googlesyndication.com"]')) {
      const s = document.createElement('script');
      s.async = true;
      s.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' + pub;
      s.crossOrigin = 'anonymous';
      document.head.appendChild(s);
    }
  }
})();
