import fs from 'fs'
import print from '../../lib/print.js'

export async function eventsUpdate(conn, anu) {
    try {
        const { id, participants, action, author } = anu

        await print({ id, participants, action, author }, conn, true)

        if (!['add', 'remove', 'leave'].includes(action)) return

        const chatData = global.db.data.groups?.[id] || global.db.data.chats?.[id]
        if (!chatData || !chatData.benvenuto) return

        const dbPath = './data/eventi.json'
        const db = fs.existsSync(dbPath) ? JSON.parse(fs.readFileSync(dbPath, 'utf-8')) : {}

        const metadata = await conn.groupMetadata(id)
        const groupName = metadata.subject
        const totalMembers = metadata.participants.length

        for (const user of participants) {
            const jid = conn.decodeJid(user)
            const authorJid = author ? conn.decodeJid(author) : jid
            
            const isKick = (action === 'remove' || action === 'leave') && authorJid !== jid

            let rawText = ''
            let adTitle = ''
            
            if (action === 'add') {
                rawText = db[id]?.welcome || '𝐵𝑒𝑛𝑣𝑒𝑛𝑢𝑡𝑜 &user in &gruppo, ora siamo &membri membri'
                adTitle = '👋 𝐵𝑒𝑛𝑣𝑒𝑛𝑢𝑡𝑜'
            } else if (isKick) {
                rawText = '&user è stato rimosso da &author'
                adTitle = '🚫 𝐴𝑑𝑑𝑖𝑜'
            } else {
                rawText = db[id]?.bye || '&user ha abbandonato il gruppo, ora siamo rimasti in &membri'
                adTitle = '🚪 𝐴𝑑𝑑𝑖𝑜'
            }
            
            const caption = rawText
                .replace(/&user/g, `@${jid.split('@')[0]}`)
                .replace(/&author/g, `@${authorJid.split('@')[0]}`)
                .replace(/&gruppo/g, groupName)
                .replace(/&membri/g, totalMembers)

            const mentionsList = isKick ? [jid, authorJid] : [jid]

            let ppUrl
            try {
                ppUrl = await conn.profilePictureUrl(jid, 'image')
            } catch {
                ppUrl = 'https://i.ibb.co/3Fh9V6p/avatar-group-default.png'
            }

            const msg = await conn.sendMessage(id, {
                text: caption,
                mentions: mentionsList,
                contextInfo: {
                    ...global.newsletter().contextInfo,
/*                    externalAdReply: {
                        title: adTitle,
                        body: groupName,
                        thumbnailUrl: ppUrl,
                        mediaType: 1,
                        renderLargerThumbnail: false
                    }
*/                }
            })

            if (action === 'add' && msg) {
                await conn.sendMessage(id, {
                    react: {
                        text: '👋',
                        key: msg.key
                    }
                })
            }
        }
    } catch (e) {
        console.error('[Event Update Error]:', e)
    }
}
