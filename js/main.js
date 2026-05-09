/* ============================================================
   THE DOL METHOD — Shared JS
   ============================================================ */

/* ── NAV MOBILE TOGGLE ───────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {

  const toggle = document.querySelector('.nav-toggle');
  const links  = document.querySelector('.nav-links');
  if (toggle && links) {
    toggle.addEventListener('click', () => {
      links.classList.toggle('mobile-open');
      const spans = toggle.querySelectorAll('span');
      const open  = links.classList.contains('mobile-open');
      spans[0].style.transform = open ? 'rotate(45deg) translate(5px, 5px)' : '';
      spans[1].style.opacity   = open ? '0' : '1';
      spans[2].style.transform = open ? 'rotate(-45deg) translate(5px, -5px)' : '';
    });
    document.addEventListener('click', e => {
      if (!e.target.closest('nav')) links.classList.remove('mobile-open');
    });
  }

  /* ── ACTIVE NAV LINK ─────────────────────────────────── */
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(a => {
    const href = a.getAttribute('href');
    if (href === currentPath || (currentPath === '' && href === 'index.html')) {
      a.classList.add('active');
    }
  });

  /* ── SCROLL REVEAL ───────────────────────────────────── */
  const revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('in');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.10 });
    revealEls.forEach(el => io.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add('in'));
  }

  /* ── ACCORDION (faq-item and accordion-item variants) ── */
  function initAccordion(selector) {
    document.querySelectorAll(selector).forEach(item => {
      const q = item.querySelector('.faq-q, .accordion-q');
      if (!q) return;
      q.addEventListener('click', () => {
        const isOpen = item.classList.contains('open');
        document.querySelectorAll(selector + '.open').forEach(o => o.classList.remove('open'));
        if (!isOpen) item.classList.add('open');
      });
    });
  }
  initAccordion('.faq-item');
  initAccordion('.accordion-item');

  /* ── STAT COUNTER ANIMATION ──────────────────────────── */
  function animateCounter(el) {
    const target = parseFloat(el.dataset.target);
    const isFloat = String(target).includes('.');
    const prefix  = el.dataset.prefix  || '';
    const suffix  = el.dataset.suffix  || '';
    const duration = 1800;
    let start = null;
    function step(ts) {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      const val = target * ease;
      el.textContent = prefix + (isFloat ? val.toFixed(1) : Math.floor(val)) + suffix;
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  const counterEls = document.querySelectorAll('[data-counter]');
  if (counterEls.length) {
    const cio = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          animateCounter(e.target);
          cio.unobserve(e.target);
        }
      });
    }, { threshold: 0.5 });
    counterEls.forEach(el => cio.observe(el));
  }

  /* ── ECG ANIMATION ───────────────────────────────────── */
  const ecgPath = document.getElementById('ecg-path');
  if (ecgPath) {
    const len = ecgPath.getTotalLength();
    ecgPath.style.strokeDasharray  = len;
    ecgPath.style.strokeDashoffset = len;
    ecgPath.style.transition = 'stroke-dashoffset 2.4s cubic-bezier(0.4,0,0.2,1) 0.5s';
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        ecgPath.style.strokeDashoffset = '0';
      });
    });
  }

  /* ── FORM SUBMIT (no-op demo) ────────────────────────── */
  document.querySelectorAll('.lead-form').forEach(form => {
    form.addEventListener('submit', e => {
      e.preventDefault();
      const btn = form.querySelector('button[type="submit"]');
      const originalText = btn.textContent;
      btn.textContent = '✓ Enviado';
      btn.style.background = '#22c55e';
      btn.style.color = '#fff';
      btn.disabled = true;
      setTimeout(() => {
        btn.textContent = originalText;
        btn.style.background = '';
        btn.style.color = '';
        btn.disabled = false;
        form.reset();
      }, 3000);
    });
  });

});
