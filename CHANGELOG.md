# Changelog — Diego Martins Barbearia

Latest changes to the Diego Martins POS + public booking app
(diegomartins.clubemkt.digital). Dates in CET. Snapshot taken 2026-11-21.

Repo state at snapshot: branch `main`, working tree clean, **1 commit ahead of
`origin/main`** (`c5adf4e` — not pushed yet).

---

## 2026-11-21

### `c5adf4e` — feat(agendar): cross-fade slideshow transitions (UNPUSHED)
Files: `frontend/src/app/agendar/page.tsx`, `booking.css` (+117/−42)

- Slides no longer hard-cut to an empty frame: the outgoing slide stays
  mounted and fades out (`SLIDE_FADE_MS = 900`) while the incoming one fades
  in over it.
- Incoming slide runs its Ken Burns pan/zoom **and** the fade-in together;
  slide duration moved to a `--kb-dur` CSS variable so the inline
  `animationDuration` no longer clobbers the 900 ms fade.
- Motion and fade durations are now independent (per-slide
  `PHOTO_SLIDE_MS` / `VIDEO_SLIDE_MS` vs. a single fade constant).
- New CSS classes: `slideshow-fadein`, `slideshow-fadeout` alongside
  `slideshow-zoom` / `slideshow-pan`.

### `2eef6c1` — fix(db): columnExists read only the first PRAGMA row, crashing boot
File: `main/db.ts` (+4/−2)

- Root cause of the boot crash-loop: `columnExists()` used
  `PRAGMA table_info(users).get()`, but PRAGMA returns one row **per column** —
  `.get()` only ever read the first row (`id`), so the guard never matched and
  `ALTER TABLE users ADD COLUMN phone` ran on every boot. On any DB that
  already had `phone` this threw `SQLITE_ERROR: duplicate column name: phone`
  and systemd restarted the unit every ~3 s (visible in journal 01:01–01:02).
- Fix: reuse `getColumns()` (reads `.all()`) and test `.includes(column)`.
- Boots after the fix are clean: `Migrations complete`, `integrity_check: ok`.

### `734efeb` — feat(agendar): Ken Burns slideshow, hug hero photo, re-encode media
Files: `page.tsx` (+59), `booking.css` (+47), `scripts/dm-media.sh` (new, 107 lines),
20 media files in `frontend/public/dm/`

- Ken Burns motion on hero photos: per-asset `SLIDE_MOTION` (zoomTo/panX/panY)
  driven by CSS keyframes; separate photo vs. video slide durations.
- New hero photo `hero-hug.webp` (114 KB); hero hugs the photo frame.
- Media quality pass: shop/work photos re-rendered from full-res originals
  (e.g. `shop-3.webp` 55 KB → 389 KB); the 6 `work-*.mp4` clips re-encoded at
  720×404 / ~0.5–0.8 Mbps (old 480×270 @ 100–190 kbps looked pixelated).
- `scripts/dm-media.sh` rebuilds all of it from the originals in `imgs/`
  (`imgs/` is intentionally not in git).

## 2026-11-20

### `69f6b24` — feat(admin access panel): logo sidebar, full-width POS header
Files: `Sidebar.tsx`, `main/db.ts` (+21), `.gitignore`

- Admin sidebar shows `/dm/logo.svg` instead of a scissor icon:
  expanded = w-64 / h-10 logo, collapsed = w-16 / h-9; toggle via PanelLeft
  rotate-90. POS header now full-width.
- Backend: `migrateV1ToV2Backfill()` + `addColumnIfMissing()` /
  `columnExists()` helpers — idempotent backfill of `users.phone` for legacy
  v1 databases (fixes login 500 "no such column: phone").
  (The guard bug in this commit was fixed the next day by `2eef6c1`.)
- `.gitignore`: `backups/`.

### `e7430f6` — feat(agendar): success logo 2x + float; WhatsApp country code
Files: `page.tsx`, `booking.css`, `lib/booking-utils.ts`

- Booking success screen: logo doubled in size with a float animation.
- Identification step: WhatsApp country code is now selectable **and**
  typeable (defaults to Bolivia +591).

### `375cbbb` — style(agendar): compact service cards
File: `components/booking/service-card.tsx` (rewritten layout)

- Icon aligned with the title; duration + price moved onto the title line.

### `cafbd7f` — fix(agendar): remove category label footer from service cards

