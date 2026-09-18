# 🤖 giusebot .✦ ݁˖

⤷ ゛Bot WhatsApp basato su [@realvare/baileys](https://npmjs.com/package/@realvare/baileys). Base interamente fatta da zero, rapido e facilmente configurabile! Funziona sia su WhatsApp normale che WhatsApp Business (mod incluse) ⋆˚꩜｡

![Node](https://img.shields.io/badge/Node.js-18%2B-green?style=flat-square&logo=node.js)
![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)
![Version](https://img.shields.io/badge/version-1.8.3-purple?style=flat-square)
![Platform](https://img.shields.io/badge/platform-Android%20%7C%20Linux-lightgrey?style=flat-square)
---

> [!NOTE]
> - *Compatibile con Android 8.1+ e Linux (Ubuntu/Debian).*
> - *Il bot usa **ESModules** — è necessario nodejs versione >18*
> - *Per alcuni comandi è necessaria la libreria [@realvare/baileys](https://npmjs.com/package/@realvare/baileys) aggiornata alla versione 1.0.6 altrimenti non funzioneranno.*

---

## 🔑 Configurazione API Keys

Dopo l'installazione, modifica `config.js` e inserisci le tue chiavi in `global.APIKeys`:

| Chiave | Servizio | Usato per |
|--------|----------|-----------|
| `openrouter` | [openrouter.ai](https://openrouter.ai) | AI Rispondi (modello trinity-mini) |
| `browserless` | [browserless.io](https://browserless.io) | Generazioni delle immagini interattive |
| `removebg` | [remove.bg](https://remove.bg) | Rimozione sfondo immagini |
| `lastfm` | [last.fm](https://www.last.fm/api) | Comando `.cur` / nowplaying |
| `ocr` | [ocr.space](https://ocr.space/ocrapi) | Lettura QR code |
| `gemini` | Google Gemini | AI opzionale |
| e altro ancora...|

---

## 📥 Installazione

### 1️⃣ Android (Termux)

**Requisiti:**
- Android 8.1+ (escluse versioni Go)
- 4 GB di RAM
- 32 GB di memoria interna
- [Termux](https://f-droid.org/repo/com.termux_1022.apk)

```bash
termux-setup-storage && termux-wake-lock
```
```bash
pkg upgrade && pkg update -y
```
```bash
pkg install git nodejs ffmpeg imagemagick yarn libcairo pango libjpeg-turbo giflib libpixman pkg-config freetype fontconfig xorgproto build-essential python libvips sqlite clang make -y
```
```bash
pip install setuptools
export GYP_DEFINES="android_ndk_path=''"
```
```bash
cd ~ && git clone https://github.com/troncarlo/giusebot && cd giusebot
```
```bash
npm install --global yarn && yarn install
```
```bash
npm start
```

---

### 2️⃣ Linux (Ubuntu / Debian)

**Requisiti:**
- 3 GB di RAM
- 32 GB di SSD/HDD
- Node.js 18+
```bash
sudo apt update && sudo apt upgrade -y
```
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```
```bash
sudo apt install -y git ffmpeg imagemagick python3 python3-pip build-essential
```
```bash
git clone https://github.com/troncarlo/giusebot && cd giusebot
```
```bash
npm install
```
```bash
npm start
```

---

## 🚀 Comandi npm

| Comando | Descrizione |
|---------|-------------|
| `npm start` | Avvia il bot normalmente |
| `npm run qr` | Avvia in modalità QR code |
| `npm run code` | Avvia in modalità Pairing Code |

---

## 🧩 Dipendenze principali

| Pacchetto | Funzione |
|-----------|----------|
| `@realvare/baileys` | Core WebSocket WhatsApp |
| `axios` | Chiamate API esterne |
| `chalk` | Output colorato nel terminale |
| `chokidar` | Hot-reload plugin |
| `file-type` | Rilevamento tipo file/data |
| `node-cache` | Cache contatti e gruppi |
| `pino` | Logger |
| `node-fetch` | Fetch HTTP nei plugin |
| `moment-timezone` | Gestione fusi orari |
| `yt-search` | Ricerca YouTube (`.play`) |

---

## 📁 Struttura del progetto
```
annoyed./
├── index.js           # Entry point
├── handler.js         # Gestore messaggi principale
├── config.js          # Configurazione (generato al primo avvio)
├── database.json      # Database locale (generato automaticamente)
├── plugins/           # Comandi del bot
├── funzioni/          # Moduli interni (antilink, welcome, ecc.)
├── lib/               # Librerie (simple.js, store, converter, ecc.)
├── data/              # Dati di salvataggio (messaggi, saldo ecc.)
└── media/             # .webp per alcuni comandi interattivi

```

---

## ❤️ Crediti

- [@troncarlo](https://github.com/troncarlo) — creatore della base e dei comandi del bot
- [@realvare](https://github.com/realvare) — fork di Baileys

## 👥 Contributori

<p align="center">
  <a href="https://github.com/troncarlo/giusebot/graphs/contributors">
    <img src="https://contrib.rocks/image?repo=troncarlo/giusebot"/>
  </a>
</p>


<p align="center">
  <a href="https://star-history.com/#troncarlo/giusebot&Date">
    <img src="https://star-history.com/#troncarlo/giusebot&Date"/>
  </a>
</p>
