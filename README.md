# LIBER — strona premierowa

Strona internetowa premiery powieści **LIBER** (Joanna F. Bielak, Wydawnictwo Metafora, premiera 09.06.2026) — Tom I trylogii kryminalnej *Biuro Poszukiwań KGP*.

> *„Więzienie nie jest przeszkodą, by walczyć o prawa zwierząt."*

Kierunek wizualny: **Forensic Noir × Eco-Thriller** — kinematograficzny, ciemny, z motywami akt śledczych, transmisji live i taśmy z przesłuchań.

🔗 **Live:** https://phantos7.github.io/Liber/
🔗 **Panel edytora:** https://phantos7.github.io/Liber/admin/
🔗 **WP integracja (draft):** https://www.wydawnictwometafora.pl/?page_id=423&preview=true

> 📘 **Pełna dokumentacja:** [`PROJECT.md`](./PROJECT.md) (architektura, decyzje, status).
> 🔐 **Sekrety i loginy:** `CREDENTIALS.local.md` (lokalny, w `.gitignore`).

## Struktura

```
.
├── index.html       # markup, semantic sections, a11y
├── styles.css       # design system + motion
├── script.js        # loader, cursor, parallax, reveal, countdown, focus-trap, iframe postMessage
├── assets/          # obrazy (AVIF + WebP) i wideo (mp4)
├── admin/           # panel edytora (login + WYSIWYG)
├── worker/          # Cloudflare Worker proxy (auth + GitHub commit)
├── .tools/          # konwerter PNG → AVIF (sharp)
├── PROJECT.md       # pełna dokumentacja
└── README.md        # ten plik
```

## Lokalne uruchomienie

```bash
python -m http.server 5173
# albo
npx serve .
```

Następnie otwórz `http://localhost:5173/`.

## Stos

Vanilla HTML/CSS/JS · GitHub Pages · Cloudflare Worker (auth) · AVIF + WebP · WordPress (Blocksy + WooCommerce) — szczegóły w `PROJECT.md`.

## Sekcje

1. **Hero** — mglisty las, tytuł LIBER (glitch), motto, packshot, LIVE badge, countdown
2. **Ticker** — przewijające postulaty Liberatorów
3. **Akta sprawy** — papierowy dossier + cytat „miecz obosieczny"
4. **Fabuła** — sticky kolumna z wideo + 6 chunków storytellingu
5. **Zespół KGP** — Beta Sroka / Konrad „Cyber Dred" Weber / Grażyna Chojecka
6. **Aspekty** — biznes kosmetyczny / lobby futrzarskie / laboratoria / cyber-atak
7. **Cytaty** — 5 cytatów w stylu transkryptu z taśmy
8. **Opinie** — recenzje pre-czytelników
9. **Trylogia** — Tom I LIBER / Tom II EXTREMA / Tom III KOLAPS
10. **Formaty** — paperback / ebook / audiobook (linki do sklepu Metafory)
11. **Zapisy** — formularz rezerwacyjny
12. **Autorka** — J.F. Bielak, fot. Angelika Kubik · Theye.pl
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

## Kontakt

- Autorka: Joanna F. Bielak · betasroka@gmail.com
- Wydawnictwo: [Metafora](https://www.wydawnictwometafora.pl)
- Fot. autorki: Angelika Kubik · [theye.pl](https://theye.pl)

---

© 2026 · Wszelkie prawa zastrzeżone
