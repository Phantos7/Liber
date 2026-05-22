/* =====================================================
   LIBER — panel edycji (app.js)
   ===================================================== */

const REPO = 'Phantos7/Liber';
const BRANCH = 'main';
const FILE_PATH = 'index.html';
const API = 'https://api.github.com';

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

const SECTION_META = {
  hero:     { label: 'Powitanie',           sub: 'Hero · tytuł, motto, okładka, countdown' },
  ticker:   { label: 'Pasek postulatów',    sub: 'Ticker · przewijające hasła' },
  sprawa:   { label: 'Akta sprawy',         sub: '01 / dossier · abstract · cytat' },
  synopsis: { label: 'Fabuła',              sub: '02 / streszczenie po blokach' },
  zespol:   { label: 'Bohaterowie',         sub: '03 / Beta, Konrad, Grażyna + aspekty śledztwa' },
  cytaty:   { label: 'Cytaty z transkryptu',sub: '04 / fragmenty taśmy' },
  opinie:   { label: 'Opinie',              sub: '05 / pre-czytelnicy' },
  trylogia: { label: 'Trylogia',            sub: '06 / LIBER · EXTREMA · KOLAPS' },
  formaty:  { label: 'Wydania (pre-order)', sub: '07 / miękka · e-book · audiobook' },
  zapisy:   { label: 'Formularz rezerwacji',sub: '// lista zapisów' },
  autorka:  { label: 'O autorce',           sub: '08 / J.F. Bielak' },
  final:    { label: 'Wezwanie końcowe',    sub: 'CTA · zarezerwuj egzemplarz' },
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
  '.countdown__label','.countdown__u',
  '.live-badge',
  '.final__date','.foot__sub','.foot__title',
  '.section__sub','.section__num','.syn__num','.syn__sub','.author__num',
  '.author__plate-name','.author__plate-sub','.author__plate-tag',
  '.hero__eyebrow span',
  '.aspects__head span','.aspects__title',
  '.preorder__label','.preorder__check span','.preorder__note','.perk-dot + span',
  '.author__contact a',
  '.nav__brand','.nav__cta span',
  '.case__filehead span',
].join(',');

const SKIP_SEL = [
  'script','style','svg','path','use','link','meta','noscript',
  '.cursor','.cursor-dot','.grain','.scanlines','.vignette',
  '.hero__fog *','.hero__crosshair *','.hero__scroll',
  '.countdown__num','.live-badge__dot','.live-badge__time',
  '.countdown__pulse','.live-badge__dot',
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
  'nav.nav__links',
  'nav.nav__links *',
  '[aria-hidden="true"]',
].join(',');

const state = {
  token: null,
  sha: null,
  doc: null,
  rawHtml: null,
  mutations: new Map(),   // selector → { newHTML, originalHTML }
  hiddenSections: new Set(),
  activeSectionId: null,
};

/* ---------- utils ---------- */
function decodeBase64(b64) {
  const clean = b64.replace(/\s/g, '');
  const bin = atob(clean);
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
  showToast._t = setTimeout(() => t.hidden = true, 4200);
}
function showLoading(visible, label) {
  $('#loading').hidden = !visible;
  if (label) $('#loading-label').textContent = label;
}

/* ---------- selectors (stable path) ---------- */
function cssPathOf(el, scope) {
  // path relative to scope (section) — uses tag + nth-of-type for stability
  const parts = [];
  let cur = el;
  while (cur && cur !== scope && cur.nodeType === 1) {
    const tag = cur.tagName.toLowerCase();
    const parent = cur.parentNode;
    if (!parent) break;
    const sameTag = Array.from(parent.children).filter(c => c.tagName === cur.tagName);
    const idx = sameTag.indexOf(cur) + 1;
    parts.unshift(`${tag}:nth-of-type(${idx})`);
    cur = parent;
  }
  return parts.join(' > ');
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
  if (!/^github_pat_|^ghp_/.test(tok)) {
    if (!confirm('Token wygląda nietypowo. Kontynuować?')) return;
  }
  localStorage.setItem('liber-pat', tok);
  state.token = tok;
  $('#auth-modal').hidden = true;
  $('#auth-token').value = '';
  load();
}
function logout() {
  if (state.mutations.size && !confirm('Masz niezapisane zmiany. Na pewno wyloguj?')) return;
  localStorage.removeItem('liber-pat');
  location.reload();
}

