'use strict';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

/* ================= GAVEL ================= */
const REST = 26, LIFT = 38, HIT = -3;
// a short wooden "knock", synthesised (only ever played after a click)
let actx;
function knock(vol = 0.5) {
  try {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    const t = actx.currentTime, len = 0.12;
    const buf = actx.createBuffer(1, actx.sampleRate * len, actx.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 6);
    const n = actx.createBufferSource(); n.buffer = buf;
    const bp = actx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 900; bp.Q.value = 1.4;
    const g1 = actx.createGain(); g1.gain.value = vol;
    n.connect(bp).connect(g1).connect(actx.destination); n.start(t);
    const o = actx.createOscillator(); o.type = 'sine';
    o.frequency.setValueAtTime(190, t); o.frequency.exponentialRampToValueAtTime(70, t + 0.15);
    const g2 = actx.createGain(); g2.gain.setValueAtTime(vol * 0.9, t); g2.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
    o.connect(g2).connect(actx.destination); o.start(t); o.stop(t + 0.2);
  } catch {}
}
function strike(rig, { onImpact, speed = 1, sound = false } = {}) {
  const g = $('.gavel:not(.ghost)', rig), ghosts = $$('.gavel.ghost', rig);
  if (rig._busy) return rig._busy;
  rig._busy = new Promise((resolve) => {
    if (reduced) { onImpact && onImpact(); impact(rig); rig._busy = null; return resolve(); }
    const a1 = g.animate([{ transform: `rotate(${REST}deg)` }, { transform: `rotate(${LIFT}deg)` }],
      { duration: 170 / speed, easing: 'cubic-bezier(.2,.8,.3,1)', fill: 'forwards' });
    a1.onfinish = () => {
      const dur = 110 / speed;
      ghosts.forEach((gh, i) => gh.animate(
        [{ transform: `rotate(${LIFT}deg)`, opacity: 0 }, { transform: `rotate(${(LIFT + HIT) / 2}deg)`, opacity: 0.28 - i * 0.12 }, { transform: `rotate(${HIT}deg)`, opacity: 0 }],
        { duration: dur + 40, delay: 18 * (i + 1), easing: 'cubic-bezier(.6,0,1,.6)' }));
      const a2 = g.animate([{ transform: `rotate(${LIFT}deg)` }, { transform: `rotate(${HIT}deg)` }],
        { duration: dur, easing: 'cubic-bezier(.6,0,1,.6)', fill: 'forwards' });
      a2.onfinish = () => {
        if (sound) knock();
        impact(rig);
        onImpact && onImpact();
        const a3 = g.animate([
          { transform: `rotate(${HIT}deg)` }, { transform: `rotate(${HIT + 9}deg)`, offset: .3 },
          { transform: `rotate(${HIT + 4}deg)`, offset: .55 }, { transform: `rotate(${REST}deg)` }],
          { duration: 520 / speed, easing: 'cubic-bezier(.3,.7,.3,1)', fill: 'forwards' });
        a3.onfinish = () => { a1.cancel(); a2.cancel(); a3.cancel(); rig._busy = null; resolve(); };
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
function seenIntro() { try { return sessionStorage.getItem('cc-intro') === '1'; } catch { return false; } }
function markIntro() { try { sessionStorage.setItem('cc-intro', '1'); } catch {} }

async function runIntro() {
  const intro = $('#intro');
  let done = false;
  const finish = () => {
    if (done) return; done = true; markIntro();
    intro.classList.add('out');
    document.body.classList.remove('loading');
    setTimeout(startHero, 250);
    setTimeout(() => intro.remove(), 1100);
  };
  if (reduced || seenIntro()) { intro.remove(); document.body.classList.remove('loading'); startHero(); return; }
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

$('#hero-gavel').addEventListener('click', (e) => {
  strike(e.currentTarget, { sound: true, onImpact: () => {
    toast(nextVerdict());
    const st = $('.portrait-stamp'); st.classList.remove('on'); void st.offsetWidth; st.classList.add('on');
    const p = $('#portrait'); p.classList.remove('shake'); void p.offsetWidth; p.classList.add('shake');
  } });
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
    x -= dt * 0.04; if (-x >= w) x += w;
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
    strike(rig, { sound: true, onImpact: () => {
      toast(nextVerdict());
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

runIntro();
