import axios from 'axios'
import fs from 'fs'

let handler = async (m, { conn, text, usedPrefix, command }) => {
    let args = text ? text.trim().split(/\s+/) : []
    if (args.length > 3) {
        return m.reply(`\`𐔌⚠️꒱\` Puoi inserire un massimo di 3 parole. Esempio: *${usedPrefix + command} fottuto giuse*`)
    }

    let token = global.APIKeys?.browserless
    if (!token) {
        return m.reply('`𐔌❌꒱` Chiave API Browserless non configurata in `global.APIKeys.browserless`.')
    }

    let parolaCustom = text ? text.toUpperCase() : 'WASTED'

    let who = m.quoted ? m.quoted.sender : m.mentionedJid && m.mentionedJid[0] ? m.mentionedJid[0] : m.fromMe ? conn.user.id : m.sender
    
    let pp
    try {
        pp = await conn.profilePictureUrl(who, 'image')
    } catch (e) {
        pp = 'https://i.imgur.com/8K9p6Zt.png'
    }

    let fontBase64 = ''
    try {
        if (fs.existsSync('./data/pricedown.ttf')) {
            fontBase64 = fs.readFileSync('./data/pricedown.ttf').toString('base64')
        }
    } catch (e) {
        console.error('Errore nel caricamento del font:', e)
    }

    const browserlessUrl = `https://chrome.browserless.io/screenshot?token=${token}`

    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            ${fontBase64 ? `
            @font-face {
                font-family: 'Pricedown';
                src: url(data:font/ttf;base64,${fontBase64}) format('truetype');
                font-weight: normal;
                font-style: normal;
            }
            ` : `
            @font-face {
                font-family: 'Pricedown';
                src: url('https://db.onlinewebfonts.com/t/b294cf3a5f83ee8ec975e3aedb38d4f2.woff2') format('woff2'),
                     url('https://db.onlinewebfonts.com/t/b294cf3a5f83ee8ec975e3aedb38d4f2.woff') format('woff');
            }
            `}

            * {
                box-sizing: border-box;
                margin: 0;
                padding: 0;
            }
            html, body {
                width: 512px;
                height: 512px;
                background: #000;
                overflow: hidden;
            }
            body {
                display: flex;
                justify-content: center;
                align-items: center;
                position: relative;
            }
            .avatar {
                position: absolute;
                top: 0;
                left: 0;
                width: 512px;
                height: 512px;
                object-fit: cover;
                filter: grayscale(100%) contrast(110%) brightness(75%);
                z-index: 1;
            }
            .overlay {
                position: absolute;
                width: 100%;
                height: 130px;
                background: rgba(0, 0, 0, 0.72);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 2;
            }
            .wasted-text {
    font-family: 'Pricedown', sans-serif;
    font-size: clamp(55px, ${Math.max(20, 95 - (parolaCustom.length * 4))}px, 95px);
    font-weight: normal;
    font-style: normal;
    color: #9b0000;
    text-shadow:
        4px  4px 0 #000,
       -4px -4px 0 #000,
        4px -4px 0 #000,
       -4px  4px 0 #000,
        0px  4px 0 #000,
        4px  0px 0 #000,
       -4px  0px 0 #000,
        0px -4px 0 #000;
    letter-spacing: 4px;
    line-height: 1;
    white-space: nowrap;
}
        </style>
    </head>
    <body>
        <img class="avatar" src="${pp}" onerror="this.src='https://i.imgur.com/8K9p6Zt.png'" />
        <div class="overlay">
            <div class="wasted-text">${parolaCustom}</div>
        </div>
    </body>
    </html>
    `

    const requestBody = {
        html: htmlContent,
        options: {
            type: 'png',
            fullPage: false,
            omitBackground: false,
            clip: {
                x: 0,
                y: 0,
                width: 512,
                height: 512
            }
        }
    }

    try {
        let response = await axios.post(browserlessUrl, requestBody, {
            headers: { 'Content-Type': 'application/json' },
            responseType: 'arraybuffer'
        })

        let buffer = Buffer.from(response.data, 'binary')
        await conn.sendMessage(m.chat, { image: buffer }, { quoted: m })
    } catch (e) {
        console.error(e)
        await conn.sendMessage(m.chat, { 
            text: '`𐔌❌꒱` _Impossibile generare l\'immagine custom. Controlla la validità del token in global.APIKeys.browserless._' 
        }, { quoted: m })
    }
}

handler.help = ['wasted']
handler.tags = ['fun']
handler.command = /^(wasted)$/i

export default handler