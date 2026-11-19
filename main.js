'use strict';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

/* ================= GAVEL ================= */
const REST = 26, LIFT = 36, HIT = -3;
function strike(rig, { onImpact, speed = 1 } = {}) {
  const g = $('.gavel', rig);
  if (rig._busy) return rig._busy;
  rig._busy = new Promise((resolve) => {
    if (reduced) { onImpact && onImpact(); impact(rig); rig._busy = null; return resolve(); }
    const a1 = g.animate([{ transform: `rotate(${REST}deg)` }, { transform: `rotate(${LIFT}deg)` }],
      { duration: 160 / speed, easing: 'cubic-bezier(.2,.8,.3,1)', fill: 'forwards' });
    a1.onfinish = () => {
      const a2 = g.animate([{ transform: `rotate(${LIFT}deg)` }, { transform: `rotate(${HIT}deg)` }],
        { duration: 110 / speed, easing: 'cubic-bezier(.6,0,1,.6)', fill: 'forwards' });
      a2.onfinish = () => {
        impact(rig);
        onImpact && onImpact();
        const a3 = g.animate([
          { transform: `rotate(${HIT}deg)` }, { transform: `rotate(${HIT + 9}deg)`, offset: .3 },
          { transform: `rotate(${HIT + 4}deg)`, offset: .55 }, { transform: `rotate(${REST}deg)` }],
          { duration: 520 / speed, easing: 'cubic-bezier(.3,.7,.3,1)', fill: 'forwards' });
        a3.onfinish = () => { rig._busy = null; resolve(); };
      };
    };
  });
  return rig._busy;
}
function impact(rig) {
  rig.classList.remove('hit'); void rig.offsetWidth; rig.classList.add('hit');
  if (reduced) return;
  const shock = $('.shock', rig);
  for (let i = 0; i < 7; i++) {
    const s = document.createElement('i');
    s.className = 'spark';
    const ang = (-160 + i * (140 / 6)) * Math.PI / 180;
    const d = 5 + Math.random() * 3;
    s.style.left = shock.offsetLeft + 'px';
    s.style.top = shock.offsetTop + 'px';
    const deg = ang * 180 / Math.PI + 90;
    rig.appendChild(s);
    s.animate([
      { transform: `translate(-50%,-100%) rotate(${deg}deg) translateY(-1em) scaleY(.2)`, opacity: 1 },
      { transform: `translate(-50%,-100%) rotate(${deg}deg) translateY(-${d}em) scaleY(1)`, opacity: 1, offset: .5 },
      { transform: `translate(-50%,-100%) rotate(${deg}deg) translateY(-${d + 2}em) scaleY(.1)`, opacity: 0 }],
      { duration: 480, easing: 'cubic-bezier(.2,.8,.3,1)' }).onfinish = () => s.remove();
  }
}

/* ================= TOAST ================= */
const verdicts = ['Order!', 'Sustained.', 'So ordered.', 'Objection overruled.', 'Motion granted.', 'Case closed.', 'Court is in session.', 'Admitted into evidence.'];
let vi = 0, toastT;
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg; t.classList.add('on');
  clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('on'), 1500);
}
const nextVerdict = () => verdicts[vi++ % verdicts.length];

/* ================= INTRO ================= */
// the intro plays on every visit, so always start from the top of the page
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
scrollTo(0, 0);

async function runIntro() {
  const intro = $('#intro');
  let done = false;
  const finish = () => {
    if (done) return; done = true;
    intro.classList.add('out');
    document.body.classList.remove('loading');
    setTimeout(startHero, 250);
    setTimeout(() => intro.remove(), 1100);
  };
  if (reduced) { intro.remove(); document.body.classList.remove('loading'); startHero(); return; }
  $('#intro-skip').addEventListener('click', finish);
  addEventListener('keydown', function k(e) { if (e.key === 'Enter' || e.key === 'Escape') { finish(); removeEventListener('keydown', k); } });

  const rig = $('.gavel-rig--intro'), stage = $('#intro-stage');
  await wait(450);
  for (let i = 0; i < 3 && !done; i++) {
    await strike(rig, {
      speed: i < 2 ? 1.25 : 1,
      onImpact: () => {
        stage.classList.remove('shake'); void stage.offsetWidth; stage.classList.add('shake');
        if (i === 2) $('#intro-word').classList.add('on');
      },
    });
  }
  await wait(650);
  finish();
}

