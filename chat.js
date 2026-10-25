/* DBIZ question-and-answer chat: the robot answers common questions with ready answers.
   No AI and no server: the answers are below. "Another question" sends name, phone and
   question to the inbox (FormSubmit) and to the Make webhook, like the contact form. */
(function () {
  'use strict';

  // ===== The questions and answers (edit freely; \n starts a new line) =====
  const QA = [
    { q: 'מה זה בעצם אוטומציה לעסק?',
      a: 'אוטומציה שנבנתה לפי הצורך המדויק שלכם.\nמערכת אחת, פשוטה, נוחה וברורה, שממירה את עשרות התיקיות, האקסלים והתזכורות במערכת אחת חכמה - שפשוט עובדת.' },
    { q: 'מה יוצא לי מזה?',
      a: 'הלידים מטופלים מיד ובאופן אישי, בלי שאף לקוח יתפספס.\nהגבייה והתשלומים זורמים מעצמם.\nהתמונה הכללית ברורה - מצב העסק עומד מולכם בכל רגע נתון.\nוהראש שלכם מתפנה סוף סוף מכל אלפי הפרטים הקטנים - לדברים הגדולים באמת.' },
    { q: 'מה אפשר לחבר למערכת?',
      a: 'אינסוף אפשרויות במערכת אחת: מערכת דיוור, צירוף קבצים, הצעות מחיר, סליקה, קבלות, ניהול יומן, טפסים חכמים, שימור ומעקב לידים, מערכות טלפוניות, צ׳אטבוטים חכמים, מערכות CRM וסנכרון בין מערכות.' },
    { q: 'איך זה עובד?',
      a: 'ארבע נקודות פשוטות:\n1. נקודת תצפית - פגישת עומק שבה לומדים את תהליכי העבודה וממפים את הצרכים.\n2. נקודה למחשבה - אני מחברת את הנקודות ומביאה פתרונות חדשים ויצירתיים עבור העסק שלכם.\n3. נקודת זינוק - המערכת המותאמת עולה לאוויר, והעסק מזנק בסיעתא דשמיא!\n4. נקודה חמה - ליווי, תיקונים ושיפורים גם הרבה אחרי.' },
    { q: 'למה דווקא את?',
      a: 'בגלל ההתאמה. האישית.\nלכל עסק יש תהליך עבודה משלו, אפיון לקוח שונה וצרכים ייחודיים. אצלי לא תמצאו אוטומציות מוצעות למכירה על המדף - אתם מקבלים מערכת שנתפרה לפי מידות העסק שלכם בדיוק.' },
    { q: 'זה מסובך לתפעול?',
      a: 'ממש לא. אני מארגנת תכנים, מצמצמת תפריטים, ובונה לכם ממשק ידידותי למשתמש וקל לתפעול.\nכל כך קל, גם לכאלה שעדיין לא למדו לקרוא בלי נקודות...' },
    { q: 'ומה קורה אחרי שהמערכת עולה?',
      a: 'ערוץ הקשר נשאר פתוח גם הרבה אחרי שהמערכת עולה לאוויר. אני כאן לצידכם, זמינה לתיקונים, לשיפורים ולליווי מקיף עד שהעסק שלכם יתחיל לעבוד. נקודה.' },
    { q: 'עם אילו כלים את עובדת?',
      a: 'בין השאר Make, Origami, Fireberry, Zoho, Airtable, n8n, Claude ו־SUMIT.\nבעזרת ידע טכנולוגי, היכרות עם כלי AI מתקדמים, פיצ\'רים חדשניים וחשיבה יצירתית אני מוצאת את הדרך לפתור כל צורך ייחודי שהעסק שלכם מבקש.' },
    { q: 'כמה זה עולה?',
      a: 'כל מערכת נתפרת לפי העסק, ולכן גם המחיר. בפגישת האפיון נבין יחד מה העסק שלכם צריך, ואז אוכל לתת הצעה מדויקת.' },
    { q: 'איך מתחילים?',
      a: 'קובעים פגישת אפיון - נקודת תצפית על העסק שלכם.\nאפשר להשאיר פרטים כאן בצ\'אט או בטופס למטה, או להתקשר: 052-710-1136.',
      cta: true },
  ];
  const HELLO = 'היי! אני הרובוט של DBIZ 😊\nעל מה תרצו לשאול?';
  const MAIL_URL = 'https://formsubmit.co/ajax/b7101136@gmail.com';
  const WEBHOOK_URL = 'https://hook.eu2.make.com/0fw2nh2spvtsxqtujz3ph4hrm9rum67z';
  const ROBOT = 'img/robot-hello-3d.png';

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const css = `
  .dc-btn { position: fixed; z-index: 80; left: max(16px, calc(env(safe-area-inset-left, 0px) + 16px)); bottom: calc(env(safe-area-inset-bottom, 0px) + 18px);
    width: 66px; height: 66px; border-radius: 50%; border: 2px solid #14211f; background: #ffffff; box-shadow: 4px 4px 0 #1fb5b0; cursor: pointer; padding: 0;
    display: grid; place-items: center; overflow: hidden; transition: transform .25s cubic-bezier(.34,1.56,.64,1); }
  .dc-btn:hover { transform: translateY(-3px) rotate(-4deg); }
  .dc-btn img { width: 54px; height: 54px; object-fit: cover; object-position: 50% 12%; }
  .dc-btn::after { content: ""; position: absolute; top: 6px; right: 6px; width: 13px; height: 13px; border-radius: 50%; background: #ffd84d; border: 2px solid #14211f; }
  .dc-btn.open::after, .dc-btn.seen::after { display: none; }
  .dc-tip { position: fixed; z-index: 80; left: max(96px, calc(env(safe-area-inset-left, 0px) + 96px)); bottom: calc(env(safe-area-inset-bottom, 0px) + 32px);
    background: #fff; color: #14211f; border: 2px solid #14211f; border-radius: 16px 16px 16px 4px; padding: 7px 14px; font: 600 15px Heebo, Arial, sans-serif;
    box-shadow: 3px 3px 0 #14211f; direction: rtl; opacity: 0; transform: translateY(8px); transition: opacity .3s, transform .3s; pointer-events: none; }
  .dc-tip.on { opacity: 1; transform: none; }
  .dc-panel { position: fixed; z-index: 81; left: max(16px, calc(env(safe-area-inset-left, 0px) + 16px)); bottom: calc(env(safe-area-inset-bottom, 0px) + 98px);
    width: min(370px, calc(100vw - 32px)); height: min(560px, calc(100vh - 130px)); background: #fbfaf5; border: 2px solid #14211f; border-radius: 22px;
    box-shadow: 6px 6px 0 #1fb5b0; display: flex; flex-direction: column; overflow: hidden; direction: rtl; font-family: Heebo, Arial, sans-serif; color: #14211f;
    transform-origin: 10% 100%; transition: opacity .25s, transform .3s cubic-bezier(.34,1.56,.64,1); }
  .dc-panel[hidden] { display: flex !important; opacity: 0; transform: scale(.85) translateY(14px); pointer-events: none; visibility: hidden; }
  .dc-head { display: flex; align-items: center; gap: 10px; padding: 12px 14px; background: #14211f; color: #fbfaf5; }
  .dc-head img { width: 40px; height: 40px; border-radius: 50%; background: #fff; object-fit: cover; object-position: 50% 12%; }
  .dc-head b { display: block; font-family: Fredoka, Heebo, sans-serif; font-weight: 600; font-size: 17px; }
  .dc-head span { font-size: 13px; opacity: .75; }
  .dc-x { margin-inline-start: auto; width: 34px; height: 34px; border-radius: 50%; border: 0; background: rgba(255,255,255,.12); color: #fff; font-size: 20px; line-height: 1; cursor: pointer; }
  .dc-x:hover { background: rgba(255,255,255,.22); }
  .dc-log { flex: 1; overflow-y: auto; padding: 16px 14px 8px; display: flex; flex-direction: column; gap: 10px; }
  .dc-msg { max-width: 86%; padding: 9px 13px; border-radius: 16px; font-size: 15px; line-height: 1.55; white-space: pre-line; animation: dcIn .3s ease both; }
  .dc-bot { align-self: flex-start; background: #fff; border: 1.5px solid #14211f; border-start-start-radius: 4px; }
  .dc-me { align-self: flex-end; background: #1fb5b0; color: #fff; border-start-end-radius: 4px; font-weight: 500; }
  .dc-typing { align-self: flex-start; display: flex; gap: 5px; padding: 12px 14px; background: #fff; border: 1.5px solid #14211f; border-radius: 16px; border-start-start-radius: 4px; }
  .dc-typing i { width: 7px; height: 7px; border-radius: 50%; background: #1fb5b0; animation: dcDot 1s infinite; }
  .dc-typing i:nth-child(2) { animation-delay: .15s; background: #ffd84d; } .dc-typing i:nth-child(3) { animation-delay: .3s; background: #14211f; }
  @keyframes dcDot { 0%, 80%, 100% { transform: translateY(0); opacity: .5; } 40% { transform: translateY(-5px); opacity: 1; } }
  @keyframes dcIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
  .dc-chips { display: flex; flex-wrap: wrap; gap: 7px; padding: 8px 14px 14px; border-top: 1px solid rgba(20,33,31,.12); max-height: 36%; overflow-y: auto; }
  .dc-chip { font: 500 14px Heebo, Arial, sans-serif; color: #14211f; background: #fff; border: 1.5px solid #14211f; border-radius: 999px; padding: 6px 12px; cursor: pointer; text-align: right; }
  .dc-chip:hover { background: #ffd84d; }
  .dc-chip.other { border-style: dashed; }
  .dc-chip.go { background: #14211f; color: #fff; }
  .dc-form { align-self: stretch; display: grid; gap: 8px; background: #fff; border: 1.5px solid #14211f; border-radius: 16px; padding: 12px; animation: dcIn .3s ease both; }
  .dc-form input, .dc-form textarea { width: 100%; font: 15px Heebo, Arial, sans-serif; color: #14211f; border: 0; border-bottom: 2px solid rgba(20,33,31,.18); padding: 6px 2px; background: transparent; resize: none; }
  .dc-form input:focus, .dc-form textarea:focus { outline: none; border-bottom-color: #1fb5b0; }
  .dc-form button { font: 700 15px Heebo, Arial, sans-serif; background: #14211f; color: #fff; border: 0; border-radius: 999px; padding: 10px; cursor: pointer; }
  .dc-form .err { color: #b3261e; font-size: 13px; font-weight: 600; }
  .dc-hp { position: absolute; left: -9999px; width: 1px; height: 1px; overflow: hidden; }
  .dc-btn:focus-visible, .dc-chip:focus-visible, .dc-x:focus-visible, .dc-form button:focus-visible { outline: 3px solid #1fb5b0; outline-offset: 2px; }
  @media (prefers-reduced-motion: reduce) { .dc-btn, .dc-tip, .dc-panel, .dc-msg, .dc-form, .dc-typing i { transition: none !important; animation: none !important; } }
  `;

  const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
  const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  const style = el('style'); style.textContent = css; document.head.appendChild(style);

  const btn = el('button', 'dc-btn', `<img src="${ROBOT}" alt="">`);
  btn.type = 'button'; btn.setAttribute('aria-label', 'צ\'אט שאלות ותשובות'); btn.setAttribute('aria-expanded', 'false'); btn.setAttribute('aria-controls', 'dcPanel');
  const tip = el('p', 'dc-tip', 'יש שאלה? אני פה 😊'); tip.setAttribute('aria-hidden', 'true');
  const panel = el('section', 'dc-panel'); panel.id = 'dcPanel'; panel.hidden = true; panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-label', 'שאלות ותשובות');
  panel.innerHTML = `<header class="dc-head"><img src="${ROBOT}" alt=""><div><b>הרובוט של DBIZ</b><span>עונה על שאלות נפוצות</span></div><button type="button" class="dc-x" aria-label="סגירה">×</button></header>
    <div class="dc-log" aria-live="polite"></div><div class="dc-chips"></div>`;
  document.body.append(btn, tip, panel);
  const log = panel.querySelector('.dc-log'), chips = panel.querySelector('.dc-chips');

  const asked = new Set();
  let busy = false, started = false;
  const scroll = () => { log.scrollTop = log.scrollHeight; };
  const wait = (ms) => new Promise((r) => setTimeout(r, reduce ? 0 : ms));

  async function botSay(text) {
    const t = el('div', 'dc-typing', '<i></i><i></i><i></i>'); log.appendChild(t); scroll();
    await wait(Math.min(1100, 380 + text.length * 6));
    t.remove();
    log.appendChild(el('div', 'dc-msg dc-bot', esc(text))); scroll();
  }
  function meSay(text) { log.appendChild(el('div', 'dc-msg dc-me', esc(text))); scroll(); }

  function renderChips() {
    chips.innerHTML = '';
    QA.forEach((item, i) => {
      if (asked.has(i)) return;
      const c = el('button', 'dc-chip', esc(item.q)); c.type = 'button';
      c.addEventListener('click', () => ask(i)); chips.appendChild(c);
    });
    const other = el('button', 'dc-chip other', 'שאלה אחרת? השאירו פרטים'); other.type = 'button';
    other.addEventListener('click', openForm); chips.appendChild(other);
  }

  async function ask(i) {
    if (busy) return; busy = true;
    const item = QA[i]; asked.add(i); renderChips();
    meSay(item.q);
    await botSay(item.a);
    if (item.cta) {
      const go = el('button', 'dc-chip go', 'להשאיר פרטים עכשיו'); go.type = 'button';
      go.addEventListener('click', () => { go.remove(); openForm(); });
      log.appendChild(go); scroll();
    }
    busy = false;
  }

  async function openForm() {
    if (busy || panel.querySelector('.dc-form')) return; busy = true;
    meSay('יש לי שאלה אחרת');
    await botSay('בשמחה! השאירו שם וטלפון, ובלי תחזור אליכם בהקדם.');
    const f = el('form', 'dc-form');
    f.innerHTML = `<input name="name" placeholder="שם" autocomplete="name" aria-label="שם">
      <input name="phone" type="tel" placeholder="טלפון" autocomplete="tel" aria-label="טלפון">
      <textarea name="question" rows="2" placeholder="מה רציתם לשאול?" aria-label="השאלה"></textarea>
      <p class="dc-hp" aria-hidden="true"><input name="website" tabindex="-1" autocomplete="off"></p>
      <button type="submit">שליחה</button><p class="err" hidden></p>`;
    log.appendChild(f); scroll(); f.elements.name.focus();
    f.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = f.elements.name.value.trim(), phone = f.elements.phone.value.trim(), question = f.elements.question.value.trim();
      const err = f.querySelector('.err'); err.hidden = true;
      if (!name || !phone) { err.textContent = 'צריך שם וטלפון כדי שבלי תוכל לחזור אליכם 🙂'; err.hidden = false; return; }
      const sendBtn = f.querySelector('button'); sendBtn.disabled = true; sendBtn.textContent = 'שולח...';
      const bot = f.elements.website.value !== '';
      const check = (r) => { if (!r.ok) throw new Error(r.status); };
      const toMail = bot ? Promise.resolve() : fetch(MAIL_URL, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ 'שם': name, 'טלפון': phone, 'השאלה': question || '-', _subject: 'שאלה מהצ\'אט באתר: ' + name, _template: 'table', _captcha: 'false' }) }).then(check);
      const toMake = bot ? Promise.resolve() : fetch(WEBHOOK_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, email: '', message: question, source: 'DBIZ Chat', submittedAt: new Date().toISOString(), website: '' }) }).then(check);
      const res = await Promise.allSettled([toMail, toMake]);
      if (res.every((r) => r.status === 'rejected')) {
        err.textContent = 'אופס, משהו השתבש. אפשר גם להתקשר: 052-710-1136'; err.hidden = false;
        sendBtn.disabled = false; sendBtn.textContent = 'שליחה'; return;
      }
      f.remove(); meSay(name + ', ' + phone);
      await botSay('קיבלתי! 🎉\nבלי תחזור אליכם בהקדם. אני כבר אסדר את הבלאגן - זה לא התפקיד שלכם, נקודה.');
    });
    busy = false;
  }

  async function open() {
    panel.hidden = false; btn.classList.add('open', 'seen'); btn.setAttribute('aria-expanded', 'true'); tip.classList.remove('on');
    try { localStorage.setItem('dbiz-chat-seen', '1'); } catch (e) { /* storage may be blocked */ }
    if (!started) { started = true; renderChips(); await botSay(HELLO); }
    setTimeout(() => (chips.querySelector('.dc-chip') || panel.querySelector('.dc-x')).focus(), 50);
  }
  function close() { panel.hidden = true; btn.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); btn.focus(); }

  btn.addEventListener('click', () => (panel.hidden ? open() : close()));
  panel.querySelector('.dc-x').addEventListener('click', close);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !panel.hidden) close(); });

  // a small hello next to the button, once per visitor, after a short while on the page
  let seen = false; try { seen = localStorage.getItem('dbiz-chat-seen') === '1'; } catch (e) { /* ignore */ }
  if (seen) btn.classList.add('seen');
  else setTimeout(() => { if (panel.hidden) { tip.classList.add('on'); setTimeout(() => tip.classList.remove('on'), 6000); } }, 7000);
})();
