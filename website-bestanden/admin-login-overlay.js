(() => {
  if (new URLSearchParams(location.search).get('login') !== 'overlay' || window.parent === window) return;
  document.documentElement.classList.add('adminLoginOverlay');
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') window.parent.postMessage('admin-login-close', location.origin);
  });
  document.addEventListener('DOMContentLoaded', () => {
    const checkLogin = () => {
      if (document.body.classList.contains('adminMode')) {
        observer.disconnect();
        window.parent.postMessage('admin-login-complete', location.origin);
      }
    };
    const observer = new MutationObserver(checkLogin);
    checkLogin();
    const panel = document.getElementById('loginPanel');
    if (panel) new ResizeObserver(() => {
      window.parent.postMessage({type:'admin-login-size', height:Math.ceil(panel.getBoundingClientRect().height)}, location.origin);
    }).observe(panel);
    observer.observe(document.body, {attributes:true,attributeFilter:['class']});
    document.getElementById('passwordInput')?.focus();
  });
})();
