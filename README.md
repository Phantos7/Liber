# LIBER — strona premierowa

Strona internetowa premiery powieści **LIBER** (Joanna F. Bielak, Wydawnictwo Metafora, premiera 09.06.2026) — Tom I trylogii kryminalnej *Biuro Poszukiwań KGP*.

> *„Więzienie nie jest przeszkodą, by walczyć o prawa zwierząt."*

Kierunek wizualny: **Forensic Noir × Eco-Thriller** — kinematograficzny, ciemny, z motywami akt śledczych, transmisji live i taśmy z przesłuchań.

## Struktura

```
.
├── index.html       # markup, semantic sections, a11y
├── styles.css       # design system + motion
├── script.js        # loader, cursor, parallax (rAF), reveal, magnetic, tilt, split-words, countdown, focus-trap
├── assets/          # obrazy i wideo
│   ├── forest-bg.png
│   ├── cover-paperback.png
│   ├── cover-ebook.png
│   ├── cover-audio.png
│   ├── publisher-logo.png
│   ├── title-liber.png
│   ├── motto-clip.mp4
│   └── teaser.mp4
└── README.md
```

## Lokalne uruchomienie

Strona jest statyczna — wystarczy serwer plików, np.:

```bash
python -m http.server 5173
# albo
npx serve .
```

Następnie otwórz `http://localhost:5173/`.

## Sekcje

1. **Hero** — mglisty las (parallax), tytuł LIBER (glitch), motto, packshot okładki, LIVE badge, countdown do premiery
2. **Ticker** — przewijające postulaty Liberatorów
3. **Akta sprawy** — papierowy dossier z abstraktem + cytat „miecz obosieczny"
4. **Fabuła** — sticky kolumna z wideo + 6 chunków storytellingu (Wojna wszystkich ze wszystkimi)
5. **Zespół KGP** — 3 dossier (Beta Sroka / Konrad „Cyber Dred" Weber / Grażyna Chojecka) z forensic-style portretami (fingerprint / matrix log / redacted)
6. **Aspekty** — biznes kosmetyczny / lobby futrzarskie / laboratoria / cyber-atak
7. **Cytaty** — 5 cytatów w stylu transkryptu z taśmy
8. **Opinie** — 3 recenzje pre-czytelników (Panda z książką, Czytelniczy Sad, Misera.ble)
9. **Trylogia** — Tom I LIBER (active) / Tom II EXTREMA / Tom III KOLAPS
10. **Formaty** — miękka oprawa / e-book / audiobook (mailto pre-order)
11. **Zapisy** — pełen formularz rezerwacyjny
12. **Autorka** — J.F. Bielak, kontakt
13. **Final CTA** — *Otwórz akta. Wybierz stronę.*

## Design system

| Token         | Wartość        | Rola                      |
|---------------|----------------|---------------------------|
| `--void`      | `#060c08`      | tło bazowe                |
| `--abyss`     | `#08120e`      | sekcja drugiego rzędu     |
| `--moss`      | `#14241c`      | panele, kontenery         |
| `--bone`      | `#ece6d3`      | tekst nagłówków, papier   |
| `--liber`     | `#c8e62e`      | akcent limetka            |
| `--evidence`  | `#ff3b3b`      | alarm, transmisja LIVE    |
| `--gold`      | `#c9a961`      | accent premium            |

Typografia: **Cormorant Garamond** (display), **DM Sans** (body), **JetBrains Mono** (akta).

## Motion design

- Parallax tła hero (`requestAnimationFrame` + ticking flag + will-change)
- Glitch reveal tytułu LIBER (RGB-shift)
- Marquee ticker (pause on hover, fade edges)
- Pulsujący LIVE clock + live time
- Countdown z animacją slot-flip
- Custom magnetic cursor (z fallback dla touch / reduced-motion)
- Tilt 3D na kartach (dossier / press / formats)
- Reveal animations różne per sekcja (slide-X dla synopsis, blur dla quotes, rotate dla press)
- Scramble text na kartach aspektów (hover)
- Audio waveform animation (sekcja audiobook)
- Book float animation w hero
- IntersectionObserver pauzujący animacje poza viewport (oszczędność CPU)
- Pełne wsparcie `prefers-reduced-motion`

## Accessibility

- Skip-link
- `:focus-visible` style WCAG
- `sr-only` headline tickera
- aria-label, aria-expanded, aria-controls
- Focus-trap w menu mobilnym (Tab/Shift+Tab/Esc, return-focus)
- Semantyczna struktura header/main/section/footer
- `prefers-reduced-motion` także w JS

## Performance

- Lazy loading na obrazach poniżej hero (`loading="lazy"` + `decoding="async"`)
- Hero packshot/tło z `fetchpriority="high"`
- Video z `preload="metadata"`
- Loader z safety-net (max 2.5s czekania, 4.5s hard-kill)
- Heavy animations pauzowane poza viewport

## Kontakt

- Autorka: Joanna Bielak · joanbielak@gmail.com · +48 796 756 966
- Wydawnictwo: [Metafora](https://www.wydawnictwometafora.pl)

---

© 2026 · Wszelkie prawa zastrzeżone
