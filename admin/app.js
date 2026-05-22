/* =====================================================
   LIBER — panel edycji (app.js) — iteracja 2
   ===================================================== */

const REPO = 'Phantos7/Liber';
const BRANCH = 'main';
const FILE_PATH = 'index.html';
const API = 'https://api.github.com';
const DRAFT_PREFIX = 'liber-draft-';
const DRAFT_DEBOUNCE = 500;
const MAX_DRAFTS = 5;

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

const SECTION_META = {
  hero:     { label: 'Powitanie',           sub: 'Hero · tytuł, motto, okładka, countdown' },
  ticker:   { label: 'Pasek postulatów',    sub: 'Postulaty przewijające się na górze strony' },
  sprawa:   { label: 'Akta sprawy',         sub: 'Dossier · abstrakt · cytat motywu' },
  synopsis: { label: 'Fabuła',              sub: 'Streszczenie po blokach' },
  zespol:   { label: 'Bohaterowie',         sub: 'Beta, Konrad, Grażyna + aspekty śledztwa' },
  cytaty:   { label: 'Cytaty z transkryptu',sub: 'Fragmenty taśmy' },
  opinie:   { label: 'Opinie',              sub: 'Recenzje pre-czytelników' },
  trylogia: { label: 'Trylogia',            sub: 'LIBER · EXTREMA · KOLAPS' },
  formaty:  { label: 'Wydania (pre-order)', sub: 'Miękka · e-book · audiobook' },
  zapisy:   { label: 'Formularz rezerwacji',sub: 'Lista zapisów' },
  autorka:  { label: 'O autorce',           sub: 'J.F. Bielak — bio i kontakt' },
  final:    { label: 'Wezwanie końcowe',    sub: 'CTA — Otwórz akta, zarezerwuj' },
};

// Etykiety per sekcja + selektor — zostawiam główne pola z czytelnymi nazwami
const SECTION_LABELS = {
  hero: {
    '.hero__eyebrow span:not(.hero__eyebrow-sep):nth-of-type(1)': 'Etykieta nagłówka (lewa)',
    '.hero__eyebrow span:not(.hero__eyebrow-sep):nth-of-type(3)': 'Etykieta nagłówka (prawa)',
    '.hero__motto': 'Motto pod tytułem',
    '.hero__lede': 'Krótki opis',
    '.live-badge': 'Pasek LIVE (transmisja)',
    '.hero__packshot-tag': 'Pieczęć przy okładce',
    '.hero__packshot-code': 'Kod przy okładce',
    '.countdown__label': 'Nagłówek odliczania',
    '.btn--primary .btn__label': 'Przycisk główny (Zarezerwuj…)',
    '.btn--ghost span': 'Przycisk dodatkowy (Otwórz akta…)',
  },
  sprawa: {
    '.section__num': 'Numer sekcji (01 / AKTA)',
    '.case__sub': 'Klauzula (POUFNE…)',
    '.case__filehead span:first-child': 'Nagłówek dossier (DOSSIER ▸ ABSTRACT)',
    '.case__stamp': 'Pieczęć (CLASSIFIED)',
    '.case__pullsig': 'Podpis pod cytatem motywu',
  },
  synopsis: {
    '.syn__num': 'Numer sekcji (02 / FABUŁA)',
    '.syn__title': 'Tytuł sekcji (Wojna wszystkich…)',
    '.syn__sub': 'Podtytuł (Warszawa…)',
  },
  zespol: {
    '.section__num': 'Numer sekcji (03 / ZESPÓŁ)',
  },
  cytaty: {
    '.section__num': 'Numer sekcji (04 / TRANSKRYPT)',
  },
  opinie: {
    '.section__num': 'Numer sekcji (05 / PRE-CZYTELNICY)',
  },
  trylogia: {
    '.section__num': 'Numer sekcji (06 / TRYLOGIA)',
  },
  formaty: {
    '.section__num': 'Numer sekcji (07 / WYBÓR NOŚNIKA)',
  },
  autorka: {
    '.author__num': 'Numer sekcji (08 / AUTORKA)',
  },
  zapisy: {
    '.preorder__note': 'Notka pod formularzem',
    '.preorder__check span': 'Etykieta zgody',
  },
  final: {
    '.final__motto': 'Wezwanie końcowe (Otwórz akta…)',
    '.final__date': 'Data w stopce',
  },
};

