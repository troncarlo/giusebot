import axios from 'axios'

let handler = async (m, { conn, text, usedPrefix, command }) => {
    const BROWSERLESS_KEY = global.APIKeys?.browserless
    if (!BROWSERLESS_KEY) return m.reply('`𐔌❌꒱` API Key per Browserless non configurata.')
    if (!text) return m.reply(`\`𐔌⚠️꒱\` Inserisci il testo.\nEsempio: *${usedPrefix + command}* JavaScript`)

    await conn.sendPresenceUpdate('composing', m.chat)

    const textLength = text.length
    let scaleX = 1
    if (textLength > 6) {
        scaleX = (6 / textLength) * 1.5 
        if (scaleX > 1.2) scaleX = 1.2
    }

    const html = `
    <html>
    <head>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@900&display=swap');
        body { 
            margin: 0; 
            width: 512px; 
            height: 512px; 
            background: white; 
            display: flex; 
            flex-direction: column; 
            font-family: 'Inter', sans-serif; 
            overflow: hidden;
        }
        .top { 
            height: 50%; 
            width: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 160px; /* Dimensione massiccia */
            color: black;
            border-bottom: 2px solid white; /* Separatore invisibile */
        }
        .bottom { 
            height: 50%; 
            width: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 100px; 
            color: black;
            text-align: center;
            line-height: 0.8;
            white-space: nowrap;
            transform: scaleX(${scaleX > 1 ? 1 : scaleX}); /* Stretch orizzontale */
            transform-origin: center;
        }
    </style>
    </head>
    <body>
        <div class="top">I 💙</div>
        <div class="bottom">${text.toUpperCase()}</div>
    </body>
    </html>`

    try {
        const response = await axios.post(`https://chrome.browserless.io/screenshot?token=${BROWSERLESS_KEY}`, {
            html: html,
            viewport: { width: 512, height: 512 },
            options: { type: 'webp', quality: 100 }
        }, { responseType: 'arraybuffer' })

        await conn.sendMessage(m.chat, {   
            sticker: Buffer.from(response.data) 
        }, { quoted: m })

    } catch (e) {
        console.error(e)
        m.reply('`𐔌❌꒱` Errore durante la generazione dello sticker.')
    }
}

handler.help = ['il <testo>']
handler.tags = ['tools']
handler.command = /^(il)$/i

export default handler