/* ================= HERO ================= */
function startHero() {
  $('#top').classList.add('hero-ready');
  $('.hero-name').classList.add('in');
}

// scales of justice: balance follows the pointer, with a little spring
(function scales() {
  const beam = $('#beam'), pL = $('#panL'), pR = $('#panR');
  if (!beam) return;
  let target = 0, ang = 0, vel = 0, pointer = false, t0 = performance.now();
  addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    pointer = true; target = (e.clientX / innerWidth - 0.5) * 16;
  });
  document.addEventListener('pointerleave', () => (pointer = false));
  window.kickScales = (v = 3) => { vel += (Math.random() < .5 ? -1 : 1) * v; };
  let visible = true;
  new IntersectionObserver(([e]) => (visible = e.isIntersecting)).observe($('#statement'));
  function frame(now) {
    if (visible) {
      const tgt = pointer ? target : Math.sin((now - t0) / 1400) * 5;
      vel += (tgt - ang) * 0.02; vel *= 0.9; ang += vel;
      beam.style.transform = `rotate(${ang}deg)`;
      pL.style.transform = pR.style.transform = `rotate(${-ang}deg)`;
    }
    requestAnimationFrame(frame);
  }
  if (!reduced) requestAnimationFrame(frame);
})();

// the whole page trembles slightly when the gavel lands
function shakePage() {
  if (reduced) return;
  $('main').animate([
    { transform: 'translate(0,0)' }, { transform: 'translate(-3px,2px)' }, { transform: 'translate(3px,-2px)' },
    { transform: 'translate(-2px,1px)' }, { transform: 'translate(1px,-1px)' }, { transform: 'translate(0,0)' }],
    { duration: 380, easing: 'ease-out' });
}

$('#hero-gavel').addEventListener('click', (e) => {
  strike(e.currentTarget, { onImpact: () => { toast(nextVerdict()); shakePage(); } });
});

/* ================= MARQUEE ================= */
(function marquee() {
  const items = ['International Law', 'Human Rights', 'Crime of Aggression', 'International Security', 'Geopolitical Risk', 'Humanitarian Law', 'Accountability', 'Borders & Security', 'Empirical Court Studies'];
  const tr = $('#marquee-track');
  const html = items.map((s) => `<span>${s}</span><span class="sep">§</span>`).join('');
  tr.innerHTML = html + html + html;
  if (reduced) return;
  let x = 0, last = performance.now(), w = 0;
  const measure = () => (w = tr.scrollWidth / 3);
  measure(); addEventListener('resize', measure);
  document.fonts && document.fonts.ready.then(measure);
  (function loop(now) {
    const dt = Math.min(50, now - last); last = now;
    x -= dt * 0.04 * (1 + (window.scrollBoost || 0)); if (-x >= w) x += w;
    tr.style.transform = `translateX(${x}px)`;
    requestAnimationFrame(loop);
  })(last);
})();

/* ================= REVEAL + COUNTERS ================= */
const io = new IntersectionObserver((es) => es.forEach((e) => {
  if (!e.isIntersecting) return;
  e.target.classList.add('in'); io.unobserve(e.target);
  $$('[data-count]', e.target).forEach(countUp);
  if (e.target.matches('[data-count]')) countUp(e.target);
}), { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });
$$('[data-reveal]').forEach((el) => io.observe(el));

function countUp(el) {
  if (el._done) return; el._done = true;
  const to = parseFloat(el.dataset.count), dec = +(el.dataset.dec || 0);
  if (reduced) { el.textContent = to.toFixed(dec); return; }
  const t0 = performance.now(), dur = 1400;
  (function f(now) {
    const p = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - p, 3);
    el.textContent = (to * e).toFixed(dec);
    if (p < 1) requestAnimationFrame(f);
  })(t0);
}

