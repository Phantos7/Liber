/* =====================================================
   LIBER — JS · runda 2
   ===================================================== */

document.documentElement.classList.add('js');
const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
const NO_HOVER = matchMedia('(hover: none), (max-width: 900px)').matches;

/* -------- LOADER (sync with window.load + rAF) -------- */
(() => {
  const loader = document.querySelector('[data-loader]');
  const fill = document.querySelector('[data-loader-fill]');
  const pct = document.querySelector('[data-loader-pct]');
  if (!loader || !fill || !pct) return;

  let target = 0, current = 0, loaded = false, done = false;
  const startTime = performance.now();
  const RAMP_DURATION = 700;   // czas wirtualnego rozpędu paska, gdy obrazy się jeszcze ładują

  const finish = () => {
    if (done) return;
    done = true;
    fill.style.right = '0%';
    pct.textContent = '100%';
    setTimeout(() => loader.classList.add('is-done'), 220);
  };

  const tick = (now) => {
    if (done) return;
    const elapsed = now - startTime;
    if (loaded) {
      target = 100;
    } else {
      // animowany pasek od 0% do 82% w trakcie ładowania obrazów
      target = Math.min(82, (elapsed / RAMP_DURATION) * 82);
    }
    current += (target - current) * 0.18;
    if (target - current < 0.5) current = target;
    const safePct = isFinite(current) ? Math.max(0, Math.min(100, current)) : 0;
    fill.style.right = (100 - safePct) + '%';
    pct.textContent = String(Math.floor(safePct)).padStart(2, '0') + '%';
    if (safePct >= 99.5 && loaded) {
      finish();
      return;
    }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);

  // Czekamy tylko na obrazy w pierwszym ekranie (hero bg + okładka).
  // Wideo (sekcja Fabuła) doczytuje się później — nie blokuje loadera.
  const waitForHeroImages = () => {
    const imgs = document.querySelectorAll('.hero__bg-img, .hero__packshot-img');
    if (!imgs.length) return Promise.resolve();
    return Promise.all(Array.from(imgs).map(img =>
      img.complete && img.naturalWidth > 0
        ? Promise.resolve()
        : new Promise(res => {
            img.addEventListener('load',  res, { once: true });
            img.addEventListener('error', res, { once: true });
          })
    ));
  };

  const start = () => waitForHeroImages().then(() => { loaded = true; });
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }

  // safety net — fallback po 2.5s gdyby obraz nigdy się nie załadował
  setTimeout(() => { loaded = true; }, 2500);
  // hard kill — pełne ukrycie po 4s
  setTimeout(() => finish(), 4000);
})();