### `557b611` — fix(agendar): per-service copper icons
- Service cards show scissors / razor / combo / brow icons in copper instead
  of an empty box.

### `137acae` — feat(agendar): video slideshow + auto-scroll gallery
Files: `page.tsx`, `booking.css`, `smart-cart.tsx`, `app/icon.svg`,
6 new `frontend/public/dm/video/work-*.mp4`

- Hero slideshow gained 6 muted video clips appended to `SLIDESHOW_MEDIA`;
  gallery (`GALLERY_MEDIA`) auto-scrolls.
- Copper highlight on the CTA card and the SmartCart button; new app icon.

## 2026-11-19

### `ebae0ea` — docs: repo skill for clone/rebrand/deploy
- `skill/clone-rebrand-deploy/SKILL.md` (264 lines): playbook for cloning this
  base repo, rebranding it, and deploying onto the VPS.

### `0c3620b` — fix: desktop build compatibility (fonts + tsconfig)
Files: `frontend/src/app/layout.tsx`, `tsconfig.json`, `package.json`

- `NEXT_BUILD_MODE=desktop` now uses a system font stack instead of
  `next/font/google` (Cormorant Garamond / Inter): the static export cannot
  fetch Google Fonts at build time. CSS variables are kept so the UI doesn't
  break.

### `0b10473` — feat: WhatsApp login flow + booking page enhancements
Files: setup page, `highlight-card.tsx`, `service-card.tsx`, `store/auth.ts`,
agenda/dashboard pages; original WhatsApp photos added under `imgs/`.

### `a239027` — feat(agendar): new logo, slideshow hero, remove circle + hero text
- First webp asset set: `logo.webp`, `diegomartins-logo.webp`, `badge.webp`,
  `shop-1..4.webp`, `work-*.webp`.
- Slideshow hero replaces the old circle + hero text.
- Booking i18n introduced: `src/lib/i18n.ts`, ES default → PT → EN toggle,
  persisted in `localStorage dm_booking_lang`.
- `frontend/pnpm-lock.yaml` added.

## 2026-11-17

### `412310f` — feat: Diego Martins Barbearia POS — Salon domain model
51 files (+724/−648). The rebrand from Estética Radiante to Diego Martins:

- Palette: copper `#c98a4b` / wood / cream on charcoal `#16120e`
  (`brand.css`), replacing the old lime; `/dm/*` SVG assets replace `/er/*`.
- `main/db.ts`: Bolivia catalog + settings — Bs (BOB), America/La_Paz, +591
  phones; services `dm-corte` (100 Bs/40 min), `dm-barba` (80/30),
  `dm-cabello-barba` (160/70), `dm-cejas` (30/15), category `dm-cat-servicios`.
- Auth, booking, appointments, database routes and Electron entry updated for
  the new brand; README refreshed.

### Earlier foundation (2026-11-12 → 11-14, pre-rebrand)
Headless web entry (`dist/web.js`, data-dir override), appointment system
(`appointments` / `appointment_items`, schema v2, public booking endpoints),
same-origin `/api` resolution, pt-BR admin panel, WebSocket broadcast to the
admin panel on new bookings, mobile POS layout fixes.

---

## Production state — verified 2026-11-21

- `diegomartins.service` **active** since 01:07:42 CET (after the `2eef6c1`
  fix); `/api/health` → 200 both on localhost:3020 and via
  https://diegomartins.clubemkt.digital; `/agendar/` → 200.
- Frontend export rebuilt 05:42 (after `c5adf4e`): the live agendar chunk
  `page-2b01d90e308f7a46.js` is **sha256-identical** to the local
  `frontend/out` copy → the cross-fade slideshow is live.
- Backend `dist/` rebuilt 02:59; no `main/*.ts` modified since 00:59, so the
  running process (started 01:07) already executes the current backend code.
  A restart is only required when `main/` changes.
- DB `/var/lib/diegomartins/diegomartins.db`: schema v2, `users.phone`
  present. Users: `admin@diego.com` (owner, active),
  `barbeiro@diegomartins.local` (stylist, active), `diego@martins.com`
  (owner, deactivated). 2 appointments on record.
- The log still contains the pre-fix crash-loop (`duplicate column name:
  phone`, 01:01–01:02); every boot since 01:07 is clean.

## Outstanding

- `git push` — `c5adf4e` (cross-fade slideshow) is committed locally but not
  on `origin/main`.
- This changelog is uncommitted; commit it when convenient.
