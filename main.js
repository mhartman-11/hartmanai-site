(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── Hero entrance ─────────────────────────── */
  const heroAnimEls = ['heroTag'];
  document.querySelectorAll('.hero__tag, .hero__title, .hero__sub, .hero__ctas, .hero__stats')
    .forEach(el => {
      requestAnimationFrame(() => {
        setTimeout(() => el.classList.add('is-in'), 100);
      });
    });

  /* ── Hero rotating tag ─────────────────────── */
  const services = ['Workflow Automation', 'AI Strategy', 'Social Media AI', 'Process Optimization'];
  const tagText = document.getElementById('heroTagText');
  if (tagText && !reduceMotion) {
    let i = 0;
    setInterval(() => {
      tagText.classList.add('is-fading');
      setTimeout(() => {
        i = (i + 1) % services.length;
        tagText.textContent = services[i];
        tagText.classList.remove('is-fading');
      }, 250);
    }, 2200);
  }

  /* ── Nav scroll-blur ───────────────────────── */
  const nav = document.getElementById('nav');
  const onScroll = () => {
    if (window.scrollY > 20) nav.classList.add('scrolled');
    else nav.classList.remove('scrolled');
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ── Mobile menu toggle ────────────────────── */
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');
  navToggle?.addEventListener('click', () => {
    const open = navLinks.classList.toggle('is-open');
    navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  navLinks?.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      navLinks.classList.remove('is-open');
      navToggle?.setAttribute('aria-expanded', 'false');
    });
  });

  /* ── Testimonial carousel ──────────────────── */
  const stage = document.getElementById('testimonialStage');
  const dotsWrap = document.getElementById('testimonialDots');
  if (stage && dotsWrap) {
    const slides = stage.querySelectorAll('.testimonial');
    const dots = dotsWrap.querySelectorAll('.testimonials__dot');
    let active = 0;
    let timer;

    const show = (n) => {
      slides.forEach((s, idx) => s.classList.toggle('is-active', idx === n));
      dots.forEach((d, idx) => d.classList.toggle('is-active', idx === n));
      active = n;
    };
    const start = () => {
      if (reduceMotion) return;
      timer = setInterval(() => show((active + 1) % slides.length), 4000);
    };
    const stop = () => clearInterval(timer);

    dots.forEach((d, idx) => d.addEventListener('click', () => {
      stop(); show(idx); start();
    }));
    start();
  }

  /* ── Calendly placeholder warning (dev only) ─ */
  // Replace href="#" on data-calendly buttons with real Calendly URL when ready.
})();
