// PromptLens website JavaScript. No external dependencies, no analytics.
(function () {
  var toggle = document.querySelector('.nav-toggle');
  var links = document.getElementById('nav-links');

  if (toggle && links) {
    toggle.addEventListener('click', function () {
      var expanded = toggle.getAttribute('aria-expanded') === 'true';
      var nextExpanded = !expanded;
      toggle.setAttribute('aria-expanded', String(nextExpanded));
      toggle.setAttribute('aria-label', nextExpanded ? 'Close navigation' : 'Open navigation');
      toggle.textContent = nextExpanded ? 'Close' : 'Menu';
      links.classList.toggle('is-open', nextExpanded);

      if (window.PromptLensI18n && typeof window.PromptLensI18n.refresh === 'function') {
        window.PromptLensI18n.refresh();
      }
    });
  }
}());
