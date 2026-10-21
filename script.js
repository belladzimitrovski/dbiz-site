// ===== Theme toggle (dark / light) =====
const root = document.documentElement;
const savedTheme = localStorage.getItem('dbiz-theme-v2');
if (savedTheme) root.setAttribute('data-theme', savedTheme);
document.getElementById('themeToggle').addEventListener('click', () => {
  const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  root.setAttribute('data-theme', next);
  localStorage.setItem('dbiz-theme-v2', next);
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

// ===== Hero cases: "הם" / "אתם" stay fixed; type the rest of each line, erase it, swap the picture, repeat =====
const CASES = [
  ['רואים כסאות.', 'רואים את מה שנופל ביניהם.'],
  ['רואים לחם.', 'רואים רק את הקשה.'],
  ['רואים מכשירי כושר.', 'רואים שעות של זיעה ומאמץ.'],
  ['רואים שעוני יוקרה.', 'רואים את הזמן נוזל בין האצבעות.'],
];
const themEl = document.getElementById('caseThem');
const youEl = document.getElementById('caseYou');
const caseImgs = [...document.querySelectorAll('.stage-img')];
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const wait = (ms) => new Promise(r => setTimeout(r, ms));

// Smooth typing: the whole sentence is laid out from the start (the untyped part is an
// invisible ghost), so lines never re-wrap or jump; letters are revealed on animation frames.
const prepLine = (el, text) => {
  const on = document.createElement('span');
  const ghost = document.createElement('span');
  on.className = 'on';
  ghost.className = 'ghost';
  ghost.textContent = text;
  el.replaceChildren(on, ghost);
  el._chars = Array.from(text);
  el._shown = 0;
};

const showChars = (el, n) => {
  if (n === el._shown) return;
  el._shown = n;
  el.firstChild.textContent = el._chars.slice(0, n).join('');
  el.lastChild.textContent = el._chars.slice(n).join('');
};

// Reveal (or hide) letters at a steady rate in letters per second
const animateChars = (el, from, to, perSecond) => new Promise((resolve) => {
  el.classList.add('typing');
  const start = performance.now();
  const total = Math.abs(to - from);
  const step = (now) => {
    const done = Math.min(total, Math.floor(((now - start) / 1000) * perSecond));
    showChars(el, from < to ? from + done : from - done);
    if (done < total) requestAnimationFrame(step);
    else { el.classList.remove('typing'); resolve(); }
  };
  requestAnimationFrame(step);
});

const typeInto = (el, perSecond) => animateChars(el, 0, el._chars.length, perSecond);
const eraseFrom = (el, perSecond) => animateChars(el, el._shown, 0, perSecond);

const playCases = async () => {
  for (let i = 0; ; i = (i + 1) % CASES.length) {
    const [them, you] = CASES[i];
    caseImgs.forEach((img, n) => img.classList.toggle('active', n === i));
    prepLine(themEl, them);
    prepLine(youEl, you);
    if (reduceMotion) {
      showChars(themEl, themEl._chars.length);
      showChars(youEl, youEl._chars.length);
      await wait(4000);
      continue;
    }
    await typeInto(themEl, 30);
    await wait(150);
    await typeInto(youEl, 34);
    await wait(1500);
    // Both lines are erased together, quickly
    await Promise.all([eraseFrom(youEl, 90), eraseFrom(themEl, 90)]);
    await wait(80);
  }
};
playCases();

// ===== Robot bubbles "talk": each .tl line is typed in turn =====
// The untyped rest of a line sits in an invisible ghost span, so the bubble never changes size.
const prepBubble = (bubble) => [...bubble.querySelectorAll('.tl')].map((line) => {
  const chars = Array.from(line.textContent); // keeps emoji whole
  const on = document.createElement('span');
  const ghost = document.createElement('span');
  ghost.className = 'tl-ghost';
  ghost.textContent = chars.join('');
  line.replaceChildren(on, ghost);
  return { on, ghost, chars, pause: +(line.dataset.pause || 0) };
});

const talk = async (bubble, lines) => {
  if (bubble._talking) return;
  bubble._talking = true;
  await wait(650); // let the bubble pop in first
  for (const { on, ghost, chars, pause } of lines) {
    await wait(pause);
    for (let i = 1; i <= chars.length; i++) {
      on.textContent = chars.slice(0, i).join('');
      ghost.textContent = chars.slice(i).join('');
      await wait(45);
    }
  }
  const after = bubble.dataset.after && document.getElementById(bubble.dataset.after);
  if (after) after.classList.add('shown');
};

const bubbleObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    bubbleObserver.unobserve(entry.target);
    talk(entry.target, entry.target._lines);
  });
}, { threshold: 0.6 });

document.querySelectorAll('.bubble').forEach((bubble) => {
  if (reduceMotion) {
    const after = bubble.dataset.after && document.getElementById(bubble.dataset.after);
    if (after) after.classList.add('shown');
    return;
  }
  bubble._lines = prepBubble(bubble);
  // The post-send robot talks when it appears, not on scroll
  if (!bubble.closest('.form-robot')) bubbleObserver.observe(bubble);
});

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

// ===== Contact form → Make webhook + email (Resend, via the serverless function in api/contact.js) =====
const WEBHOOK_URL = 'https://hook.eu2.make.com/0fw2nh2spvtsxqtujz3ph4hrm9rum67z';
// The Vercel deployment of this repo; update if Vercel gives the project a different address
const EMAIL_API_URL = 'https://dbiz-site.vercel.app/api/contact';
const form = document.getElementById('contactForm');
const note = document.getElementById('formNote');
const submitBtn = form.querySelector('button');
const submitLabel = submitBtn.textContent;

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
    website: form.website.value, // spam trap, empty for real people
  };

  submitBtn.disabled = true;
  submitBtn.textContent = 'שולח...';

  try {
    // Send to both at once; the enquiry counts as sent if either one gets it
    const post = (url) => fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).then((res) => {
      // fetch only rejects on network failure, so a 4xx/5xx must be caught here
      if (!res.ok) throw new Error(`${url} responded ${res.status}`);
    });
    const results = await Promise.allSettled([post(WEBHOOK_URL), post(EMAIL_API_URL)]);
    results.filter((r) => r.status === 'rejected').forEach((r) => console.warn(r.reason));
    if (results.every((r) => r.status === 'rejected')) throw new Error('both destinations failed');

    note.hidden = false;
    const sentBubble = note.querySelector('.bubble');
    if (sentBubble._lines) {
      sentBubble._talking = false;
      sentBubble._lines.forEach(({ on, ghost, chars }) => { on.textContent = ''; ghost.textContent = chars.join(''); });
      talk(sentBubble, sentBubble._lines);
    }
    submitBtn.textContent = 'נשלח ✓';
    form.reset();
  } catch (err) {
    alert('אופס, משהו השתבש בשליחה. אפשר גם להתקשר: 052-710-1136');
    submitBtn.textContent = submitLabel;
  } finally {
    setTimeout(() => {
      note.hidden = true;
      submitBtn.disabled = false;
      submitBtn.textContent = submitLabel;
    }, 9000);
  }
});

// ===== Year =====
document.getElementById('year').textContent = new Date().getFullYear();