const EDITABLE_SEL = [
  'h1','h2','h3','h4','h5','h6',
  'p','blockquote','figcaption','li',
  '.ticker__item','.syn__chip','.quote__meta',
  '.case__v','.case__k','.case__stamp','.case__sub','.case__pullsig',
  '.dossier__name','.dossier__role','.dossier__alias','.dossier__rank','.dossier__code',
  '.dossier__tags span','.dossier__chart-v','.dossier__chart-k','.dossier__portrait-tag',
  '.tome__sub','.tome__pill',
  '.fmt__meta','.fmt__badge','.fmt__ribbon',
  '.btn__label',
  '.hero__packshot-tag','.hero__packshot-code',
  '.countdown__label',
  '.live-badge',
  '.final__date','.foot__sub','.foot__title',
  '.section__sub','.section__num','.syn__num','.syn__sub','.author__num',
  '.author__plate-name','.author__plate-sub','.author__plate-tag',
  '.hero__eyebrow span:not(.hero__eyebrow-sep)',
  '.aspects__head span','.aspects__title',
  '.preorder__label','.preorder__check span','.preorder__note',
  '.author__contact a',
  '.case__filehead span',
  '.final__motto',
].join(',');

const SKIP_SEL = [
  'script','style','svg','path','use','link','meta','noscript',
  '.cursor','.cursor-dot','.grain','.scanlines','.vignette',
  '.hero__fog *','.hero__crosshair *','.hero__scroll',
  '.countdown__num','.live-badge__dot','.live-badge__time',
  '.countdown__pulse',
  '.loader','.loader *',
  '.dossier__crosshair','.dossier__crosshair *',
  '.dossier__silhouette','.dossier__silhouette *',
  '.dossier__fingerprint','.dossier__fingerprint *',
  '.dossier__portrait-bg',
  '.fmt__wave','.fmt__wave *','.fmt__shadow',
  '.hero__divider','.hero__divider *',
  '.hero__scroll-line',
  '.aspects__line',
  '.tome__rail','.tome__line','.tome__roman',
  '.hero__packshot-shadow','.hero__packshot-glow',
  '.author__plate-line',
  '.btn__shine',
  '.dossier__head','.dossier__portrait',
  '.field__hint',
  '.sr-only',
  '.skip-link',
  'nav.nav__links','nav.nav__links *',
  '.modal','.modal *',
  '.loading','.loading *',
  '.toast','.toast *',
  '.topbar','.topbar *',
].join(',');

const ALLOWED_INLINE_TAGS = new Set(['EM','STRONG','SPAN','BR','I','B']);
const ALLOWED_INLINE_CLASSES = ['hl','accent','mono'];

const state = {
  token: null,
  sha: null,
  rawHtml: null,
  doc: null,
  parsedSections: [], // { id, element, fields, originalHidden }
  mutations: new Map(),       // selector → { sectionId, originalOuterHTML, originalInnerHTML, newInnerHTML, label }
  hiddenSections: new Set(),
  originalHiddenSections: new Set(),
  draftTimer: null,
  pendingSave: false,
};

