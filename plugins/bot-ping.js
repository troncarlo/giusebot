import { performance } from 'perf_hooks'
import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const packageJson = require('../package.json')

const handler = async (m, { conn }) => {
    const start = performance.now()
    const lattenza = (performance.now() - start).toFixed(5)
    
    const _uptime = process.uptime() * 1000
    const uptime = formatUptime(_uptime)
    const versione = packageJson.version || '1.0.0'
    const foto = global.immagini[Math.floor(Math.random() * global.immagini.length)]
    
    const response = 
  ╭┈  『 🚀 』 ` + "`ping` ─ " + ` *_{lattenza}ms_*
  ┆  『 🕒 』 ` + "`uptime` ─ " + ` *_{uptime}_*
  ╰┈➤ 『 📦 』 ` + "`versione` ─ " + ` *_{versione}_*
  .trim()

    let isBusiness = false
    try {
        const profile = await conn.getBusinessProfile(m.sender)
        if (profile && Object.keys(profile).length > 0) isBusiness = true
    } catch (e) {
        isBusiness = false
    }

    const messageOptions = { 
        text: response,
        contextInfo: {
            ...global.newsletter().contextInfo
        }
    }

    if (isBusiness) {
        messageOptions.contextInfo.externalAdReply = {
            title: `annoyed v${versione}`,
            body: `${versione} • ${lattenza}ms`,
            renderLargerThumbnail: false,
            thumbnailUrl: foto,
            mediaType: 1
        }
    }

    await conn.sendMessage(m.chat, messageOptions, { quoted: m })
}

function formatUptime(ms) {
    let d = Math.floor(ms / 86400000)
    let h = Math.floor((ms % 86400000) / 3600000)
    let m = Math.floor((ms % 3600000) / 60000)
    let s = Math.floor((ms % 60000) / 1000)
    return `${d}g ${h}h ${m}m ${s}s`
}

handler.command = ['ping', 'pong']
export default handler