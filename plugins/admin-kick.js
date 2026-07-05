import { jidNormalizedUser } from "@realvare/baileys"

let handler = async (m, { conn, text }) => {
    let who = m.quoted ? (m.quoted.sender || m.quoted.participant) : (m.mentionedJid && m.mentionedJid[0]) ? m.mentionedJid[0] : null
    
    if (!who && text) {
        who = text.replace(/[^0-9]/g, '') + '@s.whatsapp.net'
    }

    if (!who) return

    const metadata = await conn.groupMetadata(m.chat)
    const target = jidNormalizedUser(who)

    let victim = metadata.participants.find(p => 
        jidNormalizedUser(p.id) === target || 
        (p.jid && jidNormalizedUser(p.jid) === target) || 
        (p.lid && jidNormalizedUser(p.lid) === target)
    )

    if (!victim) return

    const botId = jidNormalizedUser(conn.user.id)
    if (jidNormalizedUser(victim.id) === botId) {
        return m.reply("❌ Non posso rimuovere me stesso.")
    }

    const owners = (global.owner || []).map(o => jidNormalizedUser(o[0] + '@s.whatsapp.net'))
    if (owners.includes(jidNormalizedUser(victim.id))) {
        return m.reply("❌ Non posso rimuovere il mio creatore.")
    }

    if (victim.admin === 'superadmin') {
        return m.reply("❌ Non posso rimuovere il creatore del gruppo.")
    }

    if (victim.admin === 'admin') {
        return m.reply("❌ Non posso rimuovere un altro admin.")
    }

    try {
        await conn.groupParticipantsUpdate(m.chat, [victim.id], 'remove')
    } catch (e) {
        if (victim.lid) {
            try {
                await conn.groupParticipantsUpdate(m.chat, [victim.lid], 'remove')
            } catch (err) {
                return
            }
        }
    }
}

handler.command = ['kick', 'k', 'rimuovi', 'espelli']
handler.admin = true
handler.botAdmin = true
handler.group = true

export default handler