/* ---------- utils ---------- */
function decodeBase64(b64) {
  const bin = atob(b64.replace(/\s/g, ''));
  const bytes = Uint8Array.from(bin, c => c.charCodeAt(0));
  return new TextDecoder('utf-8').decode(bytes);
}
function encodeBase64(str) {
  const bytes = new TextEncoder().encode(str);
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}
function showToast(msg, type = 'info') {
  const t = $('#toast');
  t.textContent = msg;
  t.className = 'toast toast--' + type;
  t.hidden = false;
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => t.hidden = true, 4500);
}
function showLoading(visible, label) {
  $('#loading').hidden = !visible;
  if (label) $('#loading-label').textContent = label;
}
function escapeRegex(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

/* ---------- sanitize paste ---------- */
function sanitizeHTML(html) {
  const tpl = document.createElement('template');
  tpl.innerHTML = html;
  const walk = (node) => {
    [...node.childNodes].forEach(child => {
      if (child.nodeType === 1) {
        if (!ALLOWED_INLINE_TAGS.has(child.tagName)) {
          // unwrap
          const frag = document.createDocumentFragment();
          while (child.firstChild) frag.appendChild(child.firstChild);
          child.replaceWith(frag);
          return;
        }
        // strip attributes except class (whitelist)
        [...child.attributes].forEach(attr => {
          if (attr.name === 'class') {
            const cls = attr.value.split(/\s+/).filter(c => ALLOWED_INLINE_CLASSES.includes(c)).join(' ');
            if (cls) child.setAttribute('class', cls);
            else child.removeAttribute('class');
          } else {
            child.removeAttribute(attr.name);
          }
        });
        walk(child);
      } else if (child.nodeType === 8) {
        child.remove(); // comments
      }
    });
  };
  walk(tpl.content);
  return tpl.innerHTML;
}

/* ---------- auth ---------- */
function checkAuth() {
  state.token = localStorage.getItem('liber-pat');
  if (!state.token) {
    $('#auth-modal').hidden = false;
    return false;
  }
  return true;
}
function authSubmit() {
  const tok = $('#auth-token').value.trim();
  if (!tok) { showToast('Wpisz token', 'error'); return; }
  localStorage.setItem('liber-pat', tok);
  state.token = tok;
  $('#auth-modal').hidden = true;
  $('#auth-token').value = '';
  load(state.pendingSave ? () => save() : null);
}
function logout() {
  const hasChanges = state.mutations.size > 0 || hiddenDiff().length > 0;
  if (hasChanges && !confirm('Masz niezapisane zmiany. Na pewno wyloguj?')) return;
  localStorage.removeItem('liber-pat');
  location.reload();
}

/* ---------- load ---------- */
async function load(onReady) {
  showLoading(true, 'Pobieram aktualną treść strony…');
  try {
    const r = await fetch(`${API}/repos/${REPO}/contents/${FILE_PATH}?ref=${BRANCH}&t=${Date.now()}`, {
      headers: {
        'Authorization': `Bearer ${state.token}`,
        'Accept': 'application/vnd.github.v3+json',
      }
    });
    if (r.status === 401 || r.status === 403) {
      throw new Error('Token nieautoryzowany. Wygeneruj nowy z prawami Contents · Read & Write.');
    }
    if (!r.ok) throw new Error(`Błąd GitHub API (${r.status})`);
    const data = await r.json();
    state.sha = data.sha;
    state.rawHtml = decodeBase64(data.content);
    state.doc = new DOMParser().parseFromString(state.rawHtml, 'text/html');

    // Initial hidden sections from DOM
    state.originalHiddenSections = new Set();
    $$('section[id]', state.doc).forEach(sec => {
      if (sec.classList.contains('is-hidden-section')) state.originalHiddenSections.add(sec.id);
    });
    state.hiddenSections = new Set(state.originalHiddenSections);

    parseAndRender();
    $('#btn-preview').hidden = false;
    $('#btn-save').hidden = false;
    $('#btn-logout').hidden = false;
    $('#sidebar').hidden = false;
    if (matchMedia('(max-width: 800px)').matches && $('#btn-sidebar')) $('#btn-sidebar').hidden = false;
    else if ($('#btn-sidebar')) $('#btn-sidebar').hidden = false; // pokazuj zawsze gdy zalogowany

    // Restore draft if exists for this SHA
    const draft = loadDraft();
    if (draft && (draft.mutations.length > 0 || draft.hidden.length > 0)) {
      const stamp = new Date(draft.savedAt).toLocaleString('pl-PL');
      if (confirm(`Wykryto wersję roboczą z ${stamp}.\n\nWczytać niezapisane zmiany (${draft.mutations.length} pól, ${draft.hidden.length} sekcji ukrytych)?`)) {
        restoreDraft(draft);
      } else {
        clearDraft();
      }
    }

    if (onReady) onReady();
  } catch (err) {
    showToast(err.message, 'error');
    if (/(401|403|nieautoryzowany)/i.test(err.message)) {
      localStorage.removeItem('liber-pat');
      $('#auth-modal').hidden = false;
    }
  } finally {
    showLoading(false);
  }
}

/* ---------- parse & render ---------- */
function parseAndRender() {
  const sections = $$('section[id], header.nav, footer.foot', state.doc);
  state.parsedSections = sections.map(sec => {
    const id = sec.id || sec.tagName.toLowerCase();
    const fields = extractFields(sec, id);
    return { id, element: sec, fields, originalHidden: state.originalHiddenSections.has(id) };
  });
  render();
}

// Refresh baselines without re-rendering UI — używane po udanym save.
// Mapujemy istniejące fields do nowych elementów w fresh DOM przez ścieżkę CSS.
function refreshBaselines() {
  const sections = $$('section[id], header.nav, footer.foot', state.doc);
  state.parsedSections.forEach(parsed => {
    const freshSec = sections.find(s => (s.id || s.tagName.toLowerCase()) === parsed.id);
    if (!freshSec) return;
    parsed.element = freshSec;
    parsed.fields.forEach(field => {
      try {
        const fresh = field.path
          ? freshSec.querySelector(field.path.split(' > ').map(s => s).join(' > '))
          : null;
        if (fresh) {
          field.element = fresh;
          field.originalOuterHTML = fresh.outerHTML;
          field.originalInnerHTML = fresh.innerHTML;
        }
      } catch (_) {}
    });
  });
}

function extractFields(sec, sectionId) {
  const seen = new Set();
  const fields = [];

  $$(EDITABLE_SEL, sec).forEach(el => {
    if (seen.has(el)) return;
    if (el.matches(SKIP_SEL)) return;
    if (el.closest(SKIP_SEL)) return;
    if (!el.textContent.trim()) return;

    // Skip if a parent up to sec is also in EDITABLE_SEL — avoid duplicates
    let parent = el.parentElement;
    let nested = false;
    while (parent && parent !== sec) {
      if (parent.matches(EDITABLE_SEL) && !parent.matches(SKIP_SEL) && !parent.closest(SKIP_SEL)) {
        nested = true;
        break;
      }
      parent = parent.parentElement;
    }
    if (nested) return;

    seen.add(el);

    const path = cssPathOf(el, sec);
    const key = `${sectionId}::${path}`;
    const label = labelForField(el, sectionId, fields.length);
    fields.push({
      element: el,
      key,
      path,
      label,
      originalOuterHTML: el.outerHTML,
      originalInnerHTML: el.innerHTML,
    });
  });
  return fields;
}

function cssPathOf(el, scope) {
  const parts = [];
  let cur = el;
  while (cur && cur !== scope && cur.nodeType === 1) {
    const parent = cur.parentNode;
    if (!parent) break;
    const sameTag = Array.from(parent.children).filter(c => c.tagName === cur.tagName);
    const idx = sameTag.indexOf(cur) + 1;
    parts.unshift(`${cur.tagName.toLowerCase()}:nth-of-type(${idx})`);
    cur = parent;
  }
  return parts.join(' > ');
}

function labelForField(el, sectionId, idxInSection) {
  // 1. Explicit label from SECTION_LABELS
  const labels = SECTION_LABELS[sectionId] || {};
  for (const [sel, lbl] of Object.entries(labels)) {
    try { if (el.matches(sel)) return lbl; } catch (_) {}
  }
  // 2. Generic by class
  const cls = el.className || '';
  if (cls.includes('ticker__item')) return 'Postulat na pasku';
  if (cls.includes('syn__chip')) return 'Etykieta bloku fabuły';
  if (cls.includes('quote__meta')) return 'Meta cytatu (timecode)';
  if (cls.includes('case__v')) return 'Wartość pola dossier';
  if (cls.includes('case__k')) return 'Etykieta pola dossier';
  if (cls.includes('dossier__role')) return 'Stanowisko bohatera';
  if (cls.includes('dossier__rank')) return 'Stopień / rola';
  if (cls.includes('dossier__code')) return 'Kod dossier';
  if (cls.includes('dossier__name')) return 'Imię i nazwisko bohatera';
  if (cls.includes('dossier__alias')) return 'Pseudonim';
  if (cls.includes('dossier__tags')) return 'Tag bohatera';
  if (cls.includes('dossier__chart-k')) return 'Etykieta w karcie';
  if (cls.includes('dossier__chart-v')) return 'Wartość w karcie';
  if (cls.includes('dossier__portrait-tag')) return 'Etykieta portretu';
  if (cls.includes('tome__sub')) return 'Podtytuł tomu';
  if (cls.includes('tome__pill')) return 'Status tomu';
  if (cls.includes('fmt__meta')) return 'Meta formatu (specyfikacja)';
  if (cls.includes('fmt__badge')) return 'Numer formatu';
  if (cls.includes('fmt__ribbon')) return 'Wstążka (BESTSELLER…)';
  if (cls.includes('btn__label')) return 'Tekst przycisku';
  if (cls.includes('section__num')) return 'Numer sekcji';
  if (cls.includes('section__sub')) return 'Podtytuł sekcji';
  if (cls.includes('author__plate-tag')) return 'Etykieta sygnatury';
  if (cls.includes('author__plate-name')) return 'Sygnatura imię/nazwisko';
  if (cls.includes('author__plate-sub')) return 'Sygnatura podpis';
  if (cls.includes('press__badge')) return 'Etykieta recenzji (źródło)';
  if (cls.includes('press__author')) return 'Autor recenzji';
  if (cls.includes('aspects__title')) return 'Tytuł aspektu śledztwa';
  if (cls.includes('preorder__label')) return 'Etykieta pola formularza';
  if (cls.includes('preorder__check')) return 'Tekst zgody';
  if (cls.includes('foot__title')) return 'Tytuł stopki';
  if (cls.includes('foot__sub')) return 'Podpis stopki';
  if (cls.includes('case__stamp')) return 'Pieczęć CLASSIFIED';
  if (cls.includes('case__sub')) return 'Klauzula';
  if (cls.includes('case__pullsig')) return 'Podpis pod cytatem motywu';
  if (cls.includes('hero__motto')) return 'Motto pod tytułem';
  if (cls.includes('hero__lede')) return 'Krótki opis pod motto';
  if (cls.includes('live-badge')) return 'Pasek LIVE (transmisja)';
  if (cls.includes('countdown__label')) return 'Nagłówek odliczania';

  // 3. By tag with preview
  const text = el.textContent.trim();
  const preview = text.length > 60 ? text.slice(0, 57) + '…' : text;
  const tag = el.tagName.toLowerCase();
  const tagMap = {
    h1: 'Tytuł główny',
    h2: 'Nagłówek',
    h3: 'Pod-nagłówek',
    h4: 'Mniejszy nagłówek',
    p:  'Akapit',
    blockquote: 'Cytat',
    figcaption: 'Podpis',
    li: 'Punkt listy',
  };
  return `${tagMap[tag] || tag.toUpperCase()} — „${preview}"`;
}

function render() {
  const root = $('#content');
  root.innerHTML = '';

  const sidebar = $('#section-list');
  sidebar.innerHTML = '';
  $('#section-count').textContent = state.parsedSections.length + ' sekcji';

  state.parsedSections.forEach(({ id, element: sec, fields }) => {
    const meta = SECTION_META[id] || { label: id, sub: '' };
    const isHidden = state.hiddenSections.has(id);

    // sidebar link
    const link = document.createElement('a');
    link.className = 'sidebar__link';
    link.dataset.target = id;
    link.href = `#card-${id}`;
    if (isHidden) link.classList.add('is-hidden-section');
    link.innerHTML = `<span>${meta.label}</span><span class="sidebar__link-badge">${fields.length}</span>`;
    link.addEventListener('click', e => {
      e.preventDefault();
      $$('.sidebar__link').forEach(l => l.classList.remove('is-active'));
      link.classList.add('is-active');
      const card = $(`#card-${id}`);
      if (card) card.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    sidebar.appendChild(link);

    // card
    const card = document.createElement('div');
    card.className = 'card';
    card.id = `card-${id}`;
    if (isHidden) card.classList.add('is-hidden');

    const head = document.createElement('div');
    head.className = 'card__head';
    head.innerHTML = `
      <div>
        <h2 class="card__title">${meta.label}</h2>
        <div class="card__sub">${meta.sub}</div>
      </div>
    `;
    // toggle (skip for header/footer/hero — hero is always main)
    if (sec.tagName === 'SECTION' && id !== 'hero') {
      const tog = document.createElement('label');
      tog.className = 'toggle';
      tog.innerHTML = `
        <input type="checkbox" ${isHidden ? '' : 'checked'} data-section-toggle="${id}">
        <span class="toggle__track"></span>
        <span>Pokazuj na stronie</span>
      `;
      tog.querySelector('input').addEventListener('change', e => {
        if (e.target.checked) state.hiddenSections.delete(id);
        else state.hiddenSections.add(id);
        card.classList.toggle('is-hidden', !e.target.checked);
        link.classList.toggle('is-hidden-section', !e.target.checked);
        markDirty();
        saveDraftDebounced();
      });
      head.appendChild(tog);
    }
    card.appendChild(head);

    const body = document.createElement('div');
    body.className = 'card__body';
    if (!fields.length) {
      body.innerHTML = `<div class="field__hint">W tej sekcji nie ma pól tekstowych.</div>`;
    } else {
      fields.forEach(f => body.appendChild(renderField(f, id)));
    }
    card.appendChild(body);

    root.appendChild(card);
  });

  const first = $('.sidebar__link');
  if (first) first.classList.add('is-active');
}

function renderField(field, sectionId) {
  const { key, label, originalInnerHTML } = field;

  const wrap = document.createElement('div');
  wrap.className = 'field';
  wrap.dataset.key = key;

  // Label
  const lbl = document.createElement('div');
  lbl.className = 'field__label';
  lbl.innerHTML = `<span class="field__name">${label}</span>`;
  wrap.appendChild(lbl);

  // Detect rich content (has inline markup) — show toolbar if so OR if textContent is long
  const hasMarkup = /<(em|strong|i|b|span)\b/i.test(originalInnerHTML);
  const text = field.element.textContent.trim();
  const isLong = text.length > 80;
  const isMono = field.element.matches('.mono, .ticker__item, .syn__chip, .quote__meta, .dossier__role, .dossier__rank, .dossier__code, .tome__sub, .fmt__meta, .case__v, .case__k, .live-badge, .countdown__label, .case__filehead span, .author__contact a, .final__date, .foot__sub, .section__num, .section__sub, .syn__num, .author__num, .preorder__label, .preorder__check span, .case__stamp, .case__sub, .author__plate-sub, .author__plate-tag, .hero__packshot-tag, .hero__packshot-code, .dossier__chart-k, .dossier__chart-v, .dossier__tags span, .dossier__portrait-tag, .fmt__badge, .fmt__ribbon, .aspects__head span');

  // Toolbar for rich text
  let toolbar = null;
  if (isLong || hasMarkup) {
    toolbar = document.createElement('div');
    toolbar.className = 'editor__toolbar';
    toolbar.innerHTML = `
      <button type="button" class="editor__tool" data-cmd="bold" title="Pogrub (Ctrl+B)"><strong>B</strong></button>
      <button type="button" class="editor__tool" data-cmd="italic" title="Kursywa (Ctrl+I)"><em>I</em></button>
      <button type="button" class="editor__tool" data-cmd="hl" title="Podświetl jadowicie">▒</button>
      <button type="button" class="editor__tool" data-cmd="clear" title="Usuń formatowanie">⌫</button>
      <span class="editor__sep"></span>
      <button type="button" class="editor__tool editor__tool--reset" data-cmd="reset" title="Wróć do oryginału">↺</button>
    `;
    wrap.appendChild(toolbar);
  }

  // Editor — contentEditable div
  const editor = document.createElement('div');
  editor.className = 'editor';
  if (isMono) editor.classList.add('editor--mono');
  else if (!isLong && !hasMarkup) editor.classList.add('editor--single');
  else editor.classList.add('editor--rich');
  editor.contentEditable = 'true';
  editor.spellcheck = true;
  editor.lang = 'pl';
  editor.innerHTML = originalInnerHTML;

  // Paste: zachowaj kursywę / pogrubienie z Worda (sanityzacja whitelistą),
  // resztę spłaszcz do plain text.
  editor.addEventListener('paste', e => {
    e.preventDefault();
    const cd = e.clipboardData || window.clipboardData;
    const html = cd.getData('text/html');
    const text = cd.getData('text/plain');
    if (html) {
      const clean = sanitizeHTML(html);
      // Wstaw bezpiecznie — execCommand insertHTML jeśli dostępny, fallback do textu
      if (document.queryCommandSupported && document.queryCommandSupported('insertHTML')) {
        document.execCommand('insertHTML', false, clean);
      } else {
        document.execCommand('insertText', false, text);
      }
    } else {
      document.execCommand('insertText', false, text);
    }
  });

  // Input → mutation
  editor.addEventListener('input', () => {
    const newHTML = editor.innerHTML;
    if (newHTML === originalInnerHTML) {
      state.mutations.delete(key);
      wrap.classList.remove('is-changed');
    } else {
      state.mutations.set(key, {
        ...field,
        newInnerHTML: newHTML,
      });
      wrap.classList.add('is-changed');
    }
    markDirty();
    saveDraftDebounced();
  });

  // Block Enter for single-line fields (mono / short)
  if (!isLong) {
    editor.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
      }
    });
  }

  wrap.appendChild(editor);

  // Toolbar actions
  if (toolbar) {
    toolbar.querySelectorAll('.editor__tool').forEach(btn => {
      btn.addEventListener('mousedown', e => e.preventDefault()); // keep focus
      btn.addEventListener('click', () => {
        const cmd = btn.dataset.cmd;
        editor.focus();
        if (cmd === 'bold') document.execCommand('bold', false);
        else if (cmd === 'italic') document.execCommand('italic', false);
        else if (cmd === 'hl') wrapSelectionWithSpan(editor, 'hl');
        else if (cmd === 'clear') document.execCommand('removeFormat', false);
        else if (cmd === 'reset') {
          editor.innerHTML = originalInnerHTML;
          editor.dispatchEvent(new Event('input'));
        }
      });
    });
  }

  // Hint
  if (isLong || hasMarkup) {
    const hint = document.createElement('div');
    hint.className = 'field__hint';
    hint.textContent = 'Klikaj w tekst żeby edytować. Zaznacz fragment i użyj przycisków powyżej żeby dodać kursywę albo podświetlenie.';
    wrap.appendChild(hint);
  }

  return wrap;
}

