# Ashwat Enterprises — Pest Control site + Telegram booking notifications

Same setup pattern as your Voyager site: a small Node/Express server
serves the site and forwards booking submissions to Telegram. The bot
token is read from `.env` and never sent to the browser.

## Folder structure

```
ashwat-site/
├── server.js          ← Express server + /api/book endpoint
├── package.json
├── .env.example        ← copy this to .env and fill in your values
├── .gitignore
└── public/
    ├── index.html       ← Home, Contact, Service, Book Slot
    ├── style.css         ← neumorphic (soft-UI) design
    ├── script.js
    └── assets/
        ├── hero-home.png              ← your pegasus/coral background
        ├── technician-illustration.png ← your logo, white removed
        └── logo-round.png              ← round nav badge

```

## 1. Create your Telegram bot (skip if you already have one)

1. Telegram → **@BotFather** → `/newbot` → follow the prompts → copy
   the token.
2. Message your bot once ("hi") — it can't message you first.
3. Visit `https://api.telegram.org/bot<YOUR_TOKEN>/getUpdates` →
   find `"chat":{"id": ...}` → that's your chat ID.

## 2. Configure

```bash
cd ashwat-site
cp .env.example .env
```

Fill in `.env`:
```
TELEGRAM_BOT_TOKEN=123456789:AAExxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TELEGRAM_CHAT_ID=123456789
PORT=3000
```

No quote marks around either value.

## 3. Run

```bash
npm install
npm start
```

Open **http://localhost:3000**.

## 4. What's different about the Contact page

The number and email each have two buttons:
- a **copy icon** — copies the number/email straight to the
  clipboard (shows a "Copied!" tooltip)
- a **call/mail icon** — a real `tel:`/`mailto:` link, so on a phone
  it opens the dialer or mail app directly

Both are set in `public/index.html` — search for
`+919876543210` and `hello@ashwatenterprises.com` and replace them
with your real number and email (each appears twice: once as the
visible text, once in the button's `data-copy` / `href`).

## 5. Deploying it live

Same options as before — Render.com or Railway.app work well for a
Node app like this; set the environment variables in their dashboard
instead of a local `.env` file. See the Voyager README for the full
walkthrough if you need the click-by-click steps again.
