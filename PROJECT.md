# LIBER — dokumentacja projektu

> Strona premierowa książki **LIBER** (Joanna F. Bielak, Wydawnictwo Metafora, 09.06.2026)
> Tom I trylogii kryminalnej *Biuro Poszukiwań KGP*.

Ten plik jest **uzupełnieniem `README.md`** — opisuje całą architekturę, decyzje i status,
żeby każdy, kto wraca do projektu (po przerwie albo w nowej sesji Claude), miał pełen kontekst.

Sekrety / hasła / tokeny są w osobnym `CREDENTIALS.local.md` (poza gitem).

---

## 0. Spis treści

1. [Cel i strategia](#1-cel-i-strategia)
2. [Stos technologiczny](#2-stos-technologiczny)
3. [Mapa plików](#3-mapa-plików)
4. [Pętla review (Plan → Execute → Evaluate)](#4-pętla-review)
5. [Iteracje — co się zmieniało](#5-iteracje)
6. [Optymalizacja obrazów (PNG → WebP → AVIF)](#6-optymalizacja-obrazów)
7. [Panel edytora dla Joanny + Cloudflare Worker](#7-panel-edytora--cloudflare-worker)
8. [Integracja z WordPress Metafory (iframe)](#8-integracja-z-wordpress-metafory)
9. [Pre-order i sklep](#9-pre-order-i-sklep)
10. [Status: co zrobione, co zostało](#10-status-projektu)
11. [Najczęstsze operacje (dev/deploy/edycja)](#11-najczęstsze-operacje)

---

## 1. Cel i strategia

**Problem wyjściowy:** istniejąca strona pod `wydawnictwometafora.pl/premiera/` była standardowym szablonem (WooCommerce + zdjęcia), bez "duszy" książki. Marcin chciał coś, co odda klimat kryminału (forensic noir, eko-terror, transmisje live).

**Strategia, na której skończyliśmy (po konsultacjach z Joanną):**

1. Statyczny, bogato animowany landing page hostowany na **GitHub Pages**: `phantos7.github.io/Liber/`.
2. Edycja treści przez **Joannę z panelu admin** — zapis przez **Cloudflare Worker proxy** do repo GitHub (bez instalowania niczego po jej stronie).
3. Pre-order przekierowuje do istniejącego **sklepu Metafory (WooCommerce + Tpay)** — żadnej duplikacji płatności.
4. Wpięcie pod `metafora.pl/premiera/` jako **iframe**, żeby:
   - W pasku adresu była domena Metafory (nie `github.io`).
   - Header Metafory zostawał na górze, footer Metafory na dole.
   - Środek = pełna LIBER landing z auto-resize (postMessage).

**Co odpada:**
- Brak frameworka (React/Next) — koszty buildu i analytics nieuzasadnione.
- Brak własnego backendu — nie chcemy utrzymywać serwera, kwestia bezpieczeństwa.
- Brak własnej obsługi płatności — Metafora ma działający Tpay.

---

## 2. Stos technologiczny

| Warstwa             | Wybór                                                                                  |
|---------------------|----------------------------------------------------------------------------------------|
| Markup              | Vanilla HTML5 (semantyczne `<section>`, ARIA, skip-link)                               |
| Style               | Vanilla CSS, własne tokeny (`--void`, `--bone`, `--liber`, `--evidence`, `--gold`)     |
| JS                  | Vanilla (rAF, IntersectionObserver, ResizeObserver, MutationObserver), bez bibliotek   |
| Typografia          | Google Fonts: **Cormorant Garamond** (display), **DM Sans** (body), **JetBrains Mono** |
| Obrazy              | AVIF (preferowany) → WebP (fallback) → `<picture>` z `<source>`                        |
| Wideo               | MP4 H.264 (1:1 ratio dla trailera, square format)                                      |
| Hosting strony      | GitHub Pages (publiczne repo, free, SSL)                                               |
| Hosting edytora     | Te same GitHub Pages — `/admin/`                                                       |
| Auth/proxy edytora  | Cloudflare Worker (Workers + KV opcjonalnie, na razie tylko HMAC sesja w cookie)       |
| Konwersja obrazów   | `sharp` (Node) — zachowuje alpha w AVIF (yuva420p działa, `ffmpeg` libsvtav1 nie)      |
| WordPress           | Blocksy theme + WooCommerce + Tpay (nie ruszamy)                                       |
| Integracja WP       | Gutenberg blok `wp:html` z `<iframe>` + `<style>` + `<script>` (postMessage listener)  |

---

## 3. Mapa plików

```
liber_new_webpage/
├── index.html                  # Markup — 13 sekcji, ~825 linii
├── styles.css                  # Design system + motion, ?v=13
├── script.js                   # Loader, cursor, parallax, countdown, focus-trap, postMessage, ?v=18
├── README.md                   # Krótki overview (publiczny)
├── PROJECT.md                  # Ten plik (publiczny)
├── CREDENTIALS.local.md        # SEKRETY (lokalny, w .gitignore)
├── assets/
│   ├── forest-bg.{avif,webp}              # Tło hero, q=100
│   ├── cover-paperback.{avif,webp}        # Okładka miękka (alpha)
│   ├── cover-ebook.{avif,webp}            # Okładka ebook (alpha)
│   ├── cover-audio.{avif,webp}            # Okładka audio (alpha)
│   ├── publisher-logo.{avif,webp}
│   ├── author-joanna.{avif,webp}          # Fot. Angelika Kubik · Theye.pl
│   ├── motto-clip.mp4                     # Hero motto loop
│   └── trailer-square.mp4                 # Zwiastun 1080×1080
├── admin/
│   ├── index.html                         # Panel edytora dla Joanny
│   ├── app.js                             # Logika edytora (WYSIWYG, sanitize, drafty, konflikty)
│   └── style.css
├── worker/
│   ├── wrangler.toml                      # Konfiguracja Cloudflare Workera
│   └── src/index.js                       # POST /api/login, GET/PUT /api/file
├── .tools/
│   └── convert-avif.js                    # Konwerter sharp PNG → AVIF (alpha)
├── .backup-metafora-wp/
│   └── page-120-premiera-20260523-111737.json   # Backup oryginalnej /premiera/
├── .review/                               # Wynik review Gemini/Codex (gitignore)
└── .gitignore
```

---

## 4. Pętla review

Każda iteracja przechodzi przez:

1. **Plan** — zdefiniuj cel (np. "naprawić funkcjonalność no-JS").
2. **Execute** — zaimplementuj.
3. **Evaluate** — Gemini i Codex w trybie xhigh oceniają w 3 kategoriach: **Look / Functionality / Motion Design**, każda 0–10. Cel: każda min. **8/10**.
4. Jeśli któraś poniżej 8 → wracamy do (1).

Wyniki review są w `.review/round{N}-{gemini|codex}.md` (gitignore, lokalnie).

---

## 5. Iteracje

| # | Co się działo                                                              |
|---|----------------------------------------------------------------------------|
| 1 | MVP — hero, ticker, dossier, sekcje, motion, loader                        |
| 2 | Hero packshot, mobile menu, pre-order maillinki                            |
| 3 | Funkcjonalność no-JS, lazy loading, focus-trap, ARIA                       |
| – | Wideo: 4:5 → 9:16 → 1:1 (square) — ostatecznie `trailer-square.mp4` 1:1    |
| – | Loader — czeka tylko na obrazy hero (nie na wideo); fix NaN przy MIN_DURATION=0 |
| – | Kompresja PNG → WebP (6 MB → 380 KB), potem q wyższe (q=93–100) dla jakości |
| – | Edytor: 4 iteracje (WYSIWYG, sanitize live, drafty, konflikt modal, reset bez closure, Enter wstawia `<br>` zamiast `<div>`) |
| – | Edytor opcja C: hasło + AES-GCM token → Worker proxy → GitHub              |
| – | AVIF + `<picture>` fallback (–80% rozmiar)                                 |
| – | AVIF z alpha (yuva420p) przez `sharp` — ffmpeg libsvtav1 nie wspiera       |
| – | Pre-order: banner wysyłki + sticky CTA pojawiające się po hero + pulse nav |
| – | Integracja z istniejącym sklepem Metafory (linki, ceny, promocja-badge)    |
| – | Zdjęcie autorki + email betasroka + link do wydawnictwometafora.pl zamiast tel |
| – | iframe embed na metafora.pl/premiera/ + auto-resize via postMessage        |
| – | Fix pętli rosnącego iframe — lock `--liber-vh` w trybie embedded           |

---

## 6. Optymalizacja obrazów

### Cel
PNG-i wejściowe miały 6 MB+ łącznie. Mobilni użytkownicy ładowaliby to zbyt długo.

### Pipeline
1. Skrypt `.tools/convert-avif.js` używa biblioteki `sharp` (nie `ffmpeg`!).
2. PNG → AVIF (q=70 dla zdjęć fotograficznych, q=85–100 dla obrazów z dużymi gradientami jak `forest-bg`).
3. Każdy obraz w `<picture>`:
   ```html
   <picture>
     <source srcset="assets/forest-bg.avif" type="image/avif" />
     <img src="assets/forest-bg.webp" alt="" />
   </picture>
   ```

### Dlaczego sharp, nie ffmpeg
`ffmpeg libsvtav1` w trybie still-picture **nie zachowuje kanału alpha** dla obrazów RGBA. `sharp` obsługuje `yuva420p` poprawnie.

### Rezultat
- `cover-paperback`: 733 KB → 147 KB (–80%)
- `forest-bg`: 6 MB → 303 KB (q=100, zero gradient banding)

---

## 7. Panel edytora + Cloudflare Worker

### Problem
Joanna nie zna gita ani GitHub PAT-a. Musi edytować treść z przeglądarki.

### Architektura
```
[Joanna w panelu admin] ─ POST /api/login (hasło) ──→ [Worker] ──→ ustawia HMAC cookie sesji
[Joanna edytuje]        ─ PUT /api/file ─────────────→ [Worker] ─ używa GITHUB_TOKEN ──→ [GitHub repo]
[GitHub Pages]           ← deployuje automatycznie ←──────────────────────────────────────┘
```

### Bezpieczeństwo
- GitHub PAT **nigdy** nie jest w kodzie klienta — tylko w sekretach Workera (`wrangler secret put`).
- Sesja Workera: cookie HMAC-SHA256(payload + SESSION_SECRET), expiry 7 dni.
- Worker waliduje origin + nonce + HMAC przy każdym żądaniu.

### Endpointy Workera (`worker/src/index.js`)
- `POST /api/login` — body `{ login, password }`, zwraca `Set-Cookie: session=...`.
- `GET /api/file?path=...` — pobiera zawartość pliku z GitHuba (Contents API).
- `PUT /api/file?path=...` — zapisuje (commit z message `Edycja treści (N pól)` od Joanny).

### UX edytora (`admin/app.js`)
- WYSIWYG edycja na `contenteditable` z sanitize iteracyjnym po każdej zmianie.
- Drafty zapisywane do `localStorage` co 2s.
- Conflict modal: jeśli ktoś inny zmienił plik w międzyczasie (GitHub SHA mismatch), Joanna widzi diff i wybiera "moja wersja" / "ich wersja" / "merge ręczny".
- Reset bez closure na `originalInnerHTML` — naprawa buga, w którym reset wracał do PRE-edit, nie PRE-zmiany.
- Enter wstawia `<br>` zamiast `<div>` (poprawka WYSIWYG, bo Chrome domyślnie tworzy `<div>` co psuje strukturę `<p>`).

---

## 8. Integracja z WordPress Metafory

### Plan
Wpiąć landing pod `wydawnictwometafora.pl/premiera/` — żeby:
- Pasek adresu pokazywał `wydawnictwometafora.pl`, nie `github.io`.
- Header i footer Metafory zostawały (kontynuacja brandu).

### Wybrana opcja: iframe (Opcja A)
- `github.io` jest tylko w **DevTools → Network**, nie w pasku adresu.
- Standardowy mechanizm, nie wymaga ingerencji w temat Blocksy.

### Strona testowa: WP page ID 423 (draft)
URL preview: `https://www.wydawnictwometafora.pl/?page_id=423&preview=true`

Treść strony (Gutenberg blok `wp:html`):
- `<style>` ukrywa tytuł, breadcrumbs i wymusza full-bleed (override `.ct-container-full` Blocksy + Gutenberg `is-layout-constrained`).
- `<iframe class="liber-embed-frame" src="https://phantos7.github.io/Liber/">` z `loading="eager"` i `allow="autoplay; fullscreen"`.
- `<script>` — parent listener `postMessage` od child iframe, ustawia `iframe.style.height = received.height`.

### Auto-resize (postMessage) — pętla i jej fix

**Pierwsze podejście (failed):**
- Child mierzył `documentElement.scrollHeight` i wysyłał do parenta.
- Parent ustawiał `iframe.style.height`.
- **Problem:** LIBER hero ma `min-height: 100vh`. Gdy parent powiększał iframe, `vh` w iframe rosło, hero rosło, scrollHeight rosło → **pętla nieskończona**, iframe sięgał 40000+ px.

**Fix (`script.js` + `styles.css`):**
- W `script.js` przy wejściu w tryb iframe:
  ```js
  document.documentElement.classList.add('liber-embedded');
  document.documentElement.style.setProperty(
    '--liber-vh',
    Math.max(640, Math.min(window.innerHeight || 800, 960)) + 'px'
  );
  ```
- W `styles.css`:
  ```css
  html.liber-embedded .hero { min-height: var(--liber-vh, 800px); }
  ```
- Wartość `--liber-vh` jest **liczona raz** (przy pierwszym ładowaniu iframe) i nie zmienia się przy późniejszym auto-resize. → wysokość hero stoi → pętla stabilizuje się przy ~13000 px.

### Plan finalizacji
1. ✅ Page 423 jako draft, layout poprawny.
2. ✅ Auto-resize stabilny.
3. ⏳ Akceptacja przez Joannę.
4. ⏳ Podmiana publicznej strony **page 120** (`/premiera/`) treścią z 423 (po backupie).

---

## 9. Pre-order i sklep

### Sklep
Metafora ma działającego WooCommerce + Tpay na `wydawnictwometafora.pl/sklep/`. Nie dotykamy.

### LIBER landing
- Sekcja "Formaty" ma 3 karty (paperback, ebook, audio).
- Każda karta linkuje **bezpośrednio do produktu Metafory** (`?add-to-cart=...` lub do strony produktu).
- Banner wysyłki nad sekcją: "Wysyłka od 09.06.2026 · gratis od 100 zł".
- Sticky CTA pojawia się dopiero **po przescrollowaniu hero** (nie zasłania glównego CTA).
- Nawigacja ma `pulse` na pozycji "Pre-order" co 6s.

---

## 10. Status projektu

### ✅ Gotowe
- Pełna strona LIBER na `phantos7.github.io/Liber/` (13 sekcji, motion, responsywne).
- Wszystkie review (Gemini + Codex) na ≥8/10 w Look / Functionality / Motion.
- Panel edytora dla Joanny + Cloudflare Worker proxy.
- AVIF + WebP fallback dla wszystkich obrazów.
- Integracja ze sklepem Metafory (linki do produktów, ceny, badge promocji).
- Zdjęcie autorki, kontakt (`betasroka@gmail.com` + link do wydawnictwometafora.pl).
- iframe na metafora.pl jako draft (page 423), full-bleed, tytuł ukryty.
- Auto-resize iframe via postMessage z lockiem `--liber-vh`.

### ⏳ W toku / do potwierdzenia
- Weryfikacja stabilności auto-resize na różnych viewportach (desktop / mobile).
- Akceptacja layoutu i treści przez Joannę.
- Podmiana opublikowanej strony 120 (`/premiera/`) na wariant z iframe.

### 📋 Brakujące dane (placeholdery do podmiany przez Joannę)
- Liczba stron książki — obecnie `360 str.` (placeholder).
- Długość audiobooka — obecnie `~11h` (placeholder).
- Ewentualna zmiana cen / promocji przed premierą.

### 💡 Opcjonalne / nice-to-have
- Custom domena (`liber.metafora.pl`?) — uniknięcie iframe.
- Analytics (Plausible / GA4) — wymaga decyzji RODO/cookies.
- Newsletter integration (Mailchimp / FreshMail) zamiast `mailto:`.

---

## 11. Najczęstsze operacje

### Lokalny dev
```bash
cd C:\Users\patry\Desktop\Joanna\liber_new_webpage
python -m http.server 5173
# albo: npx serve .
```
Otwórz `http://localhost:5173/`.

### Deploy strony
```bash
git add .
git commit -m "..."
git push origin main
# GitHub Pages auto-deploy w ~30–60s
```

Po deploy'u zawsze **bumpnij wersję cache-bustera** w `index.html`:
- `styles.css?v=N+1`
- `script.js?v=N+1`

### Deploy Workera
```bash
cd worker
wrangler deploy
```

Sekrety raz na zawsze (lub przy rotacji):
```bash
wrangler secret put GITHUB_TOKEN
wrangler secret put ADMIN_LOGIN
wrangler secret put ADMIN_PASSWORD
wrangler secret put SESSION_SECRET
```

### Edycja treści (Joanna)
1. Wchodzi na https://phantos7.github.io/Liber/admin/.
2. Loguje się (login + hasło).
3. Edytuje tekst inline (WYSIWYG).
4. "Zapisz" → Worker commituje na main → Pages redeployuje.

### Konwersja nowych obrazów do AVIF
```bash
cd .tools
node convert-avif.js ../assets/nowy-obraz.png ../assets/nowy-obraz.avif
```
Jakość regulowana w skrypcie (parametr `quality`).

### WP — edycja strony 423
1. Zaloguj się na https://www.wydawnictwometafora.pl/wp-admin/.
2. Strony → szukaj "PREMIERA — LIBER (test iframe)" (ID 423).
3. Edytuj blok `wp:html` (Custom HTML w Gutenbergu).
4. Zapisz jako draft / opublikuj.

### Backup strony WP (przed zmianą)
```bash
# Przykład pobrania treści page 120 via REST API:
curl -s "https://www.wydawnictwometafora.pl/wp-json/wp/v2/pages/120" \
  > .backup-metafora-wp/page-120-$(date +%Y%m%d-%H%M%S).json
```

---

*Wersja dokumentu: 2026-05-23 · utrzymywany ręcznie · update przy każdej zmianie architektury.*