function wrapSelectionWithSpan(editor, className) {
  const sel = window.getSelection();
  if (!sel || !sel.rangeCount) return;
  const range = sel.getRangeAt(0);
  if (range.collapsed) return;
  // If selection already in a span.hl, unwrap
  const ancestor = range.commonAncestorContainer.nodeType === 1
    ? range.commonAncestorContainer
    : range.commonAncestorContainer.parentElement;
  const inHl = ancestor && ancestor.closest && ancestor.closest('.' + className);
  if (inHl && editor.contains(inHl)) {
    // Unwrap
    const frag = document.createDocumentFragment();
    while (inHl.firstChild) frag.appendChild(inHl.firstChild);
    inHl.replaceWith(frag);
  } else {
    const span = document.createElement('span');
    span.className = className;
    span.appendChild(range.extractContents());
    range.insertNode(span);
  }
  editor.dispatchEvent(new Event('input'));
}

/* ---------- dirty state ---------- */
function hiddenDiff() {
  const orig = state.originalHiddenSections;
  const cur = state.hiddenSections;
  const diff = [];
  for (const id of cur) if (!orig.has(id)) diff.push({ id, op: 'hide' });
  for (const id of orig) if (!cur.has(id)) diff.push({ id, op: 'show' });
  return diff;
}

