// Global click tracker
document.addEventListener('click', function(e) {
  console.log('[GLOBAL] Click detected on:', e.target.tagName, e.target.className);
}, true);
