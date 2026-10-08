(() => {
  const link = document.getElementById('footerAdminLink');
  let dialog;
  link?.addEventListener('click', event => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    if (!dialog) {
      dialog = document.createElement('dialog');
      dialog.className = 'footerAdminDialog';
      dialog.setAttribute('aria-label', 'Beheer openen');
      dialog.innerHTML = '<button type="button" class="footerAdminClose" aria-label="Inlogvenster sluiten">×</button><iframe title="Inloggen voor beheer" src="/beheer/?login=overlay"></iframe>';
      document.body.append(dialog);
      dialog.querySelector('button').addEventListener('click', () => dialog.close());
      dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
      dialog.addEventListener('close', () => { document.documentElement.style.overflow = ''; link.focus(); });
      window.addEventListener('message', event => {
        if (event.origin !== location.origin || event.source !== dialog.querySelector('iframe').contentWindow) return;
        if (event.data === 'admin-login-complete') location.assign(link.href);
        if (event.data === 'admin-login-close') dialog.close();
        if (event.data?.type === 'admin-login-size' && Number.isFinite(event.data.height)) {
          dialog.style.height = `min(${Math.max(300, event.data.height + 2)}px, calc(100dvh - 32px))`;
        }
      });
    }
    document.documentElement.style.overflow = 'hidden';
    dialog.showModal();
  });
})();