function markDirty() {
  const btn = $('#btn-save');
  const total = state.mutations.size + hiddenDiff().length;
  if (total > 0) {
    btn.classList.add('is-dirty');
    btn.textContent = `Zapisz zmiany (${total})`;
  } else {
    btn.classList.remove('is-dirty');
    btn.textContent = 'Zapisz zmiany';
  }
}

/* ---------- drafts ---------- */
function saveDraftDebounced() {
  clearTimeout(state.draftTimer);
  state.draftTimer = setTimeout(saveDraft, DRAFT_DEBOUNCE);
}
function saveDraft() {
  if (!state.sha) return;
  const data = {
    sha: state.sha,
    savedAt: Date.now(),
    mutations: Array.from(state.mutations.entries()).map(([key, m]) => ({
      key,
      sectionId: state.parsedSections.find(s => s.fields.some(f => f.key === key))?.id,
      label: m.label,
      newInnerHTML: m.newInnerHTML,
      originalOuterHTML: m.originalOuterHTML,
      originalInnerHTML: m.originalInnerHTML,
    })),
    hidden: Array.from(state.hiddenSections),
  };
  try {
    localStorage.setItem(DRAFT_PREFIX + state.sha, JSON.stringify(data));
    cleanupOldDrafts();
  } catch (e) {
    console.warn('Cannot save draft:', e);
  }
}
function loadDraft() {
  if (!state.sha) return null;
  const raw = localStorage.getItem(DRAFT_PREFIX + state.sha);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}
