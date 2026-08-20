// Scroll reveal — every section animates in when it enters the viewport
const revealTargets = document.querySelectorAll(
  '.section, .hero__panel, .cta__inner, .footer__inner'
);

// ?noanim — headless screenshot mode: render everything visible, no transitions
const noAnim = new URLSearchParams(location.search).has('noanim');
if (noAnim) {
  document.documentElement.style.setProperty('scroll-behavior', 'auto');
} else {
  revealTargets.forEach((el) => el.classList.add('reveal'));

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
  );
  revealTargets.forEach((el) => observer.observe(el));
}

// Nav border on scroll
const nav = document.getElementById('nav');
const onScroll = () => nav.classList.toggle('is-scrolled', window.scrollY > 8);
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

// Mobile menu
const toggle = document.getElementById('navToggle');
const links = document.getElementById('navLinks');
toggle.addEventListener('click', () => {
  const open = links.classList.toggle('is-open');
  toggle.setAttribute('aria-expanded', String(open));
});
links.querySelectorAll('a').forEach((a) =>
  a.addEventListener('click', () => {
    links.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
  })
);
