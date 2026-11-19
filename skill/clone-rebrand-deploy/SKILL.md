# Clone, rebrand, and deploy — Diego Martins base repo

Provision a new ClubMkt store from the Diego Martins Barbearia base repo onto
the VPS, rebranded for a custom subdomain, mirroring the existing
`diegomartins` deployment.

## Scope

This skill handles the VPS/HTTP deployment path (headless command-server +
nginx proxy + systemd). It does NOT produce Electron installers — those are
built on Windows/macOS hosts (electron-builder cross-compilation is not
supported here).

## Pre-flight facts

- Base repo: `github.com:hudsonargollo/diegomartins.git` (branch `main`)
- Running deployment: `diegomartins.clubemkt.digital` → nginx vhost
  `/etc/nginx/sites-enabled/diegomartins` → `127.0.0.1:3020` (systemd
  `diegomartins.service`, `EnvironmentFile=/etc/diegomartins.env`, `PORT=3020`)
- Webkit/ingress: the `*.clubemkt.digital` wildcard in
  `/etc/nginx/sites-enabled/clubemkt-sites` proxies to `172.17.0.1:8100` (the
  krikkit docker container). Exact `server_name` blocks in `sites-enabled/`
  win over this wildcard.
- Database: SQLite WAL, per-tenant data directory. Electron uses
  `app.getPath('userData')`; headless uses `DIEGOMARTINS_DATA_DIR`
  (default `/var/lib/<name>`).
- Build output: `main/dist/` (typed `tsc`), `frontend/out/` (standalone
  Next.js export via `NEXT_BUILD_MODE=desktop`).

## What the skill does (new project)

1. Clone the base repo into `/root/ClubeMkt/<repo-folder>` (branch `main`).
2. Rebrand: set the business name, tagline, address, Instagram, logo, phone,
   WhatsApp, currency, timezone, colors, catalog text, frontmatter config, etc.
3. Fill the generated `.env` (secrets, `NEXT_PUBLIC_*` public URLs, SMS, Slack
   webhook, etc.).
4. Generate the headless `.env` for the VPS (`PORT`, `DIEGOMARTINS_DATA_DIR`,
   `JWT_SECRET`).
5. Generate the systemd unit `<name>.service`.
6. Generate the nginx vhost `<name>.clubemkt.digital`.
7. Build frontend (`NEXT_BUILD_MODE=desktop`) and backend (`tsc`).
8. Start via systemd, reload nginx, verify the URL.

## Step 0 — Prerequisites inside the skill

- The user supplies: `<name>` (lowercase hyphen-case, e.g. `diegomartins`),
  `repo-folder` (target folder name, e.g. `diegomartins`),
  `app-port` (e.g. `3020`), `db-port` (e.g. `5440`).
- The skill refuses if `<name>.service`, `/etc/nginx/sites-enabled/<name>`, or
  `<name>-db` already exist.
- The skill refuses if `<app-port>` or `<db-port>` is already in use.
- The skill does NOT build the Electron app or create installers.

## Step 1 — Clone

```bash
git clone -b main --single-branch git@github.com:hudsonargollo/diegomartins.git \
  /root/ClubeMkt/<repo-folder>
cd /root/ClubeMkt/<repo-folder>
git submodule update --init --recursive   # barbearia-ui submodule
```

## Step 2 — Rebrand (commands: `rebrand:<name>`)

The base repo is Diego Martins. Replace all Diego Martins / DM / `dm-` tokens
with the new shop's values. Categories and products share `dm-*` ids that must
stay stable (they are referenced by code and by the booking frontend).

### Files to touch (find with `grep -rn`)