function restoreDraft(draft) {
  draft.mutations.forEach(m => {
    // Find current element in fields by key
    const sec = state.parsedSections.find(s => s.id === m.sectionId);
    if (!sec) return;
    const field = sec.fields.find(f => f.key === m.key);
    if (!field) return;
    state.mutations.set(m.key, {
      ...field,
      newInnerHTML: m.newInnerHTML,
    });
  });
  state.hiddenSections = new Set(draft.hidden);
  render();
  // Mark mutated fields
  state.mutations.forEach((_, key) => {
    const wrap = $(`.field[data-key="${CSS.escape(key)}"]`);
    if (wrap) {
      wrap.classList.add('is-changed');
      const ed = wrap.querySelector('.editor');
      if (ed && state.mutations.has(key)) ed.innerHTML = state.mutations.get(key).newInnerHTML;
    }
  });
  markDirty();
  showToast(`Wczytano wersję roboczą (${state.mutations.size} pól)`, 'success');
}
function clearDraft() {
  if (!state.sha) return;
  localStorage.removeItem(DRAFT_PREFIX + state.sha);
}
function cleanupOldDrafts() {
  const drafts = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith(DRAFT_PREFIX)) {
      try {
        const d = JSON.parse(localStorage.getItem(k));
        drafts.push({ key: k, savedAt: d.savedAt });
      } catch (_) {}
    }
  }
  drafts.sort((a, b) => b.savedAt - a.savedAt);
  drafts.slice(MAX_DRAFTS).forEach(d => localStorage.removeItem(d.key));
}