/* ---------- load ---------- */
async function load() {
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
    // Read existing hidden sections
    state.hiddenSections.clear();
    $$('section[id]', state.doc).forEach(sec => {
      if (sec.classList.contains('is-hidden-section')) state.hiddenSections.add(sec.id);
    });
    render();
    $('#btn-preview').hidden = false;
    $('#btn-save').hidden = false;
    $('#btn-logout').hidden = false;
    $('#sidebar').hidden = false;
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

/* ---------- render ---------- */
function render() {
  const root = $('#content');
  root.innerHTML = '';

  const sections = $$('section[id], header.nav, footer.foot', state.doc);
  const sidebar = $('#section-list');
  sidebar.innerHTML = '';
  $('#section-count').textContent = sections.length + ' sekcji';

  sections.forEach(sec => {
    const id = sec.id || sec.tagName.toLowerCase();
    const meta = SECTION_META[id] || { label: prettyName(id), sub: '' };

    // sidebar link
    const link = document.createElement('a');
    link.className = 'sidebar__link';
    link.dataset.target = id;
    link.href = `#card-${id}`;
    link.innerHTML = `<span>${meta.label}</span><span class="sidebar__link-badge">${countEditable(sec)}</span>`;
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
    if (state.hiddenSections.has(id)) card.classList.add('is-hidden');
    if (!SECTION_META[id]) card.dataset.unknown = '1';

    // head
    const head = document.createElement('div');
    head.className = 'card__head';
    head.innerHTML = `
      <div>
        <h2 class="card__title">${meta.label}</h2>
        <div class="card__sub">${meta.sub}</div>
      </div>
    `;
    // visibility toggle (skip for header/footer/nav)
    if (sec.tagName === 'SECTION' && id !== 'hero') {
      const tog = document.createElement('label');
      tog.className = 'toggle';
      const isShown = !state.hiddenSections.has(id);
      tog.innerHTML = `
        <input type="checkbox" ${isShown ? 'checked' : ''} data-section-toggle="${id}">
        <span class="toggle__track"></span>
        <span>Pokazuj na stronie</span>
      `;
      tog.querySelector('input').addEventListener('change', e => {
        if (e.target.checked) state.hiddenSections.delete(id);
        else state.hiddenSections.add(id);
        card.classList.toggle('is-hidden', !e.target.checked);
        link.classList.toggle('is-hidden-section', !e.target.checked);
        markDirty();
      });
      head.appendChild(tog);
    }
    card.appendChild(head);

    // body — fields
    const body = document.createElement('div');
    body.className = 'card__body';
    const fields = extractFields(sec);
    if (!fields.length) {
      body.innerHTML = `<div class="field__hint">W tej sekcji nie ma pól tekstowych do edycji.</div>`;
    } else {
      fields.forEach(f => body.appendChild(renderField(f, sec, id)));
    }
    card.appendChild(body);

    root.appendChild(card);
  });

  // first link active
  const first = $('.sidebar__link');
  if (first) first.classList.add('is-active');
}

function prettyName(id) {
  return id.replace(/-/g, ' ').replace(/^./, c => c.toUpperCase());
}

function countEditable(sec) {
  return extractFields(sec).length;
}

function extractFields(sec) {
  const all = new Set();
  // Match editable selectors
  $$(EDITABLE_SEL, sec).forEach(el => {
    if (el.matches(SKIP_SEL)) return;
    if (el.closest(SKIP_SEL)) return;
    if (!el.textContent.trim()) return;
    // skip if a parent is editable AND that parent will be edited (avoid nested duplication)
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
    all.add(el);
  });
  return Array.from(all);
}

function renderField(el, scope, sectionId) {
  const field = document.createElement('div');
  field.className = 'field';

  const text = el.textContent.trim();
  const isLong = text.length > 90;
  const path = cssPathOf(el, scope);
  const key = `${sectionId}::${path}`;

  // Label
  const lbl = document.createElement('div');
  lbl.className = 'field__label';
  lbl.innerHTML = `
    <span class="field__name">${humanizeTag(el)}</span>
    <span class="field__tag">${el.tagName.toLowerCase()}</span>
  `;
  field.appendChild(lbl);

  // Input
  let input;
  if (isLong) {
    input = document.createElement('textarea');
    input.className = 'field__textarea';
    input.rows = Math.min(8, Math.max(3, Math.ceil(text.length / 80)));
  } else {
    input = document.createElement('input');
    input.type = 'text';
    const tag = el.tagName.toLowerCase();
    input.className = 'field__input';
    if (['span','div','a'].includes(tag) || el.matches('.mono, .case__v, .case__k, .ticker__item, .syn__chip, .quote__meta, .dossier__role, .dossier__rank, .dossier__code, .tome__sub, .fmt__meta, .live-badge, .countdown__label, .case__filehead span, .author__contact a, .final__date, .foot__sub')) {
      input.classList.add('field__input--mono');
    }
  }
  input.value = serializeHTML(el);
  input.dataset.key = key;

  input.addEventListener('input', () => {
    state.mutations.set(key, {
      element: el,
      newHTML: input.value,
      originalHTML: serializeHTML(el),
    });
    field.classList.add('is-changed');
    markDirty();
  });

  field.appendChild(input);

  // Hint
  if (el.querySelector('em, strong, span, a')) {
    const hint = document.createElement('div');
    hint.className = 'field__hint';
    hint.textContent = 'Możesz używać <em>kursywy</em>, <strong>pogrubienia</strong> i <span class="hl">podświetlenia</span> (HTML).';
    field.appendChild(hint);
  }

  return field;
}

function humanizeTag(el) {
  const tag = el.tagName.toLowerCase();
  const cls = el.className || '';
  const map = {
    h1: 'Główny tytuł',
    h2: 'Nagłówek sekcji',
    h3: 'Pod-nagłówek',
    h4: 'Mniejszy nagłówek',
    p:  'Akapit',
    blockquote: 'Cytat',
    figcaption: 'Podpis',
    li: 'Punkt listy',
  };
  if (map[tag]) return map[tag];
  if (cls.includes('ticker__item')) return 'Postulat na pasku';
  if (cls.includes('syn__chip')) return 'Etykieta bloku';
  if (cls.includes('quote__meta')) return 'Meta cytatu (REC...)';
  if (cls.includes('case__v')) return 'Wartość pola';
  if (cls.includes('case__k')) return 'Nazwa pola';
  if (cls.includes('dossier__role')) return 'Stanowisko';
  if (cls.includes('dossier__rank')) return 'Stopień';
  if (cls.includes('dossier__code')) return 'Kod';
  if (cls.includes('dossier__tags')) return 'Tag';
  if (cls.includes('tome__sub')) return 'Podtytuł tomu';
  if (cls.includes('fmt__meta')) return 'Meta formatu';
  if (cls.includes('btn__label')) return 'Tekst przycisku';
  if (cls.includes('hero__packshot')) return 'Etykieta okładki';
  if (cls.includes('countdown__label')) return 'Nagłówek odliczania';
  if (cls.includes('live-badge')) return 'Pasek LIVE';
  if (cls.includes('final__date')) return 'Data w stopce';
  if (cls.includes('foot__title')) return 'Tytuł stopki';
  if (cls.includes('foot__sub')) return 'Podpis stopki';
  if (cls.includes('aspects__title')) return 'Tytuł aspektu śledztwa';
  if (cls.includes('preorder__label')) return 'Etykieta pola formularza';
  if (cls.includes('author__plate')) return 'Sygnatura autorki';
  if (cls.includes('case__stamp')) return 'Pieczęć CLASSIFIED';
  if (cls.includes('case__sub')) return 'Klauzula';
  if (cls.includes('case__filehead')) return 'Nagłówek pliku';
  if (cls.includes('section__sub')) return 'Podtytuł sekcji';
  if (cls.includes('section__num')) return 'Numer sekcji';
  return tag.toUpperCase();
}

function serializeHTML(el) {
  return el.innerHTML.trim();
}

/* ---------- mutations & save ---------- */
function markDirty() {
  const btn = $('#btn-save');
  if (state.mutations.size || state.hiddenSections.size !== originalHidden().size) {
    btn.classList.add('is-dirty');
    btn.textContent = `Zapisz zmiany (${state.mutations.size + diffHidden()})`;
  } else {
    btn.classList.remove('is-dirty');
    btn.textContent = 'Zapisz zmiany';
  }
}

function originalHidden() {
  const s = new Set();
  $$('section[id].is-hidden-section', new DOMParser().parseFromString(state.rawHtml, 'text/html')).forEach(sec => s.add(sec.id));
  return s;
}

function diffHidden() {
  const orig = originalHidden();
  let diff = 0;
  for (const id of state.hiddenSections) if (!orig.has(id)) diff++;
  for (const id of orig) if (!state.hiddenSections.has(id)) diff++;
  return diff;
}

async function save() {
  const btn = $('#btn-save');
  if (btn.classList.contains('is-saving')) return;
  if (!state.mutations.size && diffHidden() === 0) {
    showToast('Brak zmian do zapisania', 'info');
    return;
  }
  btn.classList.add('is-saving');
  btn.disabled = true;

  try {
    // Apply mutations to doc
    state.mutations.forEach(({ element, newHTML }) => {
      element.innerHTML = newHTML;
    });

    // Apply hidden sections
    $$('section[id]', state.doc).forEach(sec => {
      const id = sec.id;
      if (state.hiddenSections.has(id)) sec.classList.add('is-hidden-section');
      else sec.classList.remove('is-hidden-section');
    });

    // Serialize
    let newHtml = '<!doctype html>\n' + state.doc.documentElement.outerHTML;

    // Commit via GitHub API
    const message = `Edycja treści przez panel admin (${state.mutations.size} zmian${diffHidden() ? ', ' + diffHidden() + ' sekcji ukrytych/odkrytych' : ''})`;
    const body = {
      message,
      content: encodeBase64(newHtml),
      sha: state.sha,
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

    if (r.status === 409) throw new Error('Treść była zmieniona przez kogoś innego. Odśwież panel.');
    if (r.status === 401 || r.status === 403) throw new Error('Token nie ma uprawnień do zapisu.');
    if (!r.ok) {
      const txt = await r.text();
      throw new Error(`Błąd zapisu (${r.status}): ${txt.slice(0, 120)}`);
    }
    const result = await r.json();
    state.sha = result.content.sha;
    state.rawHtml = newHtml;
    state.mutations.clear();

    $('#save-modal').hidden = false;
    btn.classList.remove('is-dirty');
    btn.textContent = 'Zapisz zmiany';
    $$('.field.is-changed').forEach(f => f.classList.remove('is-changed'));
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    btn.classList.remove('is-saving');
    btn.disabled = false;
  }
}

/* ---------- safety ---------- */
window.addEventListener('beforeunload', e => {
  if (state.mutations.size || diffHidden() > 0) {
    e.preventDefault();
    return e.returnValue = '';
  }
});

/* ---------- init ---------- */
$('#auth-submit').addEventListener('click', authSubmit);
$('#auth-token').addEventListener('keydown', e => { if (e.key === 'Enter') authSubmit(); });
$('#btn-save').addEventListener('click', save);
$('#btn-logout').addEventListener('click', logout);
$('#save-modal-close').addEventListener('click', () => $('#save-modal').hidden = true);

if (checkAuth()) load();