/* ================= EXHIBITS: the gavel brings each one in ================= */
(function exhibits() {
  const rig = $('#exhibit-gavel'), cards = $$('#cards .card');
  cards.forEach((c) => c.style.setProperty('--r', (Math.random() * 10 - 5).toFixed(1) + 'deg'));
  let started = false;
  function land(c) {
    c.classList.add('landed');
    if (reduced) return;
    c.animate([
      { opacity: 0, transform: `translateY(-70px) scale(1.06) rotate(${c.style.getPropertyValue('--r')})` },
      { opacity: 1, transform: 'translateY(6px) scale(.99) rotate(0deg)', offset: .7 },
      { opacity: 1, transform: 'none' }],
      { duration: 420, easing: 'cubic-bezier(.5,0,.2,1)' });
  }
  async function bring() {
    for (const c of cards) {
      if (reduced) { land(c); continue; }
      await strike(rig, { speed: 1.5, onImpact: () => land(c) });
    }
  }
  new IntersectionObserver(([e], obs) => {
    if (e.isIntersecting && !started) { started = true; obs.disconnect(); bring(); }
  }, { threshold: 0.2 }).observe($('#cards'));
  rig.addEventListener('click', () => {
    strike(rig, { onImpact: () => {
      toast(nextVerdict());
      shakePage();
      if (reduced) return;
      cards.filter((c) => c.classList.contains('landed')).forEach((c, i) =>
        c.animate([{ transform: 'none' }, { transform: `translateY(-8px) rotate(${i % 2 ? 1 : -1}deg)` }, { transform: 'none' }],
          { duration: 360, delay: i * 30, easing: 'cubic-bezier(.3,.7,.3,1)' }));
    } });
  });
})();

/* ================= SCROLL: progress, nav, docket line, active link ================= */
(function scroll() {
  const bar = $('#progress-bar'), nav = $('#nav'), line = $('#docket-line i'), docket = $('.docket');
  const links = $$('.nav-links a'), secs = links.map((a) => $(a.getAttribute('href')));
  let lastY = scrollY, ticking = false;
  function update() {
    ticking = false;
    const y = scrollY, max = document.documentElement.scrollHeight - innerHeight;
    bar.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
    nav.classList.toggle('hide', y > lastY && y > 400);
    lastY = y;
    const r = docket.getBoundingClientRect();
    const p = Math.min(1, Math.max(0, (innerHeight * 0.65 - r.top) / r.height));
    line.style.transform = `scaleY(${p})`;
    let act = -1;
    secs.forEach((s, i) => { if (s && s.getBoundingClientRect().top < innerHeight * 0.4) act = i; });
    links.forEach((a, i) => a.classList.toggle('active', i === act));
  }
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  addEventListener('resize', update);
  update();
})();

/* ================= POLISH ================= */
const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;

// smooth, weighted scrolling (Lenis) + scroll velocity for the marquee
(function smooth() {
  if (reduced || !window.Lenis) return;
  const lenis = new Lenis({ duration: 1.15, easing: (t) => 1 - Math.pow(1 - t, 4), smoothWheel: true });
  window.lenis = lenis;
  lenis.on('scroll', (e) => { window.scrollBoost = Math.min(6, Math.abs(e.velocity) * 0.12); });
  (function raf(t) { lenis.raf(t); requestAnimationFrame(raf); })(performance.now());
  $$('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => {
    const t = $(a.getAttribute('href')); if (!t) return;
    e.preventDefault(); lenis.scrollTo(t, { offset: a.getAttribute('href') === '#top' ? 0 : -40 });
  }));
  document.body.classList.contains('loading') && lenis.stop();
  new MutationObserver(() => { if (!document.body.classList.contains('loading')) lenis.start(); })
    .observe(document.body, { attributes: true, attributeFilter: ['class'] });
})();

