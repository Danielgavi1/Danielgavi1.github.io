(() => {
  const WA_NUMBER = '34669530164';

  const buildWhatsAppUrl = (topic = 'un diagnóstico capilar') => {
    const message = `Hola, quiero información sobre ${topic} en Kapylar Center Sant Cugat. ¿Podéis orientarme?`;
    return `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(message)}`;
  };

  document.querySelectorAll('[data-wa-link]').forEach((link) => {
    const topic = link.dataset.waTopic || 'un diagnóstico capilar';
    link.href = buildWhatsAppUrl(topic);
    link.target = '_blank';
    link.rel = 'noopener';
  });

  const form = document.querySelector('#diagnostic-form');
  if (form) {
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const data = new FormData(form);
      const concern = data.get('concern') || 'un problema capilar';
      const name = (data.get('name') || '').trim();
      const intro = name ? `Hola, soy ${name}.` : 'Hola.';
      const message = `${intro} Quiero información sobre ${concern} y me gustaría solicitar una valoración capilar en Kapylar Center Sant Cugat. ¿Cómo podemos empezar?`;
      window.open(`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(message)}`, '_blank', 'noopener');
    });
  }

  const header = document.querySelector('.site-header');
  const updateHeader = () => header?.classList.toggle('scrolled', window.scrollY > 18);
  updateHeader();
  window.addEventListener('scroll', updateHeader, { passive: true });

  const menuButton = document.querySelector('.menu-button');
  const nav = document.querySelector('#main-nav');

  const setMobileMenuState = (open) => {
    if (!menuButton || !nav) return;
    nav.classList.toggle('open', open);
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
  };

  if (menuButton && nav) {
    menuButton.addEventListener('click', () => {
      setMobileMenuState(!nav.classList.contains('open'));
    });

    nav.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => setMobileMenuState(false));
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && nav.classList.contains('open')) {
        setMobileMenuState(false);
        menuButton.focus();
      }
    });
  }

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const reveals = document.querySelectorAll('.reveal');
  if (!reducedMotion && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -35px' });
    reveals.forEach((element) => observer.observe(element));
  } else {
    reveals.forEach((element) => element.classList.add('is-visible'));
  }

  /* Acordeón FAQ con apertura/cierre suave y controlado */
  const faqItems = Array.from(document.querySelectorAll('.faq-list details'));

  const finishFaqAnimation = (details) => {
    if (details._faqAnimation) {
      details._faqAnimation.cancel();
      details._faqAnimation = null;
    }
  };

  const closeFaq = (details, immediate = false) => {
    if (!details.open) return;

    finishFaqAnimation(details);

    if (reducedMotion || immediate) {
      details.open = false;
      details.classList.remove('faq-opening', 'faq-closing');
      details.style.height = '';
      return;
    }

    const summary = details.querySelector('summary');
    const startHeight = details.getBoundingClientRect().height;
    const endHeight = summary.getBoundingClientRect().height;

    details.classList.remove('faq-opening');
    details.classList.add('faq-closing');
    details.style.height = `${startHeight}px`;

    details._faqAnimation = details.animate(
      [
        { height: `${startHeight}px` },
        { height: `${endHeight}px` }
      ],
      {
        duration: 390,
        easing: 'cubic-bezier(.22,.8,.22,1)'
      }
    );

    details._faqAnimation.onfinish = () => {
      details.open = false;
      details.classList.remove('faq-closing');
      details.style.height = '';
      details._faqAnimation = null;
    };

    details._faqAnimation.oncancel = () => {
      details._faqAnimation = null;
    };
  };

  const openFaq = (details, immediate = false) => {
    if (details.open && !details.classList.contains('faq-closing')) return;

    finishFaqAnimation(details);

    /* Mantener un solo elemento abierto, pero cerrar los demás con suavidad */
    faqItems.forEach((other) => {
      if (other !== details && other.open) closeFaq(other, immediate);
    });

    if (reducedMotion || immediate) {
      details.open = true;
      details.classList.remove('faq-opening', 'faq-closing');
      details.style.height = '';
      return;
    }

    /* Medimos el estado cerrado antes de habilitar el contenido */
    const summary = details.querySelector('summary');
    const startHeight = summary.getBoundingClientRect().height;

    details.style.height = `${startHeight}px`;
    details.open = true;
    details.classList.remove('faq-closing');
    details.classList.add('faq-opening');

    /* Un frame permite al navegador calcular la altura completa abierta */
    requestAnimationFrame(() => {
      const endHeight = details.scrollHeight;

      details._faqAnimation = details.animate(
        [
          { height: `${startHeight}px` },
          { height: `${endHeight}px` }
        ],
        {
          duration: 430,
          easing: 'cubic-bezier(.22,.8,.22,1)'
        }
      );

      details._faqAnimation.onfinish = () => {
        details.classList.remove('faq-opening');
        details.style.height = '';
        details._faqAnimation = null;
      };

      details._faqAnimation.oncancel = () => {
        details._faqAnimation = null;
      };
    });
  };

  faqItems.forEach((details) => {
    const summary = details.querySelector('summary');
    if (!summary) return;

    summary.addEventListener('click', (event) => {
      event.preventDefault();

      if (details.open && !details.classList.contains('faq-closing')) {
        closeFaq(details);
      } else {
        openFaq(details);
      }
    });
  });

  const year = document.querySelector('#year');
  if (year) year.textContent = String(new Date().getFullYear());

  /* Experiencia profesional de Susana Serrano.
     Año base confirmado: 2026 = 27 años.
     A partir de ahí aumenta automáticamente 1 año por cada año natural. */
  const EXPERIENCE_BASE_YEAR = 2026;
  const EXPERIENCE_BASE_YEARS = 27;

  const updateExperienceYears = () => {
    const currentYear = new Date().getFullYear();
    const experienceYears = Math.max(
      EXPERIENCE_BASE_YEARS,
      EXPERIENCE_BASE_YEARS + (currentYear - EXPERIENCE_BASE_YEAR)
    );

    document.querySelectorAll('[data-experience-years]').forEach((element) => {
      element.textContent = `+${experienceYears}`;
    });

    document.querySelectorAll('[data-experience-years-plain]').forEach((element) => {
      element.textContent = String(experienceYears);
    });

    document.querySelectorAll('[data-experience-label]').forEach((element) => {
      element.setAttribute('aria-label', `Más de ${experienceYears} años de experiencia`);
    });
  };

  updateExperienceYears();

  /* Carousel infinito para la pista .marquee-track en móviles (transform + CSS animation) */
  function initMarqueeCarousel() {
    if (!window.matchMedia('(max-width:560px)').matches) return;
    const track = document.querySelector('.marquee-track');
    if (!track || track.dataset.marqueeInit) return;
    track.dataset.marqueeInit = '1';

    // crear wrapper interior
    const inner = document.createElement('div');
    inner.className = 'marquee-inner';

    // extraer nodos actuales y moverlos dentro del wrapper
    const originals = Array.from(track.children);
    originals.forEach(node => inner.appendChild(node));

    // añadir el wrapper al track
    track.appendChild(inner);

    // duplicar contenido hasta que el ancho interior sea al menos 2x el visible
    let attempts = 0;
    while (inner.scrollWidth < track.clientWidth * 2 && attempts < 8) {
      const children = Array.from(inner.children);
      children.forEach(ch => inner.appendChild(ch.cloneNode(true)));
      attempts++;
    }

    // calcular duración según ancho y velocidad (px/s)
    const scrollAmount = inner.scrollWidth / 2; // cantidad a desplazar
    const pxPerSecond = 40; // ajustar velocidad aquí
    const durationSeconds = Math.max(6, scrollAmount / pxPerSecond);

    inner.style.animationDuration = durationSeconds + 's';
    inner.classList.add('animating');

    // pausa al interactuar
    function pause() { inner.style.animationPlayState = 'paused'; }
    function resume() { inner.style.animationPlayState = 'running'; }
    track.addEventListener('mouseenter', pause);
    track.addEventListener('mouseleave', resume);
    track.addEventListener('touchstart', pause, { passive: true });
    track.addEventListener('touchend', resume);

    // limpiar si se sale del breakpoint móvil
    function onResize() {
      if (!window.matchMedia('(max-width:560px)').matches) {
        // mover la primera mitad de elementos de inner de vuelta al track
        const items = Array.from(inner.children);
        const half = Math.floor(items.length / 2);
        for (let i = 0; i < half; i++) track.appendChild(items[i]);
        inner.remove();
        delete track.dataset.marqueeInit;
        window.removeEventListener('resize', onResize);
      }
    }
    window.addEventListener('resize', onResize);
  }

  // inicializar al cargar
  initMarqueeCarousel();

  // Simular estado 'pressed' con teclado (Enter / Space) para las tarjetas interactivas
  function initCardKeyboardPress() {
    const cards = document.querySelectorAll('.visual-card[tabindex], .treatment-card[tabindex], .innovation-card[tabindex]');
    if (!cards.length) return;
    cards.forEach((card) => {
      let holding = false;
      card.addEventListener('keydown', (e) => {
        const key = e.key || e.code;
        if (key === 'Enter' || key === ' ' || key === 'Spacebar' || key === 'Space') {
          if (!holding) {
            holding = true;
            card.classList.add('pressed');
          }
          // Prevent default for Space to avoid page scroll
          if (e.code === 'Space' || e.key === ' ') e.preventDefault();
        }
      });
      card.addEventListener('keyup', (e) => {
        const key = e.key || e.code;
        if (key === 'Enter' || key === ' ' || key === 'Spacebar' || key === 'Space') {
          holding = false;
          card.classList.remove('pressed');
          // trigger click behavior if needed
          card.click();
        }
      });
      card.addEventListener('blur', () => {
        holding = false;
        card.classList.remove('pressed');
      });
    });
  }
  initCardKeyboardPress();

})();
