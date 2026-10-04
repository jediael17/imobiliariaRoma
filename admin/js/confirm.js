/* Modal de confirmação para ações administrativas. */
function confirmModal(message, confirmLabel = 'Confirmar') {
  return new Promise(resolve => {
    const overlay = document.createElement('div');
    overlay.className = 'ov confirm-ov';
    overlay.innerHTML = '<div class="dlg" role="dialog" aria-modal="true" aria-labelledby="confirmTitle" aria-describedby="confirmMessage"><h3 id="confirmTitle">Confirme a ação</h3><p class="sub" id="confirmMessage"></p><div class="acts"><button type="button" class="btn primary" data-confirm="yes"></button><button type="button" class="btn" data-confirm="no">Cancelar</button></div></div>';
    overlay.querySelector('#confirmMessage').textContent = message;
    overlay.querySelector('[data-confirm="yes"]').textContent = confirmLabel;
    let settled = false;
    const close = value => {
      if (settled) return;
      settled = true;
      document.removeEventListener('keydown', onKeydown);
      overlay.remove();
      resolve(value);
    };
    const onKeydown = event => {
      if (event.key === 'Escape') close(false);
    };
    overlay.addEventListener('click', event => {
      if (event.target === overlay) return close(false);
      const button = event.target.closest('[data-confirm]');
      if (button) close(button.dataset.confirm === 'yes');
    });
    document.addEventListener('keydown', onKeydown);
    document.body.appendChild(overlay);
    overlay.querySelector('[data-confirm="yes"]').focus();
  });
}
