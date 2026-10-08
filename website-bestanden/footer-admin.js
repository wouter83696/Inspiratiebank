(() => {
  const link = document.getElementById('footerAdminLink');
  link?.addEventListener('click', event => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const width = Math.min(960, window.screen.availWidth);
    const height = Math.min(820, window.screen.availHeight);
    const left = Math.max(0, window.screenX + (window.outerWidth - width) / 2);
    const top = Math.max(0, window.screenY + (window.outerHeight - height) / 2);
    const popup = window.open(link.href, 'inspiratiebank-beheer',
      `popup=yes,width=${width},height=${height},left=${Math.round(left)},top=${Math.round(top)},resizable=yes,scrollbars=yes`);
    // Keep the regular link as fallback when the browser blocks pop-ups.
    if (popup) {
      event.preventDefault();
      popup.focus();
    }
  });
})();