/* ---------- save (string-based replace) ---------- */
async function save() {
  const btn = $('#btn-save');
  if (btn.classList.contains('is-saving')) return;
  if (state.mutations.size === 0 && hiddenDiff().length === 0) {
    showToast('Brak zmian do zapisania', 'info');
    return;
  }
  btn.classList.add('is-saving');
  btn.disabled = true;

  try {
    const result = await attemptSave(state.rawHtml, state.sha, /* retries */ 1);
    state.rawHtml = result.newHtml;
    state.sha = result.newSha;
    state.originalHiddenSections = new Set(state.hiddenSections);
    state.mutations.clear();
    clearDraft();

    // Re-parse fresh DOM and refresh baselines (originalOuterHTML / innerHTML)
    // żeby kolejny save w tej samej sesji nie szukał stale fragmentu.
    state.doc = new DOMParser().parseFromString(state.rawHtml, 'text/html');
    refreshBaselines();

    $$('.field.is-changed').forEach(f => f.classList.remove('is-changed'));
    markDirty();
    $('#save-modal').hidden = false;
  } catch (err) {
    if (/(401|403)/i.test(err.message) || err.statusCode === 401 || err.statusCode === 403) {
      state.pendingSave = true;
      localStorage.removeItem('liber-pat');
      $('#auth-modal').hidden = false;
      showToast('Token wygasł. Zaloguj ponownie żeby dokończyć zapis.', 'error');
    } else if (err.statusCode === 409) {
      showConflictModal();
    } else {
      showToast(err.message, 'error');
    }
  } finally {
    btn.classList.remove('is-saving');
    btn.disabled = false;
  }
}

