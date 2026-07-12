// ===== Theme toggle (dark / light) =====
const root = document.documentElement;
const savedTheme = localStorage.getItem('dbiz-theme');
if (savedTheme) root.setAttribute('data-theme', savedTheme);
document.getElementById('themeToggle').addEventListener('click', () => {
  const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  root.setAttribute('data-theme', next);
  localStorage.setItem('dbiz-theme', next);
});

// ===== Header shadow on scroll =====
const header = document.getElementById('header');
window.addEventListener('scroll', () => {
  header.classList.toggle('scrolled', window.scrollY > 20);
});

// ===== Mobile menu =====
const toggle = document.getElementById('menuToggle');
const nav = document.getElementById('nav');
toggle.addEventListener('click', () => {
  nav.classList.toggle('open');
  toggle.classList.toggle('open');
});
nav.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    nav.classList.remove('open');
    toggle.classList.remove('open');
  });
});

// ===== Reveal on scroll =====
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      entry.target.style.transitionDelay = `${(i % 4) * 90}ms`;
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

// ===== Marquees: duplicate each lane so the loop has no seam =====
document.querySelectorAll('.marquee-lane').forEach((lane) => {
  lane.innerHTML += lane.innerHTML;
});

// ===== Testimonials carousel =====
const quotes = document.getElementById('quotes');
const dotsBox = document.getElementById('carDots');
const prevBtn = document.getElementById('carPrev');
const nextBtn = document.getElementById('carNext');
// In RTL the scroll offset runs negative, so work in absolute distance and flip on the way out.
const rtlSign = getComputedStyle(quotes).direction === 'rtl' ? -1 : 1;

const step = () => {
  const card = quotes.querySelector('.quote');
  const gap = parseFloat(getComputedStyle(quotes).columnGap) || 0;
  return card.getBoundingClientRect().width + gap;
};
const maxScroll = () => quotes.scrollWidth - quotes.clientWidth;
const pageCount = () => Math.max(1, Math.ceil(quotes.scrollWidth / quotes.clientWidth));
const scrollable = () => maxScroll() > 4;

// Dots track progress along the scrollable range, not multiples of the viewport width:
// the last page is usually a partial one, so page * clientWidth never reaches the end.
const currentPage = () => {
  const max = maxScroll();
  if (max <= 0) return 0;
  return Math.round((Math.abs(quotes.scrollLeft) / max) * (pageCount() - 1));
};

const goTo = (page) => {
  const pages = pageCount() - 1;
  const target = pages > 0 ? (page / pages) * maxScroll() : 0;
  quotes.scrollTo({ left: rtlSign * target, behavior: 'smooth' });
};

const buildDots = () => {
  dotsBox.innerHTML = '';
  dotsBox.hidden = !scrollable();
  for (let i = 0; scrollable() && i < pageCount(); i++) {
    const dot = document.createElement('button');
    dot.className = 'car-dot';
    dot.setAttribute('aria-label', `עבור להמלצה ${i + 1}`);
    dot.addEventListener('click', () => goTo(i));
    dotsBox.appendChild(dot);
  }
  syncControls();
};

const syncControls = () => {
  const has = scrollable();
  prevBtn.hidden = nextBtn.hidden = !has;
  if (!has) return;
  const pos = Math.abs(quotes.scrollLeft);
  prevBtn.disabled = pos < 8;
  nextBtn.disabled = pos >= maxScroll() - 8;
  const page = currentPage();
  [...dotsBox.children].forEach((d, i) => d.classList.toggle('active', i === page));
};

prevBtn.addEventListener('click', () => quotes.scrollBy({ left: -rtlSign * step(), behavior: 'smooth' }));
nextBtn.addEventListener('click', () => quotes.scrollBy({ left: rtlSign * step(), behavior: 'smooth' }));
quotes.addEventListener('scroll', () => {
  clearTimeout(quotes._t);
  quotes._t = setTimeout(syncControls, 90);
});
window.addEventListener('resize', buildDots);
buildDots();

// ===== Contact form → Make webhook =====
const WEBHOOK_URL = 'https://hook.eu2.make.com/0fw2nh2spvtsxqtujz3ph4hrm9rum67z';
const form = document.getElementById('contactForm');
const note = document.getElementById('formNote');
const submitBtn = form.querySelector('button');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = form.name.value.trim();
  const phone = form.phone.value.trim();
  if (!name || !phone) {
    alert('אנא מלאו שם וטלפון כדי שאוכל לחזור אליכם 🙂');
    return;
  }

  const payload = {
    name,
    phone,
    email: form.email.value.trim(),
    message: form.message.value.trim(),
    source: 'DBIZ Landing Page',
    submittedAt: new Date().toISOString(),
  };

  submitBtn.disabled = true;
  submitBtn.textContent = 'שולח...';

  try {
    const res = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    // fetch only rejects on network failure, so a 4xx/5xx from Make must be caught here
    if (!res.ok) throw new Error(`webhook responded ${res.status}`);

    note.hidden = false;
    submitBtn.textContent = 'נשלח ✓';
    form.reset();
  } catch (err) {
    alert('אופס, משהו השתבש בשליחה. אפשר גם להתקשר: 052-710-1136');
    submitBtn.textContent = 'שליחה';
  } finally {
    setTimeout(() => {
      note.hidden = true;
      submitBtn.disabled = false;
      submitBtn.textContent = 'שליחה';
    }, 5000);
  }
});

// ===== Year =====
document.getElementById('year').textContent = new Date().getFullYear();
