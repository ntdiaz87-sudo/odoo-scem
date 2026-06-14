/** @odoo-module **/

// Filtrar ciudades al cambiar el estado (sin jQuery)
document.addEventListener('change', (e) => {
  if (e.target && e.target.id === 'state_modal_id') {
    const stateId = e.target.value;
    const citySel = document.getElementById('city_modal_id');
    if (!citySel) return;

    let firstShown = null;
    Array.from(citySel.options).forEach((opt) => {
      const sid = opt.getAttribute('state-id');
      // Mostrar solo las opciones de la provincia seleccionada (mantén el placeholder si no tiene state-id)
      const show = sid === stateId || sid === null;
      opt.style.display = show ? '' : 'none';
      if (show && !firstShown && opt.value !== '-1') firstShown = opt;
    });
    if (firstShown) {
      citySel.value = firstShown.value;
      citySel.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }
});

// Cerrar el modal "seller sin delivery" (tu lógica, en vanilla + BS5)
document.addEventListener('click', function (ev) {
  const btn = ev.target.closest('#seller_no_delivery_modal .btn.btn-secondary');
  if (!btn) return;
  ev.preventDefault();
  fetch('/dismiss_seller_no_delivery', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({}),
  }).finally(() => {
    const el = document.getElementById('seller_no_delivery_modal');
    if (!el) return;
    if (window.bootstrap && bootstrap.Modal) {
      bootstrap.Modal.getOrCreateInstance(el).hide();
    } else {
      el.classList.remove('show');
      el.style.display = 'none';
      const bd = document.querySelector('.modal-backdrop');
      if (bd) bd.remove();
      document.body.classList.remove('modal-open');
    }
  });
});
