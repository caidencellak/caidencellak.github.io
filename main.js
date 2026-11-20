'use strict';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
document.documentElement.classList.add('js');

/* quiet fade-in of each section */
const secs = $$('.sec');
const io = new IntersectionObserver((es) => es.forEach((e) => {
  if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
}), { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
secs.forEach((s) => io.observe(s));

/* highlight the section being read in the side menu */
const links = $$('.toc a');
function setActive() {
  let cur = secs[0].id;
  const line = innerHeight * 0.3;
  secs.forEach((s) => { if (s.getBoundingClientRect().top <= line) cur = s.id; });
  if (innerHeight + scrollY >= document.documentElement.scrollHeight - 4) cur = secs[secs.length - 1].id;
  links.forEach((a) => {
    const on = a.getAttribute('href') === '#' + cur;
    a.classList.toggle('active', on);
    if (on && a.parentElement.scrollWidth > a.parentElement.clientWidth) {
      const p = a.parentElement;
      p.scrollTo({ left: a.offsetLeft - p.clientWidth / 2 + a.clientWidth / 2, behavior: 'smooth' });
    }
  });
}
let ticking = false;
addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(() => { ticking = false; setActive(); }); } }, { passive: true });
addEventListener('resize', setActive);
setActive();

/* toast */
let tt;
function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.classList.add('on');
  clearTimeout(tt); tt = setTimeout(() => t.classList.remove('on'), 1600);
}

/* copy email */
$('#copy-email').addEventListener('click', async (e) => {
  const email = e.currentTarget.dataset.email;
  try { await navigator.clipboard.writeText(email); toast('Email address copied'); }
  catch { toast(email); }
});

/* light / dark */
$('#theme').addEventListener('click', () => {
  const root = document.documentElement;
  const dark = root.dataset.theme ? root.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
  root.dataset.theme = dark ? 'light' : 'dark';
  try { localStorage.setItem('cc-theme', root.dataset.theme); } catch {}
});