async function attemptSave(baseHtml, baseSha, retries) {
  // 1. Apply mutations + hidden state to baseHtml using string replace
  let newHtml = baseHtml;

  // Apply mutations (originalOuterHTML → newOuterHTML)
  for (const [, m] of state.mutations) {
    const newOuter = m.originalOuterHTML.replace(
      // Replace innerHTML inside outerHTML
      // Structure: <TAG ...>INNER</TAG>
      /^(<[^>]+>)([\s\S]*)(<\/[^>]+>)$/,
      (_, open, _inner, close) => open + m.newInnerHTML + close
    );
    if (newHtml.includes(m.originalOuterHTML)) {
      newHtml = newHtml.replace(m.originalOuterHTML, newOuter);
    } else {
      throw new Error(`Nie znalazłem fragmentu „${m.label}" w pliku. Odśwież panel i spróbuj ponownie.`);
    }
  }

  // Apply hidden state — modify section opening tags
  $$('section[id]', state.doc).forEach(sec => {
    // Currently we serialize doc only as fallback; we modify rawHtml string directly.
  });
  // Strategy for hidden sections: regex on `<section ... id="ID" ... class="...">`
  for (const sec of state.parsedSections) {
    if (sec.element.tagName !== 'SECTION') continue;
    const id = sec.id;
    const shouldBeHidden = state.hiddenSections.has(id);
    const sectionRegex = new RegExp(`(<section\\b[^>]*\\bid="${id}"[^>]*?)(\\sclass="[^"]*")?([^>]*>)`, 'i');
    newHtml = newHtml.replace(sectionRegex, (full, before, cls, after) => {
      let classes = (cls || '').replace(/^\sclass="|"$/g, '').replace(/^\s*class="/, '').split(/\s+/).filter(Boolean);
      classes = classes.filter(c => c !== 'is-hidden-section');
      if (shouldBeHidden) classes.push('is-hidden-section');
      const newCls = classes.length ? ` class="${classes.join(' ')}"` : '';
      return before + newCls + after;
    });
  }

  // 2. PUT
  const body = {
    message: `Edycja treści (${state.mutations.size} pól${hiddenDiff().length ? ', ' + hiddenDiff().length + ' sekcji' : ''})`,
    content: encodeBase64(newHtml),
    sha: baseSha,
    branch: BRANCH,
  };
  const r = await fetch(`${API}/repos/${REPO}/contents/${FILE_PATH}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${state.token}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (r.status === 409 && retries > 0) {
    // Refetch latest and try once more
    const refresh = await fetch(`${API}/repos/${REPO}/contents/${FILE_PATH}?ref=${BRANCH}&t=${Date.now()}`, {
      headers: { 'Authorization': `Bearer ${state.token}`, 'Accept': 'application/vnd.github.v3+json' }
    });
    if (!refresh.ok) throw Object.assign(new Error('Konflikt — odśwież panel.'), { statusCode: 409 });
    const fresh = await refresh.json();
    const freshHtml = decodeBase64(fresh.content);
    // Check if our originalOuterHTMLs still exist in the fresh file
    const allFound = Array.from(state.mutations.values()).every(m => freshHtml.includes(m.originalOuterHTML));
    if (!allFound) throw Object.assign(new Error('Treści zostały zmienione w trakcie edycji.'), { statusCode: 409 });
    return attemptSave(freshHtml, fresh.sha, retries - 1);
  }
  if (r.status === 401 || r.status === 403) {
    throw Object.assign(new Error('Brak uprawnień'), { statusCode: r.status });
  }
  if (!r.ok) {
    const txt = await r.text();
    throw new Error(`Błąd zapisu (${r.status}): ${txt.slice(0, 140)}`);
  }
  const result = await r.json();
  return { newHtml, newSha: result.content.sha };
}

function showConflictModal() {
  const modal = $('#conflict-modal');
  if (!modal) {
    showToast('Konflikt zmian — odśwież panel.', 'error');
    return;
  }
  modal.hidden = false;
}

/* ---------- safety ---------- */
window.addEventListener('beforeunload', e => {
  if (state.mutations.size > 0 || hiddenDiff().length > 0) {
    e.preventDefault();
    e.returnValue = '';
  }
});

/* ---------- init ---------- */
$('#auth-submit').addEventListener('click', authSubmit);
$('#auth-token').addEventListener('keydown', e => { if (e.key === 'Enter') authSubmit(); });
$('#btn-save').addEventListener('click', save);
$('#btn-logout').addEventListener('click', logout);
$('#save-modal-close').addEventListener('click', () => $('#save-modal').hidden = true);

// Conflict modal handlers
const conflictReload = $('#conflict-reload');
if (conflictReload) conflictReload.addEventListener('click', () => { saveDraft(); location.reload(); });
const conflictCancel = $('#conflict-cancel');
if (conflictCancel) conflictCancel.addEventListener('click', () => { $('#conflict-modal').hidden = true; });

// Mobile sidebar toggle
const sidebarBtn = $('#btn-sidebar');
if (sidebarBtn) {
  sidebarBtn.addEventListener('click', () => {
    const sb = $('#sidebar');
    sb.classList.toggle('is-open');
    sidebarBtn.setAttribute('aria-expanded', sb.classList.contains('is-open') ? 'true' : 'false');
  });
  // Auto close after section click on mobile
  document.addEventListener('click', e => {
    const link = e.target.closest('.sidebar__link');
    if (link && matchMedia('(max-width: 800px)').matches) {
      $('#sidebar').classList.remove('is-open');
      sidebarBtn.setAttribute('aria-expanded', 'false');
    }
  });
}

// keyboard shortcut: Ctrl+S = save
document.addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && e.key === 's') {
    e.preventDefault();
    save();
  }
});

if (checkAuth()) load();
