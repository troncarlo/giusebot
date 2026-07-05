import axios from 'axios'
import fs from 'fs'

const databasePath = './data/livelli.json'

const getDb = (path) => {
    if (!fs.existsSync(path)) fs.writeFileSync(path, JSON.stringify({}))
    return JSON.parse(fs.readFileSync(path, 'utf-8'))
}

const saveDb = (path, data) => {
    fs.writeFileSync(path, JSON.stringify(data, null, 2))
}

const handler = async (m, { conn }) => {
    const jid = m.sender
    const nomeUtente = m.pushName || 'Utente'
    
    const usersDb = global.db.data.users || {}
    const totalMsgs = usersDb[jid]?.messages || 0
    
    let livelliDb = getDb(databasePath)
    
    if (!livelliDb[jid]) {
        livelliDb[jid] = {
            level: 1,
            xp: 0,
            lastMsgCount: 0
        }
    }

    const userRpg = livelliDb[jid]
    
    userRpg.lastMsgCount = userRpg.lastMsgCount || 0
    userRpg.xp = userRpg.xp || 0
    userRpg.level = userRpg.level || 1

    const newMsgs = totalMsgs - userRpg.lastMsgCount
    
    if (newMsgs > 0) {
        const gainedXp = newMsgs * 2 
        userRpg.xp += gainedXp
        userRpg.lastMsgCount = totalMsgs
    }

    const getXpNeededForLevel = (lvl) => {
        let total = 0
        for (let i = 1; i < lvl; i++) {
            total += i * 50
        }
        return total
    }

    let levelUp = false
    while (true) {
        let nextLevelXpThreshold = getXpNeededForLevel(userRpg.level + 1)
        if (userRpg.xp >= nextLevelXpThreshold) {
            userRpg.level += 1
            levelUp = true
        } else {
            break
        }
    }

    saveDb(databasePath, livelliDb)

    await conn.sendPresenceUpdate('composing', m.chat)
    
    let pfp
    try { 
        pfp = await conn.profilePictureUrl(jid, 'image') 
    } catch { 
        pfp = 'https://i.ibb.co/6fs5B1V/triplo3.jpg' 
    }

    const currentLevelBaseXp = getXpNeededForLevel(userRpg.level)
    const nextLevelTargetXp = getXpNeededForLevel(userRpg.level + 1)
    
    const xpInCurrentLevel = userRpg.xp - currentLevelBaseXp
    const xpRequiredForCurrentLevel = nextLevelTargetXp - currentLevelBaseXp

    let progress = (xpInCurrentLevel / xpRequiredForCurrentLevel) * 100
    if (progress > 100) progress = 100
    if (progress < 0 || isNaN(progress)) progress = 0

    const html = `<html><head><style>
        @import url('https://fonts.googleapis.com/css2?family=Figtree:wght@400;700;900&display=swap');
        body { margin:0; padding:0; width:1280px; height:720px; display:flex; align-items:center; justify-content:center; font-family:'Figtree', sans-serif; background:#050505; overflow:hidden; }
        .bg-glow { position:absolute; width:600px; height:600px; background:radial-gradient(circle, rgba(168,85,247,0.15) 0%, rgba(0,0,0,0) 70%); filter:blur(50px); top:50%; left:50%; transform:translate(-50%, -50%); }
        .container { position:relative; width:1100px; height:500px; background:rgba(255, 255, 255, 0.03); backdrop-filter:blur(40px); border:1px solid rgba(255, 255, 255, 0.08); border-radius:70px; display:flex; align-items:center; padding:70px; box-sizing:border-box; }
        .pfp-side { width:350px; height:350px; border-radius:50px; border:1px solid rgba(255,255,255,0.15); background:url('${pfp}') center/cover; box-shadow:0 40px 80px rgba(0,0,0,0.8); flex-shrink:0; }
        .info-side { margin-left:70px; flex-grow:1; color:white; width: 100%; overflow: hidden; }
        .name { font-size:70px; font-weight:900; margin-bottom:5px; text-transform:uppercase; letter-spacing:-3px; color:#fff; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:600px; }
        .level-badge { display:inline-block; background:rgba(168,85,247,0.2); padding:10px 25px; border-radius:20px; font-size:24px; font-weight:800; color:#a855f7; border:1px solid rgba(168,85,247,0.3); margin-bottom:45px; letter-spacing:1px; }
        .progress-box { width:100%; display: flex; flex-direction: column; }
        .bar-bg { width:100%; height:22px; background:rgba(255,255,255,0.05); border-radius:30px; border:1px solid rgba(255,255,255,0.05); overflow:hidden; position: relative; }
        .bar-fill { height:100%; width:${progress}%; background:linear-gradient(90deg, #a855f7, #833AB4); box-shadow:0 0 20px rgba(168,85,247,0.4); border-radius:30px; }
        .stats-text { display:flex; justify-content:space-between; margin-top:20px; font-size:20px; font-weight:700; color:rgba(255,255,255,0.4); text-transform:uppercase; letter-spacing:1px; }
        .highlight { color:rgba(255,255,255,0.9); }
    </style></head><body>
        <div class="bg-glow"></div>
        <div class="container">
            <div class="pfp-side"></div>
            <div class="info-side">
                <div class="name">${nomeUtente}</div>
                <div class="level-badge">LEVEL ${userRpg.level}</div>
                <div class="progress-box">
                    <div class="bar-bg"><div class="bar-fill"></div></div>
                    <div class="stats-text">
                        <span>XP <span class="highlight">${userRpg.xp} / ${nextLevelTargetXp}</span></span>
                        <span class="highlight">${Math.floor(progress)}%</span>
                    </div>
                </div>
            </div>
        </div>
    </body></html>`

    try {
        const response = await axios({
            method: 'post',
            url: `https://chrome.browserless.io/screenshot?token=${global.APIKeys.browserless}`,
            data: {
                html: html,
                viewport: { width: 1280, height: 720 },
                options: { type: 'jpeg', quality: 90 }
            },
            responseType: 'arraybuffer'
        })

        const caption = levelUp 
            ? `╭┈  『 👤 』 \`${nomeUtente}\`\n┆  『 ✨ 』 level up\n┆  ╰➤  _*nuovo livello*_ ─ *${userRpg.level}*\n┆  ╰➤  _*xp totali*_ ─ *${userRpg.xp}*\n╰┈➤ 『 🆙 』 \`congratulazioni\``
            : `╭┈  『 👤 』 \`${nomeUtente}\`\n┆  『 📊 』 rpg stats\n┆  ╰➤  _*livello*_ ─ *${userRpg.level}*\n┆  ╰➤  _*xp*_ ─ *${userRpg.xp}/${nextLevelTargetXp}*\n┆  ╰➤  *_mancanti_* ─ *${nextLevelTargetXp - userRpg.xp}*\n╰┈➤ 『 🎮 』 \`rpg system\``

        await conn.sendMessage(m.chat, { 
            image: Buffer.from(response.data), 
            caption: caption,
            ...global.newsletter() 
        }, { quoted: m })

    } catch (e) {
        console.error(e)
        m.reply('❌ Si è verificato un errore durante la generazione della scheda.')
    }
}

handler.command = ['xp', 'livello', 'lvl']
handler.tags = ['rpg']
export default handler