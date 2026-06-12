(function () {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function setupReveal() {
    const elements = document.querySelectorAll('.reveal');

    if (reducedMotion || !('IntersectionObserver' in window)) {
      elements.forEach((element) => element.classList.add('is-visible'));
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });

    elements.forEach((element) => observer.observe(element));
  }

  function closeAccordion(trigger) {
    const panel = document.getElementById(trigger.getAttribute('aria-controls'));
    if (!panel) return;

    trigger.setAttribute('aria-expanded', 'false');
    panel.style.maxHeight = '0px';
  }

  function openAccordion(trigger) {
    const panel = document.getElementById(trigger.getAttribute('aria-controls'));
    if (!panel) return;

    const group = trigger.closest('[data-accordion-group]')?.dataset.accordionGroup;

    if (group) {
      document.querySelectorAll(`[data-accordion-group="${group}"] .accordion-trigger[aria-expanded="true"]`).forEach((openTrigger) => {
        if (openTrigger !== trigger) closeAccordion(openTrigger);
      });
    }

    trigger.setAttribute('aria-expanded', 'true');
    panel.style.maxHeight = `${panel.scrollHeight}px`;
  }

  function setupAccordions() {
    document.querySelectorAll('.accordion-trigger').forEach((trigger) => {
      const panel = document.getElementById(trigger.getAttribute('aria-controls'));
      if (panel) panel.style.maxHeight = '0px';

      trigger.addEventListener('click', () => {
        const isOpen = trigger.getAttribute('aria-expanded') === 'true';
        if (isOpen) {
          closeAccordion(trigger);
        } else {
          openAccordion(trigger);
        }
      });
    });

    window.addEventListener('resize', () => {
      document.querySelectorAll('.accordion-trigger[aria-expanded="true"]').forEach((trigger) => {
        const panel = document.getElementById(trigger.getAttribute('aria-controls'));
        if (panel) panel.style.maxHeight = `${panel.scrollHeight}px`;
      });
    });
  }

  function setupSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach((link) => {
      link.addEventListener('click', (event) => {
        const targetId = link.getAttribute('href');
        if (!targetId || targetId === '#') return;

        const target = document.querySelector(targetId);
        if (!target) return;

        event.preventDefault();
        target.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
      });
    });
  }


  function setupScrollProgress() {
    const bar = document.getElementById('scroll-progress-bar');
    if (!bar) return;

    function updateProgress() {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? Math.min(100, Math.max(0, (scrollTop / docHeight) * 100)) : 0;
      bar.style.width = `${progress}%`;
    }

    updateProgress();
    window.addEventListener('scroll', updateProgress, { passive: true });
    window.addEventListener('resize', updateProgress);
  }


  function setupQuickNav() {
    const links = Array.from(document.querySelectorAll('[data-quick-nav]'));
    if (!links.length) return;

    const start = document.getElementById('plataforma');
    const steps = document.getElementById('metas');
    const community = document.getElementById('whatsapp');

    function setActive(key) {
      links.forEach((link) => {
        link.classList.toggle('is-active', link.dataset.quickNav === key);
      });
    }

    function updateQuickNav() {
      const y = window.scrollY || document.documentElement.scrollTop;
      const startTop = start ? start.offsetTop - 120 : 200;
      const stepsTop = steps ? steps.offsetTop - 120 : 700;
      const communityTop = community ? community.offsetTop - 120 : 1400;

      if (y < startTop) {
        setActive('inicio');
      } else if (y < stepsTop) {
        setActive('plataforma');
      } else if (y < communityTop) {
        setActive('pasos');
      } else {
        setActive('comunidad');
      }
    }

    updateQuickNav();
    window.addEventListener('scroll', updateQuickNav, { passive: true });
    window.addEventListener('resize', updateQuickNav);
  }

  function setupHeroSlider() {
    const slides = Array.from(document.querySelectorAll('[data-slide]'));
    const dots = Array.from(document.querySelectorAll('[data-slide-to]'));
    if (!slides.length) return;

    let currentIndex = 0;
    let autoTimer;

    function goToSlide(index) {
      currentIndex = (index + slides.length) % slides.length;

      slides.forEach((slide, slideIndex) => {
        slide.classList.toggle('is-active', slideIndex === currentIndex);
      });

      dots.forEach((dot, dotIndex) => {
        const isActive = dotIndex === currentIndex;
        dot.classList.toggle('is-active', isActive);
        dot.setAttribute('aria-selected', isActive ? 'true' : 'false');
      });
    }

    function startAutoPlay() {
      if (reducedMotion) return;
      window.clearInterval(autoTimer);
      autoTimer = window.setInterval(() => {
        goToSlide(currentIndex + 1);
      }, 3000);
    }

    dots.forEach((dot, index) => {
      dot.addEventListener('click', () => {
        goToSlide(index);
        startAutoPlay();
      });
    });

    const slider = document.querySelector('.hero-slider');
    if (slider) {
      slider.addEventListener('mouseenter', () => window.clearInterval(autoTimer));
      slider.addEventListener('mouseleave', startAutoPlay);
      slider.addEventListener('touchstart', () => window.clearInterval(autoTimer), { passive: true });
      slider.addEventListener('touchend', startAutoPlay, { passive: true });
    }

    goToSlide(0);
    startAutoPlay();
  }

  document.addEventListener('DOMContentLoaded', () => {
    setupReveal();
    setupAccordions();
    setupSmoothScroll();
    setupScrollProgress();
    setupQuickNav();
    setupHeroSlider();
  });
})();
