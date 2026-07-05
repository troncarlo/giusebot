let handler = async (m, { conn, command, usedPrefix, text }) => {
    let who
    if (m.isGroup) {
        who = (m.mentionedJid && m.mentionedJid[0]) 
              ? m.mentionedJid[0] 
              : (m.quoted ? m.quoted.sender : false)
        
        if (!who && text) {
            let jid = text.replace(/[^0-9]/g, '') + '@s.whatsapp.net'
            if (jid.length > 15) who = jid
        }
    } else {
        who = m.chat
    }

    if (!who) return m.reply(`*⚠️ Tagga o cita qualcuno!*\n\nEsempio: _${usedPrefix + command} @user_`)

    const senderTag = `@${m.sender.split('@')[0]}`
    const targetTag = `@${who.split('@')[0]}`

    const database = {
        bacia: [
            './data/gifs/kiss1.mp4'
        ],
        abbraccia: [
            './data/gifs/hug1.mp4'
        ]
    }

    const frasi = {
        bacia: [
            `${senderTag} ha dato un bacio dolcissimo a ${targetTag}! 💋`,
            `Un bacio improvviso da parte di ${senderTag} per ${targetTag}! ✨`,
            `${senderTag} scocca un bacio a ${targetTag}! ❤️`,
            `${senderTag} non ha resistito e ha baciato ${targetTag}! 🥰`,
            `Che tenerezza! ${senderTag} ha dato un bacino a ${targetTag}! 🍭`
        ],
        abbraccia: [
            `${senderTag} ha stretto in un forte abbraccio ${targetTag}! 🤗`,
            `${senderTag} regala un caldo abbraccio a ${targetTag}! 🧸`,
            `Un abbraccio pieno d'affetto da ${senderTag} per ${targetTag}! ✨`,
            `${senderTag} stringe forte ${targetTag}, che tenerezza! ❤️`,
            `Momento dolce: ${senderTag} sta abbracciando ${targetTag}! ☁️`
        ]
    }

    const listaImg = database[command]
    const randomImg = listaImg[Math.floor(Math.random() * listaImg.length)]
    const randomTesto = frasi[command][Math.floor(Math.random() * frasi[command].length)]

    try {
        await conn.sendMessage(m.chat, {
            video: { url: randomImg },
            caption: randomTesto,
            gifPlayback: true,
            mentions: [m.sender, who]
        }, { quoted: m })
    } catch (e) {
        console.error('Errore invio file locale:', e)
        await conn.sendMessage(m.chat, { 
            text: randomTesto, 
            mentions: [m.sender, who] 
        }, { quoted: m })
    }
}

handler.command = ['bacia', 'abbraccia']
handler.group = true

export default handler