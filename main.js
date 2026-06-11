(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(pointer: fine)').matches;

  /* ── Hero entrance ─────────────────────────── */
  const heroSteps = document.querySelectorAll('[data-hero-step]');
  const heroLines = document.querySelectorAll('[data-hero-line]');
  heroLines.forEach((el, i) => el.style.setProperty('--line-delay', `${120 + i * 130}ms`));
  heroSteps.forEach((el, i) => el.style.setProperty('--hero-delay', `${300 + i * 110}ms`));
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      heroLines.forEach(el => el.classList.add('is-in'));
      heroSteps.forEach(el => el.classList.add('is-in'));
    });
  });

  /* ── Hero terminal word: type / hold / erase ── */
  const words = ['WORKFLOW AUTOMATION', 'AI STRATEGY', 'SOCIAL MEDIA AI', 'PROCESS OPTIMIZATION'];
  const wordEl = document.getElementById('heroWord');
  if (wordEl && !reduceMotion) {
    let wi = 0;
    const type = (text, i, done) => {
      wordEl.textContent = text.slice(0, i);
      if (i <= text.length) setTimeout(() => type(text, i + 1, done), 42);
      else done();
    };
    const erase = (done) => {
      const cur = wordEl.textContent;
      wordEl.textContent = cur.slice(0, -1);
      if (cur.length > 1) setTimeout(() => erase(done), 22);
      else done();
    };
    const cycle = () => {
      setTimeout(() => {
        erase(() => {
          wi = (wi + 1) % words.length;
          type(words[wi], 0, cycle);
        });
      }, 2400);
    };
    cycle();
  }

  /* ── Scroll reveal ─────────────────────────── */
  const revealEls = document.querySelectorAll('[data-reveal]');
  if (!('IntersectionObserver' in window) || reduceMotion) {
    revealEls.forEach(el => el.classList.add('is-in'));
  } else {
    const revealIO = new IntersectionObserver((entries) => {
      let batch = 0;
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.style.setProperty('--reveal-delay', `${batch * 80}ms`);
        entry.target.classList.add('is-in');
        revealIO.unobserve(entry.target);
        batch++;
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(el => revealIO.observe(el));
  }

  /* ── Card tilt + cursor spotlight ──────────── */
  if (finePointer && !reduceMotion) {
    document.querySelectorAll('[data-tilt]').forEach(card => {
      let raf = null;
      card.addEventListener('pointermove', (e) => {
        if (raf) return;
        raf = requestAnimationFrame(() => {
          const r = card.getBoundingClientRect();
          const x = e.clientX - r.left;
          const y = e.clientY - r.top;
          card.style.setProperty('--mx', `${x}px`);
          card.style.setProperty('--my', `${y}px`);
          const rx = ((y / r.height) - 0.5) * -4;
          const ry = ((x / r.width) - 0.5) * 4;
          card.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-3px)`;
          raf = null;
        });
      });
      card.addEventListener('pointerleave', () => {
        if (raf) { cancelAnimationFrame(raf); raf = null; }
        card.style.transition = 'transform 500ms cubic-bezier(0.16, 1, 0.3, 1)';
        card.style.transform = '';
        setTimeout(() => { card.style.transition = ''; }, 500);
      });
    });

    /* ── Magnetic buttons ────────────────────── */
    document.querySelectorAll('[data-magnetic]').forEach(btn => {
      const strength = 0.22, cap = 7;
      btn.addEventListener('pointermove', (e) => {
        const r = btn.getBoundingClientRect();
        let dx = (e.clientX - (r.left + r.width / 2)) * strength;
        let dy = (e.clientY - (r.top + r.height / 2)) * strength;
        dx = Math.max(-cap, Math.min(cap, dx));
        dy = Math.max(-cap, Math.min(cap, dy));
        btn.style.transform = `translate(${dx}px, ${dy}px)`;
      });
      btn.addEventListener('pointerleave', () => {
        btn.style.transition = 'transform 400ms cubic-bezier(0.34, 1.56, 0.64, 1)';
        btn.style.transform = '';
        setTimeout(() => { btn.style.transition = ''; }, 400);
      });
    });

    /* ── Cursor glow ─────────────────────────── */
    const glow = document.getElementById('cursorGlow');
    if (glow) {
      let gx = innerWidth / 2, gy = innerHeight / 2, tx = gx, ty = gy;
      let glowRaf = null;
      const step = () => {
        gx += (tx - gx) * 0.12;
        gy += (ty - gy) * 0.12;
        glow.style.transform = `translate(${gx}px, ${gy}px)`;
        if (Math.abs(tx - gx) > 0.3 || Math.abs(ty - gy) > 0.3) {
          glowRaf = requestAnimationFrame(step);
        } else {
          glowRaf = null;
        }
      };
      addEventListener('pointermove', (e) => {
        tx = e.clientX; ty = e.clientY;
        glow.classList.add('is-on');
        if (!glowRaf) glowRaf = requestAnimationFrame(step);
      }, { passive: true });
      document.documentElement.addEventListener('pointerleave', () => glow.classList.remove('is-on'));
    }
  }

  /* ── Nav scrolled state ────────────────────── */
  const nav = document.getElementById('nav');
  const onScroll = () => {
    if (scrollY > 24) nav.classList.add('scrolled');
    else nav.classList.remove('scrolled');
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ── Nav active-section highlight ──────────── */
  const navLinkMap = new Map();
  document.querySelectorAll('.nav__link[href^="#"]').forEach(link => {
    const section = document.querySelector(link.getAttribute('href'));
    if (section) navLinkMap.set(section, link);
  });
  if ('IntersectionObserver' in window && navLinkMap.size) {
    const sectionIO = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        document.querySelectorAll('.nav__link.is-active').forEach(l => l.classList.remove('is-active'));
        navLinkMap.get(entry.target).classList.add('is-active');
      });
    }, { rootMargin: '-35% 0px -55% 0px' });
    navLinkMap.forEach((_, section) => sectionIO.observe(section));
  }

  /* ── Mobile menu ───────────────────────────── */
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
})();