// headings come in word by word, from a soft blur
(function splitWords() {
  $$('[data-split]').forEach((el) => {
    let i = 0;
    const walk = (node) => [...node.childNodes].forEach((n) => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach((part) => {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
          const w = document.createElement('span'); w.className = 'w';
          const inner = document.createElement('span'); inner.textContent = part; inner.style.setProperty('--i', i++);
          w.appendChild(inner); frag.appendChild(w);
        });
        n.replaceWith(frag);
      } else if (n.nodeType === 1) walk(n);
    });
    walk(el);
    el.style.setProperty('--n', i);
    io.observe(el);
  });
})();

// soft custom cursor (desktop only)
(function cursor() {
  if (!finePointer || reduced) return;
  const dot = document.createElement('div'), ring = document.createElement('div');
  dot.className = 'cur-dot'; ring.className = 'cur-ring';
  document.body.append(dot, ring); document.body.classList.add('has-cursor');
  let x = innerWidth / 2, y = innerHeight / 2, rx = x, ry = y, shown = false;
  addEventListener('pointermove', (e) => {
    x = e.clientX; y = e.clientY;
    if (!shown) { shown = true; rx = x; ry = y; document.body.classList.add('cur-on'); }
  });
  document.addEventListener('pointerleave', () => { shown = false; document.body.classList.remove('cur-on'); });
  const hot = 'a,button,.card,.edu-item';
  document.addEventListener('pointerover', (e) => ring.classList.toggle('hot', !!e.target.closest(hot)));
  addEventListener('pointerdown', () => ring.classList.add('down'));
  addEventListener('pointerup', () => ring.classList.remove('down'));
  (function loop() {
    rx += (x - rx) * 0.18; ry += (y - ry) * 0.18;
    dot.style.transform = `translate(${x}px,${y}px)`;
    ring.style.transform = `translate(${rx}px,${ry}px)`;
    requestAnimationFrame(loop);
  })();
})();

// spotlight + gentle tilt on cards
(function cards() {
  if (!finePointer || reduced) return;
  $$('.card, .edu-item').forEach((c) => {
    c.addEventListener('pointermove', (e) => {
      const r = c.getBoundingClientRect(), px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
      c.style.setProperty('--mx', px * 100 + '%'); c.style.setProperty('--my', py * 100 + '%');
      if (c.classList.contains('card') && !c.classList.contains('landed')) return;
      c.style.transform = `perspective(900px) rotateX(${(0.5 - py) * 4}deg) rotateY(${(px - 0.5) * 5}deg) translateY(-4px)`;
    });
    c.addEventListener('pointerleave', () => { c.style.transform = ''; });
  });
})();

// portrait: follows the pointer in 3D, with a moving sheen on the glass
(function portraitTilt() {
  const p = $('#portrait'), frame = $('.portrait-frame');
  if (!p || !finePointer || reduced) return;
  let tx = 0, ty = 0, cx = 0, cy = 0, on = true;
  new IntersectionObserver(([e]) => (on = e.isIntersecting)).observe(p);
  addEventListener('pointermove', (e) => { tx = e.clientX / innerWidth - 0.5; ty = e.clientY / innerHeight - 0.5; });
  (function loop() {
    if (on) {
      cx += (tx - cx) * 0.06; cy += (ty - cy) * 0.06;
      frame.style.transform = `perspective(1100px) rotateY(${cx * 9}deg) rotateX(${-cy * 7}deg)`;
      frame.style.setProperty('--gx', 50 + cx * 120 + '%');
    }
    requestAnimationFrame(loop);
  })();
})();

// buttons lean towards the pointer
(function magnetic() {
  if (!finePointer || reduced) return;
  $$('.btn, .nav-cv').forEach((b) => {
    b.addEventListener('pointermove', (e) => {
      const r = b.getBoundingClientRect();
      b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.22}px, ${(e.clientY - r.top - r.height / 2) * 0.3}px)`;
    });
    b.addEventListener('pointerleave', () => { b.style.transform = ''; });
  });
})();

runIntro();
