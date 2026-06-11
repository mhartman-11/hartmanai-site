# Hartman AI — site v4 "FLOW"

AI consulting site, futuristic dark skin. Vanilla HTML/CSS/JS, no build step. GitHub Pages.

Same content and brand hues as v3, completely different look: deep-forest dark theme,
one continuous WebGL flow field behind every section, glass surfaces, glow accents.

## Stack

- `index.html` — single-page scroll (hero, marquee, bento services, how-it-works, recent work, CTA panel, footer)
- `styles.css` — dark brand tokens (deep forest / cream / terracotta / ochre), glass + glow system, bento grid, Space Grotesk + Inter + JetBrains Mono via `<link>` (never `@import`)
- `flow.js` — full-page fixed WebGL background: domain-warped fbm silk in brand colors; drifts with scroll (`u_scroll`), warps around the cursor (`u_pointer`); renders at half resolution; never runs under prefers-reduced-motion (body gradient is the static fallback)
- `main.js` — hero line-mask entrance, terminal-style typing status word, scroll reveal, card tilt + spotlight, magnetic buttons, cursor glow, nav active-section pill, mobile menu
- `404.html`, `robots.txt`, `sitemap.xml` — GitHub Pages extras

## Conventions

- Single primary CTA sitewide: "Book a free audit" → https://mhartman-11.github.io/audit/ (Calendly is the secondary contact link in the footer)
- All motion gated behind `prefers-reduced-motion`; pointer effects behind `(pointer: fine)`
- Terracotta `#C35239` carries white text (4.58:1); small accent text on dark uses ochre, never terracotta (terracotta on deep forest is ~3.9:1 — display sizes only)
- No frameworks, no npm — keep it that way

## Development

```bash
npx http-server . -p 8765
```

## Deployment

GitHub Pages from `main` branch root of `mhartman-11/hartmanai-site`. Currently on the github.io URL (no CNAME). When hartmanai.com returns, update: CNAME file, `<link rel="canonical">`, all `og:`/`twitter:` URLs in `index.html`, `robots.txt`, `sitemap.xml`.

Site history: v2 archived as git tag `v2.0` / branch `v2-archive`; v3 (light editorial skin) archived at `Website 3.0/site/` — never deployed.
