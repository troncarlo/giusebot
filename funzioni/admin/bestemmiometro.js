import fs from 'fs'
import path from 'path'

const bestemmiePath = path.join(process.cwd(), 'media', 'bestemmie.json')

function loadBestemmie() {
    try {
        if (!fs.existsSync(bestemmiePath)) return []
        return JSON.parse(fs.readFileSync(bestemmiePath, 'utf-8'))
    } catch (e) {
        return []
    }
}

const fontMap = {
    'a': '𝐚', 'b': '𝐛', 'c': '𝐜', 'd': '𝐝', 'e': '𝐞', 'f': '𝐟', 'g': '𝐠', 'h': '𝐡', 'i': '𝐢', 
    'j': '𝐣', 'k': '𝐤', 'l': '𝐥', 'm': '𝐦', 'n': '𝐧', 'o': '𝐨', 'p': '𝐩', 'q': '𝐪', 'r': '𝐫', 
    's': '𝐬', 't': '𝐭', 'u': '𝐮', 'v': '𝐯', 'w': '𝐰', 'x': '𝐱', 'y': '𝐲', 'z': '𝐳',
    '0': '𝟎', '1': '𝟏', '2': '𝟐', '3': '𝟑', '4': '𝟒', '5': '𝟓', '6': '𝟔', '7': '𝟕', '8': '𝟖', '9': '𝟗'
}

function convertToFont(text) {
    return text.toLowerCase().split('').map(char => fontMap[char] || char).join('')
}

export async function prima(m, { conn }) {
    if (!m.text || !m.isGroup) return
    
    const jid = m.chat
    const groupData = global.db?.data?.groups?.[jid]
    if (!groupData?.bestemmiometro) return

    const rawList = loadBestemmie()
    if (!rawList.length) return

    const haBestemmiato = rawList.some(pattern => {
        const regex = new RegExp(`\\b${pattern}\\b`, 'i')
        return regex.test(m.text)
    })

    if (!haBestemmiato) return

    const sender = m.senderJid || m.sender
    if (!global.db.data.users[sender]) {
        global.db.data.users[sender] = { messages: 0, warns: {}, bestemmie: 0 }
    }
    if (typeof global.db.data.users[sender].bestemmie === 'undefined') {
        global.db.data.users[sender].bestemmie = 0
    }

    global.db.data.users[sender].bestemmie += 1
    const tot = global.db.data.users[sender].bestemmie
    const u1 = `@${sender.split('@')[0]}`

    let txt = ''
    const mentionsList = [sender]

    if (tot === 1) {
        txt = `${u1} ${convertToFont('ha bestemmiato per la prima volta')}`
    } else {
        const casuale = Math.floor(Math.random() * 3)

        if (casuale === 0) {
            txt = `${u1} ${convertToFont(`ha tirato ${tot} bestemmie`)}`
        } else if (casuale === 1) {
            const groupMetadata = conn.chats?.[jid]?.metadata || await conn.groupMetadata(jid).catch(() => ({ participants: [] }))
            const localParticipants = (groupMetadata.participants || []).map(p => p.id)

            const localUsers = Object.entries(global.db.data.users)
                .map(([id, data]) => ({ id, bestemmie: data.bestemmie || 0 }))
                .filter(u => localParticipants.includes(u.id) && u.bestemmie > 0)
                .sort((a, b) => b.bestemmie - a.bestemmie)

            const posizione = localUsers.findIndex(u => u.id === sender) + 1
            
            txt = `${u1} ${convertToFont(`ha tirato ${tot} bestemmie è in ${posizione} posizione in questo gruppo`)}`
        } else {
            const altri = Object.entries(global.db.data.users)
                .map(([id, data]) => ({ id, bestemmie: data.bestemmie || 0 }))
                .filter(u => u.id !== sender && u.bestemmie > tot)
                .sort((a, b) => a.bestemmie - b.bestemmie)[0]

            if (altri) {
                const u2 = `@${altri.id.split('@')[0]}`
                mentionsList.push(altri.id)
                txt = `${u1} ${convertToFont(`ha bestemmiato ${tot} volte ha quasi raggiunto`)} ${u2} ${convertToFont(`che ha ${altri.bestemmie} bestemmie`)}`
            } else {
                txt = `${u1} ${convertToFont(`ha tirato ${tot} bestemmie`)}`
            }
        }
    }

    await conn.sendMessage(jid, {
        text: txt,
        mentions: mentionsList,
        contextInfo: {
            isForwarded: true,
            ...(global.canale ? {
                forwardedNewsletterMessageInfo: {
                    newsletterJid: global.canale.id,
                    newsletterName: global.canale.nome
                }
            } : {})
        }
    }, { quoted: m })
}