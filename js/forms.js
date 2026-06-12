(function () {
  let toastTimer;

  function showToast(message) {
    const toast = document.getElementById('toast');
    if (!toast) return;

    toast.textContent = message || 'Este botón está listo para que agregues tu link.';
    toast.classList.add('is-visible');
    toast.setAttribute('aria-hidden', 'false');

    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => {
      toast.classList.remove('is-visible');
      toast.setAttribute('aria-hidden', 'true');
    }, 2600);
  }

  function setupPlaceholderLinks() {
    document.querySelectorAll('a[href="#"]').forEach((link) => {
      link.addEventListener('click', (event) => {
        event.preventDefault();
        const label = link.dataset.label;
        const message = label
          ? `“${label}” está listo para que agregues tu link.`
          : 'Este botón está listo para que agregues tu link.';
        showToast(message);
      });
    });
  }

  document.addEventListener('DOMContentLoaded', setupPlaceholderLinks);
})();
