(() => {
  'use strict';

  const AUTHOR = 'Melanie Dobson';

  // Replaced at build time. Book data is cached for hours, so each build gets its own URLs.
  const DATA_VERSION = '20261108021814';
  const dataUrl = path => `${path}?v=${DATA_VERSION}`;

  const BOOKS = [
    {
      slug: 'resonance',
      number: 'One',
      title: 'Resonance',
      cover: 'assets/img/cover-resonance.jpg',
      coverTone: 'dark',
      tagline: 'Something between worlds is calling her name.',
      blurb: [
        'Seraphina has spent seventeen years learning how to disappear: head down, eyes averted, ignoring the strange hum beneath her ribs.',
        'On the last day of junior year, the hum becomes impossible to ignore. Kaelen, a silver-eyed stranger built to hunt her, is choosing against every order to protect her. Lyra, a fractured hunter, wants what is inside her. And the light Seraphina inherited from a father she barely remembers is waking up.'
      ]
    },
    {
      slug: 'echoes',
      number: 'Two',
      title: 'Echoes',
      cover: 'assets/img/cover-echoes.jpg',
      coverTone: 'light',
      tagline: 'Some places remember you after they die.',
      blurb: [
        'There is no sky. There is no ground. There is only the Between, a collapsing realm where dead places leave echoes and the father Seraphina lost is waiting in pieces.',
        'Kaelen and Lyra will tear through every shadow to reach her. But the deeper they go, the more they learn about the Collectors and the Council, and the less certain it is that any of them will come home unchanged.'
      ]
    },
    {
      slug: 'ascendance',
      number: 'Three',
      title: 'Ascendance',
      cover: 'assets/img/cover-ascendance.jpg',
      coverTone: 'dark',
      tagline: 'Every world has a design. She means to rewrite hers.',
      blurb: [
        'The world has shifted. Thin places still hum. Hollows hunt the gaps. And a mind called the Architect knows Seraphina by name.',
        'The Architect has a purpose for her. So does the Council. Caught between becoming a weapon and becoming a god, Seraphina must decide what she was made for, and whether she gets to write the ending herself.'
      ]
    }
  ];

  const STORE = {
    key: 'seraphina.key',
    prefs: 'seraphina.prefs',
    progress: slug => `seraphina.progress.${slug}`,
    done: slug => `seraphina.done.${slug}`
  };

  const params = new URLSearchParams(location.search);
  const enc = new TextEncoder();
  const dec = new TextDecoder();

  // ---------- small helpers ----------

  function h(tag, attrs, ...children) {
    const node = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v == null || v === false) continue;
      if (k === 'class') node.className = v;
      else if (k === 'html') node.innerHTML = v;
      else if (k.startsWith('on')) node.addEventListener(k.slice(2), v);
      else node.setAttribute(k, v === true ? '' : v);
    }
    for (const c of children.flat()) {
      if (c == null || c === false) continue;
      node.append(c instanceof Node ? c : document.createTextNode(String(c)));
    }
    return node;
  }

  function readJson(storage, key, fallback) {
    try { return JSON.parse(storage.getItem(key)) ?? fallback; } catch { return fallback; }
  }

  function bookBySlug(slug) { return BOOKS.find(b => b.slug === slug); }

  function cover(book) {
    return h('div', { class: `cover ${book.coverTone === 'light' ? 'light' : ''}` },
      h('img', { src: book.cover, alt: '', loading: 'lazy', decoding: 'async' }),
      h('div', { class: 'cover-text', 'aria-hidden': 'true' },
        h('span', { class: 'cover-series' }, `Seraphina \u00b7 Book ${book.number}`),
        h('span', { class: 'cover-title' }, book.title),
        h('span', { class: 'cover-author' }, AUTHOR)));
  }

  const flourishSvg = `<svg class="flourish" viewBox="0 0 160 20" fill="none" stroke="currentColor" stroke-width="1.2" aria-hidden="true">
    <path d="M4 10h56M100 10h56"/><circle cx="80" cy="10" r="5.5"/><circle cx="80" cy="10" r="2" fill="currentColor"/>
    <path d="M62 10c4-6 9-6 12 0M98 10c-4-6-9-6-12 0"/></svg>`;

  const icons = {
    back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>',
    list: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>',
    type: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20l5-14 5 14M6 15h6M15 20l3-8 3 8M16 18h4"/></svg>',
    listen: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/></svg>',
    play: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z"/></svg>',
    pause: '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>',
    rewind: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 17l-5-5 5-5M18 17l-5-5 5-5"/></svg>',
    forward: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 17l5-5-5-5M6 17l5-5-5-5"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>'
  };

  // ---------- preferences ----------

  function prefs() { return readJson(localStorage, STORE.prefs, {}); }

  function applyPrefs(p = prefs()) {
    const root = document.documentElement;
    const theme = p.theme && p.theme !== 'auto'
      ? p.theme
      : (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    root.dataset.theme = theme;
    root.dataset.font = p.font || 'serif';
    root.style.setProperty('--reader-scale', (p.size || 100) / 100);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = getComputedStyle(document.body).backgroundColor;
  }

  function setPref(name, value) {
    const p = prefs();
    p[name] = value;
    localStorage.setItem(STORE.prefs, JSON.stringify(p));
    applyPrefs(p);
  }

  // ---------- crypto ----------
  // Sealed files are iv(16) | hmac-sha256(iv|ciphertext)(32) | aes-256-cbc ciphertext.

  const b64ToBytes = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
  const bytesToB64 = bytes => btoa(String.fromCharCode(...bytes));

  async function importKeys(raw) {
    const aes = await crypto.subtle.importKey('raw', raw.slice(0, 32), { name: 'AES-CBC' }, false, ['decrypt']);
    const mac = await crypto.subtle.importKey('raw', raw.slice(32, 64), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
    return { aes, mac };
  }

  async function openBox(bytes, keys) {
    const iv = bytes.slice(0, 16);
    const tag = bytes.slice(16, 48);
    const ct = bytes.slice(48);
    const signed = new Uint8Array(iv.length + ct.length);
    signed.set(iv);
    signed.set(ct, iv.length);
    if (!await crypto.subtle.verify('HMAC', keys.mac, tag, signed)) throw new Error('locked');
    return new Uint8Array(await crypto.subtle.decrypt({ name: 'AES-CBC', iv }, keys.aes, ct));
  }

  async function gunzip(bytes) {
    const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
    return new Uint8Array(await new Response(stream).arrayBuffer());
  }

  async function sha256Hex(text) {
    const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', enc.encode(text)));
    return Array.from(digest, b => b.toString(16).padStart(2, '0')).join('');
  }

  async function signIn(username, password) {
    const res = await fetch('data/auth.json', { cache: 'no-store' });
    if (!res.ok) throw new Error('offline');
    const auth = await res.json();
    const user = username.trim().toLowerCase();
    const entry = auth.users[await sha256Hex(user)];
    // Run the key derivation even for unknown usernames so both failures look the same.
    const salt = entry ? b64ToBytes(entry.salt) : crypto.getRandomValues(new Uint8Array(16));
    const material = await crypto.subtle.importKey('raw', enc.encode(`${user}\n${password}`), 'PBKDF2', false, ['deriveBits']);
    const bits = new Uint8Array(await crypto.subtle.deriveBits(
      { name: 'PBKDF2', hash: 'SHA-256', salt, iterations: auth.iterations }, material, 512));
    if (!entry) throw new Error('denied');
    try {
      return await openBox(b64ToBytes(entry.key), await importKeys(bits));
    } catch {
      throw new Error('denied');
    }
  }

  function storedKey() {
    return localStorage.getItem(STORE.key) || sessionStorage.getItem(STORE.key);
  }

  function signOut() {
    localStorage.removeItem(STORE.key);
    sessionStorage.removeItem(STORE.key);
    location.reload();
  }

  let keys = null;

  async function fetchSealed(path) {
    const res = await fetch(dataUrl(path));
    if (!res.ok) throw new Error(`missing ${path}`);
    try {
      const plain = await gunzip(await openBox(new Uint8Array(await res.arrayBuffer()), keys));
      return JSON.parse(dec.decode(plain));
    } catch (err) {
      if (err.message === 'locked') {
        // The site key was rotated since this device signed in.
        localStorage.removeItem(STORE.key);
        sessionStorage.removeItem(STORE.key);
        location.reload();
      }
      throw err;
    }
  }

  // ---------- sign-in gate ----------

  function unlock(book, mount) {
    const saved = storedKey();
    if (saved) {
      return importKeys(b64ToBytes(saved)).then(k => { keys = k; });
    }

    return new Promise(resolve => {
      const error = h('p', { class: 'gate-error', role: 'alert', hidden: true });
      const submit = h('button', { class: 'btn', type: 'submit' }, 'Open the book');
      const form = h('form', { class: 'gate-card', autocomplete: 'on' },
        cover(book),
        h('h1', {}, 'Reader sign in'),
        h('p', { class: 'muted' }, 'This trilogy is shared with invited readers. Enter the username and password you were given.'),
        h('label', { class: 'field' }, 'Username',
          h('input', { name: 'username', autocomplete: 'username', autocapitalize: 'none', spellcheck: 'false', required: true })),
        h('label', { class: 'field' }, 'Password',
          h('input', { name: 'password', type: 'password', autocomplete: 'current-password', required: true })),
        h('label', { class: 'check' }, h('input', { type: 'checkbox', name: 'remember', checked: true }), 'Keep me signed in on this device'),
        error,
        submit,
        h('a', { class: 'back', href: './' }, '\u2190 Back to all books'));

      form.addEventListener('submit', async event => {
        event.preventDefault();
        const data = new FormData(form);
        submit.disabled = true;
        submit.textContent = 'Unlocking\u2026';
        error.hidden = true;
        try {
          const raw = await signIn(String(data.get('username')), String(data.get('password')));
          (data.get('remember') ? localStorage : sessionStorage).setItem(STORE.key, bytesToB64(raw));
          keys = await importKeys(raw);
          resolve();
        } catch (err) {
          error.textContent = err.message === 'offline'
            ? 'Could not reach the site. Check your connection and try again.'
            : 'That username and password did not match. Please try again.';
          error.hidden = false;
          submit.disabled = false;
          submit.textContent = 'Open the book';
          form.password.select();
        }
      });

      mount.replaceChildren(h('section', { class: 'gate' }, form));
      form.username.focus({ preventScroll: true });
    });
  }

  // ---------- reading progress ----------

  function progressFor(slug) { return readJson(localStorage, STORE.progress(slug), null); }
  function doneFor(slug) { return new Set(readJson(localStorage, STORE.done(slug), [])); }

  function readMinutes(words) { return Math.max(1, Math.round(words / 230)); }

  function chapterName(ch) { return ch.title || ch.label; }

  // ---------- pages ----------

  function initLanding() {
    const list = document.getElementById('books');
    for (const book of BOOKS) {
      const href = `book.html?b=${book.slug}`;
      list.append(h('article', { class: 'book-card' },
        h('a', { class: 'cover-link', href, 'aria-label': `${book.title}, Book ${book.number}` }, cover(book)),
        h('div', { class: 'book-card-body' },
          h('p', { class: 'eyebrow' }, `Book ${book.number}`),
          h('p', { class: 'tagline' }, book.tagline),
          book.blurb.map(p => h('p', {}, p)),
          h('a', { class: 'btn', href }, `Read ${book.title}`))));
    }
  }

  function topbar(left, title, right) {
    return h('header', { class: 'topbar' }, left, h('div', { class: 'topbar-title' }, title), right || h('span', { style: 'width:44px' }));
  }

  async function initBook() {
    const book = bookBySlug(params.get('b'));
    if (!book) { location.replace('./'); return; }
    document.title = `${book.title} \u00b7 Seraphina`;

    const app = document.getElementById('app');
    const bar = topbar(h('a', { class: 'icon-btn', href: './', html: `${icons.back}<span>Books</span>` }), `Book ${book.number}`);
    const main = h('main');
    app.replaceChildren(bar, main);

    await unlock(book, main);
    main.replaceChildren(h('div', { class: 'loading' }, 'Opening the book\u2026'));
    const toc = await fetchSealed(`data/${book.slug}/toc.bin`);

    const progress = progressFor(book.slug);
    const done = doneFor(book.slug);
    const resumeAt = progress && progress.c <= toc.chapters.length ? progress.c : null;

    const actions = h('div', { class: 'book-actions' },
      resumeAt
        ? h('a', { class: 'btn', href: `read.html?b=${book.slug}&c=${resumeAt}` }, 'Continue reading')
        : h('a', { class: 'btn', href: `read.html?b=${book.slug}&c=1` }, 'Start reading'),
      resumeAt ? h('a', { class: 'btn ghost', href: `read.html?b=${book.slug}&c=1` }, 'Start from the beginning') : null);

    const ch = resumeAt ? toc.chapters[resumeAt - 1] : null;
    const note = ch
      ? h('p', { class: 'continue-note' },
          `You were in ${ch.title ? `${ch.label}: ${ch.title}` : ch.label}, about ${Math.round((progress.p || 0) * 100)}% through.`)
      : null;

    const items = toc.chapters.map((c, i) => {
      const n = i + 1;
      const showLabel = c.title && c.label !== c.title;
      return h('li', { class: n === resumeAt ? 'current' : '' },
        h('a', { href: `read.html?b=${book.slug}&c=${n}` },
          h('span', { class: 'toc-mark', 'aria-label': done.has(n) ? 'Read' : null }, done.has(n) ? '\u2713' : n === resumeAt ? '\u25B8' : ''),
          h('span', {},
            showLabel ? h('span', { class: 'toc-label' }, c.label) : null,
            h('span', { class: 'toc-title' }, chapterName(c))),
          h('span', { class: 'toc-time' }, `${readMinutes(c.words)} min`)));
    });

    const others = BOOKS.filter(b => b !== book).map(b =>
      h('a', { href: `book.html?b=${b.slug}`, 'aria-label': b.title }, cover(b)));

    main.replaceChildren(h('div', { class: 'book-page' },
      h('section', { class: 'book-head' },
        cover(book),
        h('div', { class: 'book-meta' },
          h('p', { class: 'eyebrow' }, `Seraphina \u00b7 Book ${book.number}`),
          h('h1', {}, book.title),
          h('p', { class: 'byline' }, `by ${AUTHOR}`),
          h('p', { class: 'tagline' }, book.tagline),
          book.blurb.map(p => h('p', { class: 'blurb' }, p)),
          toc.dedication ? h('div', { class: 'dedication', html: toc.dedication }) : null,
          actions,
          note)),
      h('section', { class: 'toc' }, h('h2', {}, 'Contents'), h('ol', {}, items)),
      h('section', { class: 'other-books' }, h('h2', {}, 'More in the trilogy'), h('div', { class: 'other-books-list' }, others)),
      h('section', { class: 'copyright', html: toc.copyright || '' }),
      h('p', { class: 'small' }, h('button', { class: 'icon-btn small', type: 'button', onclick: signOut }, 'Sign out of this device'))));
  }

  // ---------- read aloud (browser speech synthesis) ----------

  const speechSupported = 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
  let onVoiceChange = () => {};

  // Novelty voices that ship with macOS/iOS and are unpleasant for long reading.
  const NOVELTY_VOICES = /\b(albert|bad news|bahh|bells|boing|bubbles|cellos|good news|jester|organ|superstar|trinoids|whisper|wobble|zarvox|deranged|hysterical|pipe organ)\b/i;

  function voiceScore(v) {
    let s = 0;
    if (NOVELTY_VOICES.test(v.name)) s -= 20;
    if (/natural|neural/i.test(v.name)) s += 6;
    if (/premium|enhanced|siri/i.test(v.name)) s += 4;
    if (/online/i.test(v.name)) s += 2;
    if (/google/i.test(v.name)) s += 2;
    if (/^en[-_]US/i.test(v.lang)) s += 1;
    if (v.default) s += 1;
    return s;
  }

  function rankedVoices() {
    return speechSynthesis.getVoices()
      .filter(v => /^en([-_]|$)/i.test(v.lang))
      .sort((a, b) => voiceScore(b) - voiceScore(a) || a.name.localeCompare(b.name));
  }

  // Preferred defaults in order: Andrew Multilingual exists only in Microsoft Edge,
  // Karen only on Apple devices; anything else falls back to the best-ranked voice.
  const DEFAULT_VOICES = [
    v => /andrew\s*multilingual/i.test(v.name) && /^en[-_]US/i.test(v.lang),
    v => /^karen\b/i.test(v.name) && /^en[-_]AU/i.test(v.lang)
  ];

  function pickVoice() {
    const voices = rankedVoices();
    const wanted = prefs().voice;
    const saved = voices.find(v => v.voiceURI === wanted);
    if (saved) return saved;
    for (const match of DEFAULT_VOICES) {
      const v = voices.find(match);
      if (v) return v;
    }
    return voices[0] || null;
  }

  function voiceLabel(v) {
    const name = v.name.replace(/^Microsoft\s+/, '').replace(/\s+-\s+English.*$/, '');
    return `${name} (${v.lang.replace('_', '-')})`;
  }

  // Short utterances avoid Chrome's habit of silently stopping long ones.
  function chunkText(text) {
    const clean = text.replace(/\s+/g, ' ').trim();
    const sentences = clean.match(/[^.!?\u2026]+[.!?\u2026]+["\u201d\u2019)\]]*\s*|[^.!?\u2026]+$/g) || [clean];
    const chunks = [];
    let cur = '';
    for (const s of sentences) {
      if (cur && (cur + s).length > 220) { chunks.push(cur.trim()); cur = ''; }
      cur += s;
    }
    if (cur.trim()) chunks.push(cur.trim());
    return chunks.filter(Boolean);
  }

  const RATES = [0.8, 0.9, 1, 1.1, 1.25, 1.5, 1.75, 2];

  function createNarrator({ onChapterEnd }) {
    const state = { items: [], i: 0, chunks: [], j: 0, playing: false, token: 0, utter: null, wake: null, open: false };

    const playBtn = h('button', { class: 'play', type: 'button', 'aria-label': 'Play', onclick: () => (state.playing ? pause() : play()) });
    const rateBtn = h('button', { class: 'rate', type: 'button', 'aria-label': 'Reading speed', onclick: cycleRate });
    const status = h('span', { class: 'player-status', 'aria-live': 'polite' });
    const player = h('div', { class: 'player', role: 'region', 'aria-label': 'Read aloud', hidden: true },
      playBtn,
      status,
      h('button', { type: 'button', 'aria-label': 'Previous paragraph', onclick: () => jumpTo(state.i - 1), html: icons.rewind }),
      h('button', { type: 'button', 'aria-label': 'Next paragraph', onclick: () => jumpTo(state.i + 1), html: icons.forward }),
      rateBtn,
      h('button', { type: 'button', 'aria-label': 'Close read aloud', onclick: close, html: icons.close }));
    document.body.append(player);

    const rate = () => prefs().rate || 1;

    function render() {
      playBtn.innerHTML = state.playing ? icons.pause : icons.play;
      playBtn.setAttribute('aria-label', state.playing ? 'Pause' : 'Play');
      rateBtn.textContent = `${rate()}\u00d7`;
      const pct = state.items.length ? Math.round((state.i / state.items.length) * 100) : 0;
      status.textContent = `${state.playing ? 'Reading' : 'Paused'} \u00b7 ${Math.min(pct, 100)}%`;
    }

    function mark() {
      document.querySelectorAll('.speaking').forEach(el => el.classList.remove('speaking'));
      const item = state.items[state.i];
      if (!item) return;
      item.el.classList.add('speaking');
      const r = item.el.getBoundingClientRect();
      const bottomLimit = innerHeight - player.offsetHeight - 24;
      if (r.top < 72 || r.top > bottomLimit) item.el.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }

    function speak() {
      if (!state.playing) return;
      if (state.i >= state.items.length) { finish(); return; }
      if (!state.chunks.length) state.chunks = chunkText(state.items[state.i].text);
      if (!state.chunks.length) { next(); return; }
      if (state.j === 0) mark();

      const u = new SpeechSynthesisUtterance(state.chunks[state.j]);
      const voice = pickVoice();
      if (voice) { u.voice = voice; u.lang = voice.lang; }
      u.rate = rate();
      const token = ++state.token;
      u.onend = () => { if (token === state.token && state.playing) next(); };
      u.onerror = e => {
        if (token !== state.token) return;
        if (e.error === 'interrupted' || e.error === 'canceled') return;
        if (e.error === 'not-allowed') { pause(); return; }
        next();
      };
      state.utter = u; // Keep a reference; Chrome can drop events for collected utterances.
      speechSynthesis.speak(u);
      render();
    }

    function next() {
      state.j++;
      if (state.j >= state.chunks.length) { state.i++; state.j = 0; state.chunks = []; }
      speak();
    }

    function restart() {
      state.token++;
      speechSynthesis.cancel();
      // iOS ignores speak() issued in the same tick as cancel().
      setTimeout(speak, 80);
    }

    function jumpTo(i) {
      state.i = Math.max(0, Math.min(state.items.length - 1, i));
      state.j = 0;
      state.chunks = [];
      if (state.playing) restart(); else { mark(); render(); }
    }

    async function holdScreen() {
      try { if ('wakeLock' in navigator && !state.wake) state.wake = await navigator.wakeLock.request('screen'); } catch { /* not allowed */ }
    }
    function releaseScreen() {
      if (state.wake) state.wake.release().catch(() => {});
      state.wake = null;
    }

    function play() {
      state.playing = true;
      holdScreen();
      restart();
      render();
    }

    function pause() {
      state.playing = false;
      state.token++;
      speechSynthesis.cancel();
      releaseScreen();
      render();
    }

    function close() {
      pause();
      state.open = false;
      player.hidden = true;
      document.body.classList.remove('listening');
      document.querySelectorAll('.speaking').forEach(el => el.classList.remove('speaking'));
    }

    function cycleRate() {
      const idx = RATES.indexOf(rate());
      setPref('rate', RATES[(idx + 1) % RATES.length]);
      if (state.playing) restart();
      render();
    }

    async function finish() {
      state.playing = false;
      render();
      const continued = await onChapterEnd();
      if (!continued) { releaseScreen(); status.textContent = 'Finished'; }
    }

    function firstVisible() {
      const top = 72;
      const idx = state.items.findIndex(item => item.el.getBoundingClientRect().bottom > top);
      return idx < 0 ? 0 : idx;
    }

    // Collect the readable pieces of the chapter currently on screen.
    function load(article, chapter) {
      const head = article.querySelector('.chapter-head h1');
      const headText = chapter.title && chapter.label !== chapter.title ? `${chapter.label}. ${chapter.title}.` : `${chapterName(chapter)}.`;
      state.items = [{ el: head, text: headText }]
        .concat([...article.querySelectorAll('.prose > p')].map(el => ({ el, text: el.textContent })));
      state.i = 0;
      state.j = 0;
      state.chunks = [];
      article.querySelector('.prose').addEventListener('click', e => {
        if (!state.open || String(getSelection())) return;
        const p = e.target.closest('.prose > p');
        const idx = state.items.findIndex(item => item.el === p);
        if (idx > 0) jumpTo(idx);
      });
    }

    function open() {
      state.open = true;
      player.hidden = false;
      document.body.classList.add('listening');
      state.i = firstVisible();
      state.j = 0;
      state.chunks = [];
      play();
    }

    function startFromTop() {
      state.i = 0;
      state.j = 0;
      state.chunks = [];
      play();
    }

    onVoiceChange = () => { if (state.playing) restart(); };
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState !== 'visible' || !state.playing) return;
      holdScreen();
      if (!speechSynthesis.speaking) restart();
    });
    addEventListener('pagehide', () => speechSynthesis.cancel());
    speechSynthesis.addEventListener?.('voiceschanged', render);

    render();
    return { load, open, startFromTop, toggle: () => (state.open ? close() : open()), isOpen: () => state.open };
  }

  function settingsSheet() {
    let open = null;

    function render() {
      const p = prefs();
      const theme = p.theme || 'auto';
      const font = p.font || 'serif';
      const size = p.size || 100;

      const seg = (name, current, options) => h('div', { class: 'segmented', role: 'group' },
        options.map(([value, label, cls]) => h('button', {
          type: 'button', class: cls, 'aria-pressed': String(current === value),
          onclick: () => { setPref(name, value); refresh(); }
        }, label)));

      const step = delta => { setPref('size', Math.min(160, Math.max(80, size + delta))); refresh(); };

      return h('div', { class: 'sheet', role: 'dialog', 'aria-label': 'Reading settings' },
        h('div', { class: 'sheet-row' }, h('h2', {}, 'Text size'),
          h('div', { class: 'size-row' },
            h('button', { type: 'button', 'aria-label': 'Smaller text', onclick: () => step(-10) }, 'A\u2212'),
            h('span', {}, `${size}%`),
            h('button', { type: 'button', 'aria-label': 'Larger text', onclick: () => step(10) }, 'A+'))),
        h('div', { class: 'sheet-row' }, h('h2', {}, 'Theme'),
          seg('theme', theme, [['light', 'Light', 'swatch-light'], ['sepia', 'Sepia', 'swatch-sepia'], ['dark', 'Dark', 'swatch-dark'], ['auto', 'Auto']])),
        h('div', { class: 'sheet-row' }, h('h2', {}, 'Font'),
          seg('font', font, [['serif', 'Serif'], ['sans', 'Sans']])),
        voiceRow(),
        h('button', { type: 'button', class: 'signout', onclick: signOut }, 'Sign out of this device'));
    }

    function voiceRow() {
      if (!speechSupported) return null;
      const voices = rankedVoices();
      if (!voices.length) return null;
      const chosen = pickVoice();
      const select = h('select', {
        'aria-label': 'Read-aloud voice',
        onchange: e => { setPref('voice', e.target.value); onVoiceChange(); }
      }, voices.map(v => h('option', { value: v.voiceURI, selected: chosen && v.voiceURI === chosen.voiceURI }, voiceLabel(v))));
      return h('div', { class: 'sheet-row' }, h('h2', {}, 'Read-aloud voice'), select);
    }

    function refresh() {
      if (!open) return;
      const next = render();
      open.sheet.replaceWith(next);
      open.sheet = next;
    }

    function close() {
      if (!open) return;
      open.backdrop.remove();
      open.sheet.remove();
      open = null;
    }

    function toggle() {
      if (open) { close(); return; }
      const backdrop = h('div', { class: 'sheet-backdrop', onclick: close });
      const sheet = render();
      document.body.append(backdrop, sheet);
      open = { backdrop, sheet };
    }

    document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
    return toggle;
  }

  async function initReader() {
    const book = bookBySlug(params.get('b'));
    if (!book) { location.replace('./'); return; }

    const app = document.getElementById('app');
    const toggleSettings = settingsSheet();
    const titleEl = h('span', {}, book.title);
    let narrator = null;
    const listenBtn = speechSupported
      ? h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Listen', title: 'Read aloud', onclick: () => narrator && narrator.toggle(), html: icons.listen })
      : null;
    const bar = topbar(
      h('a', { class: 'icon-btn', href: `book.html?b=${book.slug}`, 'aria-label': 'Contents', html: icons.list }),
      titleEl,
      h('div', { class: 'topbar-actions' },
        listenBtn,
        h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Reading settings', onclick: toggleSettings, html: icons.type })));
    const bar_progress = h('div', { class: 'progress', 'aria-hidden': 'true' }, h('span'));
    const main = h('main');
    app.replaceChildren(bar_progress, bar, main);

    await unlock(book, main);
    main.replaceChildren(h('div', { class: 'loading' }, 'Opening the chapter\u2026'));

    const toc = await fetchSealed(`data/${book.slug}/toc.bin`);
    const total = toc.chapters.length;
    let n = Math.min(total, Math.max(1, parseInt(params.get('c'), 10) || 1));
    const scrollable = () => Math.max(1, document.documentElement.scrollHeight - innerHeight);
    const chapterUrl = i => `read.html?b=${book.slug}&c=${i}`;
    const chapterFile = i => `data/${book.slug}/${String(i).padStart(2, '0')}.bin`;
    const nextBook = BOOKS[BOOKS.indexOf(book) + 1];

    // Renders a chapter in place, so read-aloud can carry on without a page load.
    async function showChapter(target, { listening = false } = {}) {
      const chapter = await fetchSealed(chapterFile(target));
      n = target;

      const name = chapterName(chapter);
      const fullName = chapter.title ? `${chapter.label} \u00b7 ${chapter.title}` : chapter.label;
      document.title = `${fullName} \u00b7 ${book.title}`;
      titleEl.textContent = fullName;

      const showLabel = chapter.title && chapter.label !== chapter.title;
      const article = h('article', { class: 'reader' },
        h('header', { class: 'chapter-head' },
          showLabel ? h('p', { class: 'chapter-label' }, chapter.label) : null,
          h('h1', {}, name),
          h('span', { html: flourishSvg })),
        h('div', { class: 'prose', html: chapter.html }),
        n === total ? h('p', { class: 'chapter-end' }, `The end of Book ${book.number}`) : null);

      const link = (i, cls, dir) => h('a', { class: cls, href: chapterUrl(i), rel: cls },
        h('span', { class: 'dir' }, dir), h('span', { class: 'name' }, chapterName(toc.chapters[i - 1])));
      const nav = h('nav', { class: 'chapter-nav', 'aria-label': 'Chapters' },
        n > 1 ? link(n - 1, 'prev', 'Previous') : null,
        n < total
          ? link(n + 1, 'next', 'Next')
          : nextBook
            ? h('a', { class: 'next', href: `book.html?b=${nextBook.slug}` },
                h('span', { class: 'dir' }, `Book ${nextBook.number}`), h('span', { class: 'name' }, nextBook.title))
            : h('a', { class: 'next', href: './' }, h('span', { class: 'dir' }, 'Finished'), h('span', { class: 'name' }, 'All books')));

      main.replaceChildren(article, nav);
      if (narrator) narrator.load(article, chapter);

      const saved = progressFor(book.slug);
      if (!listening && saved && saved.c === n && saved.p > 0.01 && !location.hash) {
        requestAnimationFrame(() => scrollTo(0, saved.p * scrollable()));
      } else {
        scrollTo(0, 0);
      }

      if (n < total) fetch(dataUrl(chapterFile(n + 1))).catch(() => {});
    }

    if (speechSupported) {
      narrator = createNarrator({
        onChapterEnd: async () => {
          if (n >= total) return false;
          history.pushState(null, '', chapterUrl(n + 1));
          await showChapter(n + 1, { listening: true });
          narrator.startFromTop();
          return true;
        }
      });
    }
    addEventListener('popstate', () => location.reload());

    await showChapter(n);

    const fill = bar_progress.firstChild;
    let lastY = scrollY;
    let pending = false;
    const onScroll = () => {
      if (pending) return;
      pending = true;
      requestAnimationFrame(() => {
        pending = false;
        const p = Math.min(1, scrollY / scrollable());
        fill.style.width = `${p * 100}%`;
        bar.classList.toggle('hidden', scrollY > lastY && scrollY > 120);
        lastY = scrollY;
        localStorage.setItem(STORE.progress(book.slug), JSON.stringify({ c: n, p }));
        if (p > 0.97) {
          const done = doneFor(book.slug);
          if (!done.has(n)) {
            done.add(n);
            localStorage.setItem(STORE.done(book.slug), JSON.stringify([...done]));
          }
        }
      });
    };
    addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    document.addEventListener('keydown', e => {
      if (e.target.closest('input, textarea') || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === 'ArrowRight' && n < total) location.href = `read.html?b=${book.slug}&c=${n + 1}`;
      if (e.key === 'ArrowLeft' && n > 1) location.href = `read.html?b=${book.slug}&c=${n - 1}`;
    });
  }

  // ---------- boot ----------

  function showFatal(err) {
    console.error(err);
    const main = document.querySelector('main') || document.body;
    main.replaceChildren(h('div', { class: 'loading' },
      h('p', {}, 'Something went wrong opening this page. ', h('a', { href: location.href }, 'Try again'), ' or ', h('a', { href: './' }, 'go back to all books'), '.')));
  }

  const page = document.body.dataset.page;
  if (page !== 'landing') {
    applyPrefs();
    matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => applyPrefs());
  }
  if (page === 'landing') initLanding();
  if (page === 'book') initBook().catch(showFatal);
  if (page === 'reader') initReader().catch(showFatal);
})();