| File | What to change |
|---|---|
| `main/db.ts` | `business_name`, `business_tagline`, `country`, `currency`, `currency_symbol`, `timezone`, `phone`, `whatsapp`, `instagram`, `email`, `loyalty_expiry_days`, `cloud_server_url`, `cloud_connected` |
| `main/db.ts` `seedBookingSettings()` | `loyalty_enabled`, `loyalty_threshold`, `loyalty_reward`, `booking_enabled`, `booking_open_time/close_time/slot_interval`, `booking_open_days`, `booking_advance_days`, `booking_lead_minutes`, `booking_stylist_name`, `booking_stylist_role`, `booking_policies` |
| `main/db.ts` `seedDiegoMartinsCatalog()` | category names, colors, icons, descriptions; product names, descriptions, prices, service durations |
| `frontend/src/app/agendar/page.tsx` | `LOGO`, `FALLBACK_INSTAGRAM`, `ADDRESS`, `MAPS_URL`, `SLIDESHOW_PHOTOS` (if any), localStorage key (`dm_booking_theme` → new prefix) |
| `frontend/src/app/agendar/layout.tsx` | title / metadata |
| `frontend/src/app/setup/page.tsx` | setup flow title / subtitle / WhatsApp number |
| `frontend/src/app/(dashboard)/agenda/page.tsx` | Dashboard title, booking/`Divulgar` button text |
| `frontend/src/components/booking/highlight-card.tsx` | names |
| `frontend/src/components/booking/service-card.tsx` | names |
| `package.json` | `name` → `<name>-desktop`, `description`, `author.name`, `author.email` |
| `README.md` | business name, slug |
| `main/server.ts` | `service` field in `/api/health` |
| `frontend/package.json` | `name` → `<name>-frontend` |
| `frontend/next.config.ts` | any project-specific config |

### Category/product ids (do not change)

`dm-cat-destaques`, `dm-cat-cabelo`, `dm-cat-barba`, `dm-cat-combos`,
`dm-cat-extras`, `dm-prod-01`..`dm-prod-23`.

### Provide a canonical rebrand config

The skill outputs a `BRAND` object (in the generated `.env` or a rebrand summary)
with: `business_name`, `business_tagline`, `country`, `currency`,
`currency_symbol`, `timezone`, `phone`, `whatsapp`, `instagram`,
`address`, `maps_url`, `logo_path`, `appointment_page_title`,
`booking_open_time`, `booking_close_time`, `booking_slot_interval`,
`booking_open_days`, `booking_advance_days`, `booking_lead_minutes`,
`booking_stylist_name`, `booking_stylist_role`, `catalog_categories` (array of
`{id, name, color, icon, description}`), `catalog_products` (array of
`{id, category_id, name, description, price, duration_minutes}`).

## Step 3 — Headless `.env`

After rebranding, generate `/root/ClubeMkt/<repo-folder>/.env` with:

```bash
DATABASE_URL="sqlite:<DIEGOMARTINS_DATA_DIR>/diegomartins.db"
DIRECT_URL="sqlite:<DIEGOMARTINS_DATA_DIR>/diegomartins.db"
NEXT_PUBLIC_API_URL="http://127.0.0.1:<app-port>/api"
JWT_SECRET="<random-32-hex>"
DIEGOMARTINS_DATA_DIR="/var/lib/<name>"
NODE_ENV="production"
PORT="<app-port>"
NEXT_PUBLIC_WHATSAPP_NUMBER="<whatsapp>"
NEXT_PUBLIC_CONTACT_PHONE="<phone>"
NEXT_PUBLIC_CONTACT_EMAIL="<email>"
NEXT_PUBLIC_CONTACT_CITY="<city>"
NEXT_PUBLIC_CONTACT_HOURS="<hours>"
NEXT_PUBLIC_INSTAGRAM_URL="<ig>"
NEXT_PUBLIC_FACEBOOK_URL="<fb>"
NEXT_PUBLIC_TIKTOK_URL="<tt>"
NEXT_PUBLIC_FREE_SHIPPING_THRESHOLD="<n>"
NEXT_PUBLIC_FLAT_SHIPPING="<n>"
SMTP_HOST=""
SMTP_PORT=""
SMTP_SECURE=""
SMTP_USER=""
SMTP_PASS=""
MAIL_FROM=""
ADMIN_NOTIFY_EMAIL=""
ANTHROPIC_API_KEY=""
```

