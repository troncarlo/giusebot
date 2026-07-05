import search from 'youtube-search-api'

let handler = async (m, { conn, command, args, usedPrefix }) => {

    if (command === 'play' && !args.length) {
        return m.reply(`🏮 Uso: \`${usedPrefix}play [titolo]\``)
    }

    if (args[0] === 'audio' || args[0] === 'video') {
        let isAudio = args[0] === 'audio'
        let url = args[1]
        
        if (!url || !url.includes('youtu')) return m.reply('🏮 Link non valido.')

        let videoId = ''
        if (url.includes('v=')) {
            videoId = url.split('v=')[1]?.split('&')[0]
        } else if (url.includes('youtu.be/')) {
            videoId = url.split('youtu.be/')[1]?.split('?')[0]
        }

        if (!videoId) return m.reply('❌ Impossibile estrarre l\'ID del video.')

        await m.reply(`_⏳ Sto scaricando il ${isAudio ? 'audio' : 'video'}..._`)

        const endpoint = isAudio 
            ? `http://api.giusebot.xyz:3000/youtube/mp3?id=${videoId}`
            : `http://api.giusebot.xyz:3000/youtube/mp4?id=${videoId}`

        try {
            const response = await fetch(endpoint)
            
            if (!response.ok) throw new Error(`Errore API: ${response.status}`)
            
            const arrayBuffer = await response.arrayBuffer()
            const buffer = Buffer.from(arrayBuffer)

            if (isAudio) {
                await conn.sendMessage(m.chat, { audio: buffer, mimetype: 'audio/mpeg', fileName: `audio.mp3` }, { quoted: m })
            } else {
                await conn.sendMessage(m.chat, { video: buffer, mimetype: 'video/mp4', caption: '> 444 bot' }, { quoted: m })
            }
        } catch (e) {
            console.error(e)
            m.reply(`❌ Errore durante il download dall'API.`);
        }
        return
    }

    let query = args.join(' ')
    let results = await search.GetListByKeyword(query, false, 1)
    if (!results || !results.items || results.items.length === 0) return m.reply('❌ Nessun risultato.')

    const v = results.items[0]
    const videoUrl = `https://www.youtube.com/watch?v=${v.id}`
    let thumb = v.thumbnail?.thumbnails?.[0]?.url || ''
    if (thumb.startsWith('//')) thumb = 'https:' + thumb

    let caption = `╭┈➤ 『 🎵 』 *444TUBE*\n┆   『 📌 』 \`titolo\` ─ ${v.title}\n╰┈➤ 『 📦 』 \`444 bot\``

    const buttons = [
        { buttonId: `${usedPrefix}play audio ${videoUrl}`, buttonText: { displayText: '🎵 AUDIO' }, type: 1 },
        { buttonId: `${usedPrefix}play video ${videoUrl}`, buttonText: { displayText: '🎥 VIDEO' }, type: 1 }
    ]

    const buttonMessage = {
        image: { url: thumb },
        caption: caption,
        footer: 'Seleziona un formato',
        buttons: buttons,
        headerType: 4
    }

    return await conn.sendMessage(m.chat, buttonMessage, { quoted: m })
}

handler.command = ['play']
export default handler;