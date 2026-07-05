import { generateMessageID } from '@realvare/baileys'

let handler = async (m, { conn, text, usedPrefix, command }) => {
    if (!text) return m.reply(`\`𐔌⚠️ ꒱\` _Inserisci il nuovo nome._\n\n_Esempio: ${usedPrefix + command} annoyed._`)

    try {
        await conn.query({
            tag: 'iq',
            attrs: {
                to: 's.whatsapp.net',
                type: 'set',
                xmlns: 'w:bi',
                id: generateMessageID()
            },
            content: [
                {
                    tag: 'profile',
                    attrs: {
                        v: '1'
                    },
                    content: [
                        {
                            tag: 'name',
                            attrs: {},
                            content: Buffer.from(text, 'utf-8')
                        }
                    ]
                }
            ]
        })

        if (conn.user) conn.user.name = text

        m.reply(`\`𐔌✅ ꒱\` _Nome aggiornato in:_ *${text}*`)
    } catch (e) {
        console.error(e)
        m.reply(`\`𐔌❌ ꒱\` _Errore durante il cambio nome tramite canale alternativo._`)
    }
}

handler.help = ['nomebot <testo>']
handler.tags = ['owner']
handler.command = /^(nomebot|setnamebot|botname)$/i
handler.owner = true

export default handler