(admin email/password go into the `<name>.service` and the provisioning
summary)

## Step 4 — systemd unit

```
[Unit]
Description=<Name> - headless POS + booking server
After=network.target
Wants=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/root/ClubeMkt/<repo-folder>
Environment=NODE_ENV=production
Environment=PORT=<app-port>
Environment=HOSTNAME=0.0.0.0
EnvironmentFile=/root/ClubeMkt/<repo-folder>/.env
ExecStart=/usr/local/bin/node dist/web.js
Restart=always
RestartSec=3
StandardOutput=append:/var/log/<name>.log
StandardError=append:/var/log/<name>.log

[Install]
WantedBy=multi-user.target
```

- `User=root` is acceptable here because the app binds to a high port (`>=1024`)
  and runs as a single-tenant store. If the environment requires a non-root
  user, set `User=<name>` and adjust `DIEGOMARTINS_DATA_DIR` and
  `WorkingDirectory` accordingly.
- Sync with the base repo's `scripts/deploy.sh` if one exists. If no `scripts/`
  exists in the base repo, this skill is the deploy step.

## Step 5 — nginx vhost

```
server {
    listen 80;
    listen [::]:80;
    server_name <name>.clubemkt.digital;
    client_max_body_size 50M;

    # Subdomain root serves the public booking page
    location = / {
        return 302 /agendar;
    }

    location / {
        proxy_pass http://127.0.0.1:<app-port>;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
        proxy_set_header X-Forwarded-Host $host;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 300s;
    }
}
```

Write to `/etc/nginx/sites-enabled/<name>`, `nginx -t`, `systemctl reload nginx`.

## Step 6 — data dir

```bash
mkdir -p /var/lib/<name>/backups /var/lib/<name>/uploads
chown -R root:root /var/lib/<name>   # or the chosen non-root user
```

The server's `getDbPath()` reads `DIEGOMARTINS_DATA_DIR` from `.env` and uses
`/var/lib/<name>/diegomartins.db`.

## Step 7 — Build + start

```bash
cd /root/ClubeMkt/<repo-folder>
# frontend (desktop build, no Google Fonts fetch)
NEXT_BUILD_MODE=desktop NEXT_PUBLIC_API_URL=http://127.0.0.1:<app-port>/api pnpm install --no-fund --no-audit
cd frontend && pnpm build && cd ..
npx tsc
```

Then:

```bash
systemctl daemon-reload
systemctl enable <name>.service
systemctl start <name>.service
```

Verify:

```bash
curl -sI http://127.0.0.1:<app-port>/api/health
curl -sI https://<name>.clubemkt.digital/agendar
```

## Step 8 — Rebrand-safe server-side config

- The Express server reads all business config from SQLite `settings` (seeded by
  `main/db.ts`). No server re-code is needed for a rebrand — the rebrand step
  only updates those seeded values via `rebrand:<name>`.
- `main/routes/auth.ts` / `buildLocalTenant` are single-tenant and use the
  `settings` table; no change needed.
- Do NOT commit `.env` files (the repo `.gitignore` already excludes them).

## Note on the webkit / joker subdomain rule

The `*.clubemkt.digital` wildcard in `clubemkt-sites` routes to the krikkit
docker container (`172.17.0.1:8100`) which hosts the Laravel webkit. Exact
`server_name` blocks in `sites-enabled/` win over the wildcard. When this skill
creates the new vhost, the new `<name>.clubemkt.digital` will resolve to the
new headless server, not to the webkit. No webkit changes are needed unless the
new store is intended to run inside the krikkit webkit — in that case, the new
vhost must be removed from `sites-enabled/` and the store must be deployed into
the webkit's root (`/var/www/html`) following the webkit's own conventions.

## Errors / exit conditions

- `die()`: stopped before writing any system files (nginx vhost, systemd unit,
  DNS, secrets) if a conflict exists.
- Host must be the VPS where the krikkit docker and nginx are already running.
- No remote/Cloudflare deploy step is included. This skill is VPS-only.
