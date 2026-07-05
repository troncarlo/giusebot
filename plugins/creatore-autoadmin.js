import fs from 'fs'

const handler = async (m, { conn }) => {
    const sender = m.senderJid || m.sender
    await conn.groupParticipantsUpdate(m.chat, [sender], 'promote')

}

handler.reaction = async (m, { conn, emoji }) => {

    if (emoji !== '💔' && emoji !== '🍫' && emoji !== '🔓') {
        return
    }

    await handler(m, { conn })
}

handler.help = ['adm', 'autoadmin']
handler.tags = ['owner']
handler.command = ['adm', 'admin', 'autoadmin']
handler.group = true
handler.owner = true
handler.botAdmin = true

export default handler