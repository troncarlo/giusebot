import axios from 'axios'
import fs from 'fs'

const dbPath = './data/lastfm.json'

let handler = async (m, { conn }) => {
    const db = fs.existsSync(dbPath) ? JSON.parse(fs.readFileSync(dbPath, 'utf-8')) : {}
    let target = m.mentionedJid?.[0] || (m.quoted ? m.quoted.sender : m.sender)
    const user = db[target]
    const apiKey = global.APIKeys?.lastfm

    if (!user) return m.reply('_Non hai collegato Last.FM! Usa .fmset per collegarlo._')

    try {
        const res = await axios.get(`https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${encodeURIComponent(user)}&api_key=${apiKey}&limit=1&format=json`)
        
        if (res.data?.error) {
            return m.reply(`_Errore LastFM: [${res.data.error}] ${res.data.message}_`)
        }

        const track = res.data?.recenttracks?.track?.[0]
        if (!track) return m.reply('_Nessun brano trovato._')

        const isNow = track['@attr']?.nowplaying === 'true'
        
        let imgUrl = 'https://i.ibb.co/6fs5B1V/triplo3.jpg'
        if (track.image && Array.isArray(track.image)) {
            const xlImg = track.image.find(i => i.size === 'extralarge')?.['#text']
            if (xlImg) imgUrl = xlImg
        }
        
        let thumbBuffer = Buffer.alloc(0)
        try {
            const imgRes = await fetch(imgUrl)
            if (imgRes.ok) thumbBuffer = Buffer.from(await imgRes.arrayBuffer())
        } catch (e) {}
        
        const trackName = track.name || 'Sconosciuto'
        const artistName = track.artist?.['#text'] || 'Sconosciuto'
        const albumName = track.album?.['#text'] || 'N/D'
        const trackUrl = track.url || 'https://www.last.fm'
        const targetNumber = target.split('@')[0]
        
        let txt = `╭┈➤ 『 🎵 』 *4 4 4 . F M*\n`
        txt += `┆  『 👤 』 @${targetNumber}\n`
        txt += `┆  『 🎧 』 *BRANO:* ${trackName}\n`
        txt += `┆  『 🎤 』 *ARTISTA:* ${artistName}\n`
        txt += `╰┈➤ 『 💿 』 *ALBUM:* ${albumName}`

        const vcard = `BEGIN:VCARD\nVERSION:3.0\nFN:444 𝙇𝘼𝙎𝙏𝙁𝙈\nTEL;type=CELL;type=VOICE;waid=${targetNumber}:+${targetNumber}\nEND:VCARD`
        const fakeObj = {
            key: {
                remoteJid: m.chat,
                fromMe: false,
                id: 'FM_' + Date.now(),
                participant: target
            },
            message: {
                locationMessage: {
                    degreesLatitude: 0,
                    degreesLongitude: 0,
                    name: `${isNow ? '𝘴𝘵𝘢 𝘢𝘴𝘤𝘰𝘭𝘵𝘢𝘯𝘥𝘰...' : '𝘴𝘵𝘢𝘷𝘢 𝘢𝘴𝘤𝘰𝘭𝘵𝘢𝘯𝘥𝘰...'}`,
                    address: artistName,
                    jpegThumbnail: thumbBuffer
                }
            }
        }

        const buttons = [
            {
                name: "cta_url",
                buttonParamsJson: JSON.stringify({
                    display_text: "Apri su Last.fm",
                    url: trackUrl,
                    merchant_url: trackUrl
                })
            }
        ]

        await conn.relayMessage(m.chat, {
            viewOnceMessage: {
                message: {
                    interactiveMessage: {
                        body: { text: txt },
                        nativeFlowMessage: { buttons: buttons },
                        contextInfo: {
                            ...global.newsletter?.().contextInfo,
                            mentionedJid: [target],
                            quotedMessage: fakeObj.message,
                            participant: fakeObj.key.participant,
                            stanzaId: fakeObj.key.id,
                            remoteJid: m.chat
                        }
                    }
                }
            }
        }, {})

    } catch (e) {
        console.error(e)
        if (e.response?.data) {
            m.reply('_Errore API LastFM._')
        } else {
            m.reply('_Errore API LastFM._')
        }
    }
}

handler.help = ['fm', 'nowplaying']
handler.tags = ['fm']
handler.command = ['fm', 'nowplaying']

export default handler