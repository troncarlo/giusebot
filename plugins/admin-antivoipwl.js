import fs from 'fs'
import path from 'path'

let handler = async (m, { conn, text, args, command, usedPrefix }) => {
    if (!text) return conn.sendMessage(m.chat, { text: `╭┈➤ 『 🏮 』 *ERRORE FORMATO*\n┆  Usa:\n┆  *${usedPrefix}${command} add +XXXXXXX*\n┆  *${usedPrefix}${command} remove +XXXXXXX*\n╰┈➤ \`annoyed system\`` }, { quoted: m })

    const action = args[0]?.toLowerCase()
    let rawNumber = args.slice(1).join('').replace(/[^0-9]/g, '')

    if (!action || (action !== 'add' && action !== 'remove')) {
        return conn.sendMessage(m.chat, { text: `❌ Azione non valida. Usa *add* o *remove*.` }, { quoted: m })
    }

    if (!rawNumber) {
        return conn.sendMessage(m.chat, { text: `❌ Specifica un numero di telefono valido.` }, { quoted: m })
    }

    const voipDbPath = path.resolve('./data/voips.json')
    if (!fs.existsSync(path.dirname(voipDbPath))) {
        fs.mkdirSync(path.dirname(voipDbPath), { recursive: true })
    }

    let voipDb = {}
    if (fs.existsSync(voipDbPath)) {
        try {
            voipDb = JSON.parse(fs.readFileSync(voipDbPath, 'utf-8'))
        } catch (e) {
            voipDb = {}
        }
    }

    if (!voipDb[m.chat]) voipDb[m.chat] = []

    if (action === 'add') {
        if (voipDb[m.chat].includes(rawNumber)) {
            return conn.sendMessage(m.chat, { text: `💡 Il numero @${rawNumber} è già presente nella whitelist di questo gruppo.`, mentions: [`${rawNumber}@s.whatsapp.net`] }, { quoted: m })
        }
        voipDb[m.chat].push(rawNumber)
        fs.writeFileSync(voipDbPath, JSON.stringify(voipDb, null, 2), 'utf-8')
        return conn.sendMessage(m.chat, { text: `✅ Numero @${rawNumber} aggiunto alla whitelist VoIP di questo gruppo.`, mentions: [`${rawNumber}@s.whatsapp.net`] }, { quoted: m })
    }

    if (action === 'remove') {
        if (!voipDb[m.chat].includes(rawNumber)) {
            return conn.sendMessage(m.chat, { text: `💡 Il numero @${rawNumber} non è presente nella whitelist di questo gruppo.`, mentions: [`${rawNumber}@s.whatsapp.net`] }, { quoted: m })
        }
        voipDb[m.chat] = voipDb[m.chat].filter(num => num !== rawNumber)
        fs.writeFileSync(voipDbPath, JSON.stringify(voipDb, null, 2), 'utf-8')
        return conn.sendMessage(m.chat, { text: `❌ Numero @${rawNumber} rimosso dalla whitelist VoIP di questo gruppo.`, mentions: [`${rawNumber}@s.whatsapp.net`] }, { quoted: m })
    }
}

handler.command = ['voipwl']
handler.group = true
handler.admin = true

export default handler