/* -------- NAV scroll -------- */
(() => {
  const nav = document.querySelector('[data-nav]');
  if (!nav) return;
  const onScroll = () => nav.classList.toggle('is-scrolled', window.scrollY > 40);
  document.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();

/* -------- MOBILE BURGER MENU with focus trap -------- */
(() => {
  const burger = document.querySelector('[data-burger]');
  const links  = document.getElementById('nav-links');
  if (!burger || !links) return;

  let lastFocused = null;
  const focusables = () => Array.from(links.querySelectorAll('a'));

  const close = () => {
    burger.classList.remove('is-open');
    links.classList.remove('is-open');
    burger.setAttribute('aria-expanded', 'false');
    document.documentElement.style.overflow = '';
    if (lastFocused && document.body.contains(lastFocused)) lastFocused.focus();
    else burger.focus();
  };
  const open = () => {
    lastFocused = document.activeElement;
    burger.classList.add('is-open');
    links.classList.add('is-open');
    burger.setAttribute('aria-expanded', 'true');
    document.documentElement.style.overflow = 'hidden';
    const first = focusables()[0];
    if (first) setTimeout(() => first.focus(), 360);
  };
  burger.addEventListener('click', () => {
    burger.classList.contains('is-open') ? close() : open();
  });
  links.querySelectorAll('a').forEach(a => a.addEventListener('click', close));
  addEventListener('keydown', e => {
    if (e.key === 'Escape' && burger.classList.contains('is-open')) close();
    if (e.key === 'Tab' && burger.classList.contains('is-open')) {
      const els = focusables();
      if (!els.length) return;
      const first = els[0], last = els[els.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
})();

/* -------- CUSTOM CURSOR -------- */
(() => {
  const c = document.querySelector('[data-cursor]');
  const d = document.querySelector('[data-cursor-dot]');
  if (!c || !d) return;
  // W trybie iframe (embedded na metafora.pl/premiera/) custom cursor powoduje
  // zacinanie się myszki — mysz wychodząc z iframe zostawia "zamrożony" cursor,
  // a mix-blend-mode + rAF na ogromnym iframe jest drogie. Wracamy do systemowego.
  if (window.parent !== window || NO_HOVER || REDUCED) {
    c.remove(); d.remove();
    document.documentElement.classList.add('no-cursor');
    return;
  }

  let mx = innerWidth / 2, my = innerHeight / 2;
  let cx = mx, cy = my, dx = mx, dy = my;

  addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });

  const loop = () => {
    cx += (mx - cx) * 0.18;
    cy += (my - cy) * 0.18;
    dx += (mx - dx) * 0.35;
    dy += (my - dy) * 0.35;
    c.style.transform = `translate(${cx}px, ${cy}px) translate(-50%, -50%)`;
    d.style.transform = `translate(${dx}px, ${dy}px) translate(-50%, -50%)`;
    requestAnimationFrame(loop);
  };
  loop();

  document.querySelectorAll('a, button, [data-magnetic], [data-cursor-trigger]').forEach(el => {
    el.addEventListener('mouseenter', () => document.body.classList.add('is-hover'));
    el.addEventListener('mouseleave', () => document.body.classList.remove('is-hover'));
  });
})();

/* -------- MAGNETIC HOVER -------- */
(() => {
  if (NO_HOVER || REDUCED) return;
  document.querySelectorAll('[data-magnetic]').forEach(el => {
    const strength = 0.35;
    el.addEventListener('mousemove', e => {
      const r = el.getBoundingClientRect();
      const x = e.clientX - (r.left + r.width / 2);
      const y = e.clientY - (r.top + r.height / 2);
      el.style.transform = `translate(${x * strength}px, ${y * strength}px)`;
    });
    el.addEventListener('mouseleave', () => {
      el.style.transform = '';
    });
  });
})();

/* -------- TILT on cards -------- */
(() => {
  if (NO_HOVER || REDUCED) return;
  const max = 8;
  document.querySelectorAll('[data-tilt]').forEach(el => {
    const onMove = e => {
      const r = el.getBoundingClientRect();
      const rx = ((e.clientY - r.top) / r.height - 0.5) * -max;
      const ry = ((e.clientX - r.left) / r.width - 0.5) * max;
      el.style.transform = `perspective(1000px) rotateX(${rx}deg) rotateY(${ry}deg)`;
    };
    el.addEventListener('mousemove', onMove);
    el.addEventListener('mouseleave', () => { el.style.transform = ''; });
  });
})();

/* -------- SPLIT WORDS -------- */
(() => {
  document.querySelectorAll('[data-split-words]').forEach(el => {
    const html = el.innerHTML;
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    const result = [];
    const walk = node => {
      node.childNodes.forEach(n => {
        if (n.nodeType === Node.TEXT_NODE) {
          const parts = n.textContent.split(/(\s+)/);
          parts.forEach(p => {
            if (p.match(/^\s+$/)) {
              result.push(p);
            } else if (p.length) {
              result.push(`<span class="word"><span>${p}</span></span>`);
            }
          });
        } else if (n.nodeType === Node.ELEMENT_NODE) {
          const open = `<${n.tagName.toLowerCase()}${[...n.attributes].map(a => ` ${a.name}="${a.value}"`).join('')}>`;
          result.push(open);
          walk(n);
          result.push(`</${n.tagName.toLowerCase()}>`);
        }
      });
    };
    walk(tmp);
    el.innerHTML = result.join('');
    el.querySelectorAll('.word > span').forEach((s, i) => {
      s.style.transitionDelay = (i * 60) + 'ms';
    });
  });
})();

/* -------- REVEAL on scroll -------- */
(() => {
  const io = new IntersectionObserver((entries) => {
    entries.forEach(en => {
      if (en.isIntersecting) {
        en.target.classList.add('is-in');
        io.unobserve(en.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

  document.querySelectorAll('[data-reveal], [data-split-words]').forEach(el => io.observe(el));
})();

/* -------- HERO PARALLAX with rAF + ticking flag -------- */
(() => {
  if (REDUCED) return;
  const bg = document.querySelector('[data-parallax-bg]');
  if (!bg) return;
  bg.style.willChange = 'transform';
  let ticking = false;
  let lastY = 0;
  const render = () => {
    const y = lastY;
    bg.style.transform = `translate3d(0, ${y * 0.35}px, 0) scale(${1 + y * 0.00018})`;
    ticking = false;
  };
  addEventListener('scroll', () => {
    lastY = window.scrollY;
    if (!ticking) {
      requestAnimationFrame(render);
      ticking = true;
    }
  }, { passive: true });
  render();
})();

/* -------- LIVE CLOCK -------- */
(() => {
  const el = document.querySelector('[data-live-clock]');
  if (!el) return;
  const upd = () => {
    const n = new Date();
    const pad = v => String(v).padStart(2, '0');
    el.textContent = `${pad(n.getHours())}:${pad(n.getMinutes())}:${pad(n.getSeconds())}`;
  };
  upd(); setInterval(upd, 1000);
})();

/* -------- COUNTDOWN with slot-flip on change -------- */
(() => {
  const root = document.querySelector('[data-countdown]');
  if (!root) return;
  const target = new Date('2026-06-09T00:00:00');
  const cells = {
    d: root.querySelector('[data-cd="d"]'),
    h: root.querySelector('[data-cd="h"]'),
    m: root.querySelector('[data-cd="m"]'),
    s: root.querySelector('[data-cd="s"]')
  };
  const prev = { d: '', h: '', m: '', s: '' };
  const pad = v => String(v).padStart(2, '0');
  const upd = () => {
    let diff = Math.max(0, target - new Date());
    const d = Math.floor(diff / 86400000); diff -= d * 86400000;
    const h = Math.floor(diff / 3600000);  diff -= h * 3600000;
    const m = Math.floor(diff / 60000);    diff -= m * 60000;
    const s = Math.floor(diff / 1000);
    const next = { d: pad(d), h: pad(h), m: pad(m), s: pad(s) };
    for (const k in next) {
      if (next[k] !== prev[k]) {
        cells[k].textContent = next[k];
        cells[k].classList.remove('is-flip');
        // force reflow to restart anim
        void cells[k].offsetWidth;
        cells[k].classList.add('is-flip');
        prev[k] = next[k];
      }
    }
  };
  upd(); setInterval(upd, 1000);
})();

/* -------- SMOOTH ANCHOR for nav -------- */
(() => {
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const id = a.getAttribute('href');
      if (id && id.length > 1) {
        const t = document.querySelector(id);
        if (t) { e.preventDefault(); t.scrollIntoView({ behavior: REDUCED ? 'auto' : 'smooth', block: 'start' }); }
      }
    });
  });
})();

/* -------- VIDEO sound toggle (autoplay+muted, user activates audio) -------- */
(() => {
  const btn = document.querySelector('[data-sound]');
  const video = document.querySelector('[data-video]');
  if (!btn || !video) return;
  const iconOff = btn.querySelector('[data-sound-off]');
  const iconOn  = btn.querySelector('[data-sound-on]');
  const label   = btn.querySelector('[data-sound-label]');

  const setMuted = (m) => {
    video.muted = m;
    iconOff.style.display = m ? '' : 'none';
    iconOn.style.display  = m ? 'none' : '';
    label.textContent = m ? 'Włącz dźwięk' : 'Wycisz';
    btn.setAttribute('aria-label', m ? 'Włącz dźwięk' : 'Wycisz');
  };

  btn.addEventListener('click', () => {
    if (video.muted) {
      video.muted = false;
      // Make sure it's actually playing after gesture
      const p = video.play();
      if (p && p.catch) p.catch(() => {});
    } else {
      video.muted = true;
    }
    setMuted(video.muted);
  });

  // Auto-mute if user uses native controls to mute
  video.addEventListener('volumechange', () => setMuted(video.muted));
})();

/* -------- STICKY pre-order CTA -------- */
(() => {
  const cta = document.querySelector('[data-sticky-cta]');
  const hero = document.querySelector('#hero');
  const formaty = document.querySelector('#formaty');
  if (!cta || !hero || !formaty) return;

  const update = () => {
    const heroBottom = hero.getBoundingClientRect().bottom;
    const formatyTop = formaty.getBoundingClientRect().top;
    const vh = window.innerHeight;
    // pokaż po przewinięciu hero, ukryj gdy formaty są na ekranie (user już tam jest)
    const show = heroBottom < 0 && formatyTop > vh * 0.5;
    cta.classList.toggle('is-visible', show);
  };
  addEventListener('scroll', update, { passive: true });
  addEventListener('resize', update);
  update();
})();

/* -------- PAUSE heavy animations when out of viewport (saving CPU) -------- */
(() => {
  if (REDUCED) return;
  const pauseTargets = document.querySelectorAll('.hero__fog, .ticker__track, .fmt__wave, .hero__packshot-glow, .hero__packshot-img');
  const io = new IntersectionObserver(entries => {
    entries.forEach(en => {
      en.target.style.animationPlayState = en.isIntersecting ? 'running' : 'paused';
    });
  }, { rootMargin: '50px' });
  pauseTargets.forEach(el => io.observe(el));
})();

/* -------- SCRAMBLE TEXT on aspects card titles -------- */
(() => {
  if (REDUCED) return;
  const chars = '!<>-_\\/[]{}—=+*^?#________';
  document.querySelectorAll('.aspects__title').forEach(el => {
    const original = el.textContent;
    let busy = false;
    el.addEventListener('mouseenter', () => {
      if (busy) return;
      busy = true;
      let i = 0;
      const interval = setInterval(() => {
        el.textContent = original
          .split('')
          .map((c, idx) => idx < i ? c : (c === ' ' ? ' ' : chars[Math.floor(Math.random() * chars.length)]))
          .join('');
        i += 1;
        if (i > original.length) {
          el.textContent = original;
          clearInterval(interval);
          busy = false;
        }
      }, 25);
    });
  });
})();

/* ===========================================================
 * Iframe auto-resize (postMessage)
 * Gdy LIBER jest osadzony jako iframe (np. metafora.pl/premiera/),
 * wysyła wysokość treści do parent — parent dopasowuje height iframe,
 * dzięki czemu scroll przewija naturalnie cały landing + footer hosta.
 * =========================================================== */
(() => {
  if (window.parent === window) return; // standalone — nic nie wysyłaj

  // KLUCZOWE: zafiksowanie "viewport height" zanim parent przeskaluje iframe.
  // Bez tego hero z `min-height: 100vh` rośnie razem z wysokością iframe
  // → scrollHeight rośnie → parent rośnie → pętla. Z `--liber-vh` wszystko stoi.
  const root = document.documentElement;
  const lockedVh = Math.max(640, Math.min(window.innerHeight || 800, 960));
  root.style.setProperty('--liber-vh', lockedVh + 'px');
  root.classList.add('liber-embedded');

  // Hash-linki nav (#sprawa, #zespol, ...) w iframe nie maja gdzie scrollowac
  // (iframe = full content height). Wysylamy postMessage do parent, niech parent
  // przewinie OUTER page do `iframeTop + targetY`.
  document.addEventListener('click', (e) => {
    const a = e.target && e.target.closest && e.target.closest('a[href^="#"]');
    if (!a) return;
    const href = a.getAttribute('href');
    if (!href || href === '#' || href.length < 2) return;
    const target = document.getElementById(href.slice(1));
    if (!target) return;
    e.preventDefault();
    const targetY = target.getBoundingClientRect().top + window.scrollY;
    try { window.parent.postMessage({ type: 'liber:scrollTo', y: targetY }, '*'); } catch (_) {}
    // Zamknij mobile menu jesli otwarte
    const nav = document.getElementById('nav-links');
    const burger = document.querySelector('[data-burger]');
    if (nav && nav.classList.contains('is-open')) {
      nav.classList.remove('is-open');
      if (burger) burger.setAttribute('aria-expanded', 'false');
    }
  }, true);

  // Burger menu w iframe: position:fixed mobile menu pinuje sie do iframe TOP
  // (initial containing block iframe), nie do outer viewport. Jesli user jest
  // scrollniety w iframe content (np. na sekcji Trylogia), tap burger pokazuje
  // menu "u gory iframe" daleko od viewportu usera. Fix: jak burger jest tapnięty,
  // wymus outer scroll do top iframe — wtedy menu otwiera sie w jego viewport.
  const _burger = document.querySelector('[data-burger]');
  if (_burger) {
    _burger.addEventListener('click', () => {
      try { window.parent.postMessage({ type: 'liber:scrollTo', y: 0 }, '*'); } catch (_) {}
    });
  }

  // PERFORMANCE: w iframe cala tresc renderuje sie naraz (~13000px), wiec
  // wszystkie animacje sekcji biegna jednoczesnie -> grzanie/zacinanie.
  // Parent wysyla aktualny widoczny zakres (w iframe-coords); pauzujemy
  // animacje sekcji, ktore sa poza nim (klasa .anim-paused).
  let vpTick = false;
  let lastVp = null;
  const applyPause = () => {
    vpTick = false;
    if (!lastVp) return;
    const margin = 500;
    const top = lastVp.top - margin;
    const bot = lastVp.bottom + margin;
    document.querySelectorAll('section').forEach((s) => {
      const r = s.getBoundingClientRect();
      const sTop = r.top + window.scrollY;
      const visible = (sTop + r.height) > top && sTop < bot;
      s.classList.toggle('anim-paused', !visible);
    });
  };
  window.addEventListener('message', (e) => {
    if (!e.data || e.data.type !== 'liber:outerViewport') return;
    const t = Number(e.data.top), b = Number(e.data.bottom);
    if (!isFinite(t) || !isFinite(b) || b <= t) return;
    lastVp = { top: t, bottom: b };
    if (!vpTick) { vpTick = true; requestAnimationFrame(applyPause); }
  });

  let last = 0;
  const measure = () => Math.max(
    document.documentElement.scrollHeight,
    document.body ? document.body.scrollHeight : 0,
    document.documentElement.offsetHeight,
    document.body ? document.body.offsetHeight : 0
  );
  const send = () => {
    const h = measure();
    if (!Number.isFinite(h) || h <= 0) return;
    if (Math.abs(h - last) < 4) return;
    last = h;
    try { window.parent.postMessage({ type: 'liber:resize', height: h }, '*'); } catch (_) {}
  };

  const burst = () => {
    send();
    setTimeout(send, 200);
    setTimeout(send, 800);
    setTimeout(send, 2000);
    setTimeout(send, 5000); // po lazy images / fonts
  };
  if (document.readyState === 'complete') burst();
  else window.addEventListener('load', burst, { once: true });

  if ('ResizeObserver' in window) {
    const ro = new ResizeObserver(() => send());
    ro.observe(document.documentElement);
    if (document.body) ro.observe(document.body);
  }
  window.addEventListener('resize', send);
  // Bezpiecznik dla zmian wymuszonych JS-em (mobile menu, video aspect, accordion)
  setInterval(send, 1500);
})();
