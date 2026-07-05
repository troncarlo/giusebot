import { smsg } from './lib/simple.js'
import chalk from 'chalk'
import print from './lib/print.js'
import { prima as bestemmiometro } from './funzioni/admin/bestemmiometro.js'
import { prima as antiPrivato } from './funzioni/owner/antiprivato.js'
import rispondiGemini from './funzioni/owner/rispondi.js'
import { antilink } from './funzioni/admin/antilink.js'
import { antiwa } from './funzioni/admin/antiwa.js'
import { antimedia } from './funzioni/admin/antimedia.js'
import { soloadmin } from './funzioni/admin/soloadmin.js'
import { antinuke } from './funzioni/admin/antinuke.js'
import { antivoip } from './funzioni/admin/antivoip.js'
import store from './lib/store.js'
import fs from 'fs' 
import { promises as fsAsync } from 'fs'
import path from 'path'
import { downloadContentFromMessage } from '@realvare/baileys'

let dbDirty = false
let isSaving = false

const cmdSpamTracker = {}
const cmdSpamBlocked = {}

const SPAM_LIMIT    = 5
const SPAM_WINDOW   = 5_000
const SPAM_DURATION = 60_000

const CACHE_TTL = 60_000

let _ownersCache = null
let _ownersCacheTs = 0
let _bannedCache = null
let _bannedCacheTs = 0

let _activityDb = null
let _activityDbPath = null
let _activityDirty = false

async function checkCmdSpam(jid, sender, conn, m) {
    const now = Date.now()

    if (!cmdSpamBlocked[jid]) cmdSpamBlocked[jid] = {}
    if (!cmdSpamTracker[jid]) cmdSpamTracker[jid] = {}

    const blockedUntil = cmdSpamBlocked[jid][sender]
    if (blockedUntil) {
        if (now < blockedUntil) return true
        delete cmdSpamBlocked[jid][sender]
    }

    const tracker = cmdSpamTracker[jid][sender] || { count: 0, firstTs: now }
    if (now - tracker.firstTs > SPAM_WINDOW) {
        tracker.count = 1
        tracker.firstTs = now
    } else {
        tracker.count += 1
    }
    cmdSpamTracker[jid][sender] = tracker

    if (tracker.count >= SPAM_LIMIT) {
        cmdSpamBlocked[jid][sender] = now + SPAM_DURATION
        delete cmdSpamTracker[jid][sender]
        const senderNum = sender.split('@')[0]
        await conn.sendMessage(jid, {
            text: `╭┈➤ 『 🚫 』 *ANTISPAM COMANDI*\n┆  『 👤 』 @${senderNum}\n┆  『 ⏱️ 』 Troppi comandi in poco tempo!\n┆  『 🔒 』 Bloccato per *60 secondi* in questo gruppo.\n╰┈➤ \`annoyed system\``,
            mentions: [sender],
            contextInfo: { ...global.newsletter().contextInfo }
        }, { quoted: m })
    }

    return false
}

const decodeJid = (jid) => {
    if (!jid) return jid
    if (/:\d+@/gi.test(jid)) {
        const decode = jid.split(':')[0]
        const server = jid.split('@')[1]
        return decode + '@' + server
    }
    return jid.replace(/@lid$/, '@s.whatsapp.net')
}

const areJidsSameUser = (jid1, jid2) => {
    if (!jid1 || !jid2) return false
    return decodeJid(jid1) === decodeJid(jid2)
}

function initDatabase() {
    const dbPath = path.join(process.cwd(), 'database.json')
    if (!fs.existsSync(dbPath)) {
        const initialData = { users: {}, groups: {}, chats: {}, settings: {} }
        fs.writeFileSync(dbPath, JSON.stringify(initialData, null, 2), 'utf-8')
    }
    if (!global.db) {
        try {
            const data = JSON.parse(fs.readFileSync(dbPath, 'utf-8'))
            global.db = {
                data: {
                    users: data.users || {},
                    groups: data.groups || {},
                    chats: data.chats || {},
                    settings: data.settings || {}
                }
            }
        } catch (e) {
            global.db = { data: { users: {}, groups: {}, chats: {}, settings: {} } }
        }
    }
}

async function saveDatabase() {
    if (!dbDirty || !global.db?.data || isSaving) return
    isSaving = true
    const dbPath = path.join(process.cwd(), 'database.json')
    try {
        dbDirty = false
        const cleanDb = ['chats', 'groups']
        for (const type of cleanDb) {
            for (const jid in global.db.data[type]) {
                const chatData = global.db.data[type][jid]
                if (chatData) {
                    delete chatData.metadata
                    delete chatData.participants
                    delete chatData.desc
                    delete chatData.owner
                    delete chatData.size
                    delete chatData.creation
                    if (type === 'chats' && jid.endsWith('@g.us')) {
                        delete global.db.data.chats[jid]
                    }
                }
            }
        }
        await fsAsync.writeFile(dbPath, JSON.stringify(global.db.data, null, 2), 'utf-8')
    } catch (e) {
        console.error(chalk.red('[DB Save Error]:'), e.message)
        dbDirty = true
    } finally {
        isSaving = false
    }
}

function loadActivityDb() {
    if (!_activityDbPath) {
        _activityDbPath = path.resolve('./data/attivita.json')
    }
    if (_activityDb !== null) return
    try {
        if (fs.existsSync(_activityDbPath)) {
            _activityDb = JSON.parse(fs.readFileSync(_activityDbPath, 'utf-8'))
        } else {
            _activityDb = {}
        }
    } catch (e) {
        _activityDb = {}
    }
}

async function flushActivityDb() {
    if (!_activityDirty || _activityDb === null) return
    _activityDirty = false
    try {
        const dir = path.dirname(_activityDbPath)
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
        await fsAsync.writeFile(_activityDbPath, JSON.stringify(_activityDb, null, 2))
    } catch (e) {
        _activityDirty = true
    }
}

async function handleActivity(m, conn) {
    loadActivityDb()
    const sender = m.senderJid || m.sender
    if (!_activityDb[sender]) _activityDb[sender] = { secondi: 0, oreNotificate: 0 }
    let incremento = 1
    if (m.message?.audioMessage) {
        incremento = m.message.audioMessage.seconds || 0
    }
    _activityDb[sender].secondi += incremento
    _activityDirty = true
    const oreAttuali = Math.floor(_activityDb[sender].secondi / 3600)
    if (oreAttuali > _activityDb[sender].oreNotificate) {
        _activityDb[sender].oreNotificate = oreAttuali
        const annuncio = `╭┈➤ 『 🏆 』 *TRAGUARDO ATTIVITÀ*\n┆  『 👤 』 @${sender.split('@')[0]}\n┆  『 🕒 』 Ha raggiunto *${oreAttuali}* ${oreAttuali === 1 ? 'ora' : 'ore'} di attività!\n╰┈➤ 『 📦 』 \`annoyed system\``
        await conn.sendMessage(m.chat, {
            text: annuncio,
            mentions: [sender],
            contextInfo: { ...global.newsletter().contextInfo }
        })
    }
}

function getOwnerJids() {
    const now = Date.now()
    if (_ownersCache && now - _ownersCacheTs < CACHE_TTL) return _ownersCache
    const ownersPath = path.join(process.cwd(), 'media', 'owners.json')
    let dynamicOwners = []
    try { dynamicOwners = JSON.parse(fs.readFileSync(ownersPath, 'utf-8')).dynamicOwners || [] } catch (e) {}
    _ownersCache = { dynamicOwners }
    _ownersCacheTs = now
    return _ownersCache
}

function getBannedData() {
    const now = Date.now()
    if (_bannedCache && now - _bannedCacheTs < CACHE_TTL) return _bannedCache
    const bannedPath = path.join(process.cwd(), 'media', 'banned.json')
    let bannedData = { users: [], chats: [] }
    try { bannedData = JSON.parse(fs.readFileSync(bannedPath, 'utf-8')) } catch (e) {}
    _bannedCache = bannedData
    _bannedCacheTs = now
    return _bannedCache
}

function getGroupModeratori(jid) {
    return global.db?.data?.groups?.[jid]?.moderatori || []
}

function isModeratore(jid, groupJid) {
    const mods = getGroupModeratori(groupJid)
    const normalized = decodeJid(jid)
    return mods.some(m => decodeJid(m) === normalized)
}

function isOwnerNum(num) {
    const clean = num.replace(/[^0-9]/g, '')
    const { dynamicOwners } = getOwnerJids()
    return (
        global.owner.some(o => o[0].replace(/[^0-9]/g, '') === clean) ||
        dynamicOwners.some(o => o.jid.split('@')[0].replace(/[^0-9]/g, '') === clean)
    )
}

function isOwnerJid(rawJid, dynamicOwners) {
    const normalized = decodeJid(rawJid)
    const num = normalized.split('@')[0].replace(/[^0-9]/g, '')
    return (
        global.owner.some(o => o[0].replace(/[^0-9]/g, '') === num) ||
        dynamicOwners.some(o => decodeJid(o.jid) === normalized)
    )
}

export function registerAutoAccept(conn) {
    const knownGroups = new Set()
    conn.ev.on('messages.upsert', ({ messages }) => {
        for (const m of messages) {
            if (m.key?.remoteJid?.endsWith('@g.us')) {
                knownGroups.add(m.key.remoteJid)
            }
        }
    })
    conn.ev.on('group-participants.update', ({ id }) => {
        if (id?.endsWith('@g.us')) knownGroups.add(id)
    })

    if (!global._onDemandHistoryMap) global._onDemandHistoryMap = new Map()
    conn.ev.on('messaging-history.set', ({ messages, syncType, peerDataRequestSessionId }) => {
        if (syncType !== 'ON_DEMAND' && syncType !== 3) return
        const cb = global._onDemandHistoryMap.get(peerDataRequestSessionId)
        if (cb) {
            global._onDemandHistoryMap.delete(peerDataRequestSessionId)
            cb(messages || [])
        }
    })

    const checkPending = async () => {
        if (knownGroups.size === 0) return
        for (const jid of knownGroups) {
            let pending
            try {
                pending = await conn.groupRequestParticipantsList(jid)
            } catch (e) { continue }
            if (!pending || pending.length === 0) continue
            for (const req of pending) {
                const phoneJid = req.phone_number || ''
                const num = phoneJid.split('@')[0].replace(/[^0-9]/g, '')
                if (!num || !isOwnerNum(num)) continue
                const candidates = [req.jid, num + '@s.whatsapp.net']
                for (const candidate of candidates) {
                    try {
                        await conn.groupRequestParticipantsUpdate(jid, [candidate], 'approve')
                        console.log(chalk.green(`[AUTOACCEPT] approvato ${num} in ${jid}`))
                        break
                    } catch (e) {}
                }
            }
        }
    }
    setTimeout(() => setInterval(checkPending, 15000), 10000)
}

export async function handleStub(conn, m) {
    if (!m?.messageStubType) return
    if (!m.chat?.endsWith('@g.us')) return
    try { await antinuke(m, { conn }) } catch (e) {}
    for (const name in global.plugins) {
        const plugin = global.plugins[name]
        if (plugin && typeof plugin.stub === 'function') {
            try { await plugin.stub(m, { conn }) } catch (e) {}
        }
    }
}

initDatabase()
if (global.db_interval) clearInterval(global.db_interval)
global.db_interval = setInterval(saveDatabase, 120000)
setInterval(flushActivityDb, 30000)

export default async function handler(conn, chatUpdate) {
    if (!chatUpdate) return
    let m = chatUpdate
    if (!conn.loadMessage) {
        conn.loadMessage = (jid, id) => store.loadMessage(jid, id)
    }
    try {
        m = smsg(conn, m)
        if (!m || !m.message) return
        const fixDownload = (msg) => {
            if (!msg) return
            msg.download = async () => {
                try {
                    let mtype = msg.mtype || msg.mediaType || Object.keys(msg.message || msg.msg || {})[0]
                    if (mtype === 'viewOnceMessage' || mtype === 'viewOnceMessageV2') {
                        const innerMsg = msg.message[mtype].message
                        mtype = Object.keys(innerMsg)[0]
                        msg.msg = innerMsg[mtype]
                    }
                    const rawContent = msg.msg || msg.message || msg
                    const mediaObj = rawContent[mtype] || rawContent
                    const stream = await downloadContentFromMessage(mediaObj, mtype.replace('Message', ''))
                    let buffer = Buffer.from([])
                    for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk])
                    return buffer
                } catch (e) { return null }
            }
        }
        fixDownload(m)
        if (m.quoted) fixDownload(m.quoted)
        const msgType = Object.keys(m.message)[0]
        const msgContent = m.message[msgType]

        let interactiveId = ''
        try {
            const interactiveMsg = m.message.interactiveResponseMessage
            if (interactiveMsg) {
                const nativeFlow = interactiveMsg.nativeFlowResponseMessage
                if (nativeFlow?.paramsJson) {
                    const parsed = JSON.parse(nativeFlow.paramsJson)
                    interactiveId = parsed?.id || ''
                }
                if (!interactiveId) {
                    interactiveId = interactiveMsg.body?.text || ''
                }
            }
        } catch {}

        let txt = m.message.conversation ||
                  m.message.extendedTextMessage?.text ||
                  m.message.imageMessage?.caption ||
                  m.message.videoMessage?.caption ||
                  m.message.buttonsResponseMessage?.selectedButtonId ||
                  m.message.listResponseMessage?.singleSelectReply?.selectedRowId ||
                  m.message.templateButtonReplyMessage?.selectedId ||
                  interactiveId ||
                  m.message.pollCreationMessageV3?.name ||
                  m.message.pollCreationMessageV2?.name ||
                  msgContent?.text ||
                  msgContent?.caption ||
                  m.text || ''
        m.text = txt.trim()
        const contextInfo = msgContent?.contextInfo
        if (contextInfo?.quotedMessage) {
            const quotedMsg = {
                key: {
                    remoteJid: m.chat,
                    fromMe: areJidsSameUser(contextInfo.participant, conn.user.id),
                    id: contextInfo.stanzaId,
                    participant: contextInfo.participant
                },
                message: contextInfo.quotedMessage,
                messageTimestamp: contextInfo.quotedStanzaID || Date.now()
            }
            m.quoted = smsg(conn, quotedMsg)
            fixDownload(m.quoted)
        }
        const jid = m.chat
        const isGroup = jid.endsWith('@g.us')
        const botId = decodeJid(conn.user.id)
        let sender = decodeJid(m.sender)
        m.botId = botId
        
        let isAdmin = undefined
        let isBotAdmin = undefined
        let isRealAdmin = undefined
        let participants = [], groupAdmins = []
        
        if (isGroup) {
            let groupMetadata = conn.chats?.[jid]?.metadata
            let fetchFailed = false

            if (!groupMetadata || !groupMetadata.participants || groupMetadata.participants.length === 0) {
                try {
                    groupMetadata = await conn.groupMetadata(jid)
                    if (conn.chats?.[jid]) {
                        conn.chats[jid].metadata = groupMetadata
                    }
                } catch (e) {
                    fetchFailed = true
                    groupMetadata = conn.chats?.[jid]?.metadata || null
                }
            } else {
                const hasStaleLid = groupMetadata.participants.some(p => p.id?.includes('@lid') && !p.jid)
                if (hasStaleLid) {
                    try {
                        groupMetadata = await conn.groupMetadata(jid)
                        if (conn.chats?.[jid]) {
                            conn.chats[jid].metadata = groupMetadata
                        }
                    } catch (e) {
                        fetchFailed = true
                        groupMetadata = conn.chats?.[jid]?.metadata || null
                    }
                }
            }

            if (groupMetadata && groupMetadata.participants) {
                participants = groupMetadata.participants || []
                m.groupName = groupMetadata.subject || jid

                let lidToJidMap = {}
                participants.forEach(p => {
                    const pId = p.id || ''
                    let rLid = p.lid ? p.lid.split('@')[0] : (pId.includes('@lid') ? pId.split('@')[0] : null)
                    let rJid = p.jid ? p.jid.split('@')[0].split(':')[0] : (pId.includes('@s.whatsapp.net') ? pId.split('@')[0].split(':')[0] : null)
                    if (rLid && rJid) lidToJidMap[rLid] = rJid
                })

                let rawSender = sender.split('@')[0]
                if (lidToJidMap[rawSender]) {
                    sender = lidToJidMap[rawSender] + '@s.whatsapp.net'
                }

                if (m.text) {
                    Object.keys(lidToJidMap).forEach(lid => {
                        const regex = new RegExp(`@${lid}`, 'g')
                        if (regex.test(m.text)) {
                            m.text = m.text.replace(regex, `@${lidToJidMap[lid]}`)
                        }
                    })
                }

                if (m.mentionedJid && Array.isArray(m.mentionedJid)) {
                    m.mentionedJid = m.mentionedJid.map(tag => {
                        let rawTag = tag.split('@')[0]
                        return lidToJidMap[rawTag] ? lidToJidMap[rawTag] + '@s.whatsapp.net' : tag
                    })
                }

                if (m.quoted && m.quoted.sender) {
                    let qRaw = m.quoted.sender.split('@')[0]
                    if (lidToJidMap[qRaw]) {
                        m.quoted.sender = lidToJidMap[qRaw] + '@s.whatsapp.net'
                    }
                }

                const checkAdmin = (targetJid) => {
                    if (!targetJid) return false
                    let dec = decodeJid(targetJid)
                    let p = participants.find(part =>
                        (part.id && decodeJid(part.id) === dec) ||
                        (part.jid && decodeJid(part.jid) === dec) ||
                        (part.lid && decodeJid(part.lid) === dec)
                    )
                    return p ? (p.admin === 'admin' || p.admin === 'superadmin') : false
                }

                const { dynamicOwners: dyn } = getOwnerJids()
                isRealAdmin = checkAdmin(sender) || checkAdmin(m.sender)
                isBotAdmin = checkAdmin(botId) || (conn.user.lid && checkAdmin(conn.user.lid))
                isAdmin = isRealAdmin || isOwnerJid(sender, dyn)
                groupAdmins = participants.filter(p => p.admin === 'admin' || p.admin === 'superadmin')
            } else if (fetchFailed) {
                isAdmin = undefined
                isBotAdmin = undefined
                isRealAdmin = false
                participants = []
                groupAdmins = []
            } else {
                isAdmin = false
                isBotAdmin = false
                isRealAdmin = false
                participants = []
                groupAdmins = []
            }
        }

        m.senderJid = sender
        const { dynamicOwners } = getOwnerJids()
        const isOwner = isOwnerJid(sender, dynamicOwners)
        const isMod = !isOwner && isGroup ? isModeratore(sender, jid) : false

        if (!isGroup) isAdmin = isOwner

        const bannedData = getBannedData()
        if (!isOwner && (bannedData.users?.includes(sender) || bannedData.chats?.includes(jid))) return

        m.isAdmin = isAdmin
        m.isBotAdmin = isBotAdmin
        m.isOwner = isOwner
        m.isMod = isMod
        m.isRealAdmin = isRealAdmin
        m.groupAdmins = groupAdmins
        m.userRole = isOwner ? 'OWNER' : (isMod ? 'MOD' : (isAdmin ? 'ADMIN' : 'MEMBRO'))

        if (!global.db.data.users[sender]) global.db.data.users[sender] = { messages: 0, warns: {} }
        global.db.data.users[sender].messages += 1
        await handleActivity(m, conn).catch(e => console.error(e))
        dbDirty = true

        if (isGroup) {
            if (!global.db.data.groups[jid]) global.db.data.groups[jid] = { messages: 0, antilink: true, antiwhatsapp: true, soloadmin: false }
            global.db.data.groups[jid].messages += 1

            await bestemmiometro(m, { conn }).catch(e => console.error(e))

            if (await antivoip(m, { conn, isAdmin, isBotAdmin, isOwner, isMod, isGroup })) {
                console.log(chalk.yellow(`[🔒] Gruppo: ${jid} | Sender: ${sender} | Motivo: antivoip attivo`))
                return
            }

            if (await antilink(m, { conn, isAdmin, isBotAdmin, users: global.db.data.users, isGroup })) {
                console.log(chalk.yellow(`[🔒] Gruppo: ${jid} | Sender: ${sender} | Motivo: antilink attivo`))
                return
            }
            
            antiwa(m, { conn, isAdmin, isBotAdmin }).catch(() => {})
            
            if (global.db.data.groups[jid].antimedia) {
                if (await antimedia(m, { conn, isAdmin, isBotAdmin, isGroup })) {
                    console.log(chalk.yellow(`[🔒] Gruppo: ${jid} | Sender: ${sender} | Motivo: antimedia attivo`))
                    return
                }
            }
            
            if (await soloadmin(m, { isAdmin, isOwner, isMod, isGroup }) === false) {
                console.log(chalk.yellow(`[🔒] Gruppo: ${jid} | Sender: ${sender} | Motivo: soloadmin attivo`))
                return
            }
        }

        await print(m, conn)

        if (m.key.fromMe) return
        if (!isGroup && !isOwner) return
        await antiPrivato.call(conn, m, { isOwner })
        if (global.db.data.settings?.[botId]?.ai_rispondi && m.text) {
            try { await rispondiGemini(m, { conn, isOwner }) } catch (e) {}
        }
        for (let name in global.plugins) {
            let plugin = global.plugins[name]
            if (plugin && typeof plugin.before === 'function') {
                if (await plugin.before(m, { conn, isOwner, isAdmin, isBotAdmin, participants, groupAdmins, isGroup }) === false) return
            }
        }

        if (m.message?.reactionMessage) {
            const emoji = m.message.reactionMessage.text
            for (let name in global.plugins) {
                const plugin = global.plugins[name]
                if (plugin && typeof plugin.reaction === 'function') {
                    try {
                        await plugin.reaction(m, { conn, emoji, isOwner, isAdmin, isBotAdmin, isGroup, participants, groupAdmins })
                    } catch (e) {
                        console.error(chalk.yellow('[Reaction Plugin Error]:'), name, e.message)
                    }
                }
            }
            return
        }

        const messageText = m.text || ''
        let usedPrefix = ''
        const _prefix = global.prefix
        if (_prefix instanceof RegExp) {
            if (_prefix.test(messageText)) usedPrefix = messageText.match(_prefix)[0]
        } else if (typeof _prefix === 'string' && messageText.startsWith(_prefix)) {
            usedPrefix = _prefix
        }
        if (!usedPrefix) return
        const args = messageText.slice(usedPrefix.length).trim().split(/ +/)
        const command = args.shift().toLowerCase()
        const text = args.join(' ')

        if (isGroup) {
            if (await checkCmdSpam(jid, sender, conn, m)) return
        }

        for (let name in global.plugins) {
            let plugin = global.plugins[name]
            if (!plugin) continue
            const isAccept = Array.isArray(plugin.command) ? plugin.command.includes(command) : (plugin.command instanceof RegExp ? plugin.command.test(command) : plugin.command === command)
            if (isAccept) {
                if (plugin.disabled) continue
                if (plugin.admin && !isAdmin && !isOwner) { await global.dfail('admin', m, conn); continue }
                if (plugin.owner && !isOwner) { await global.dfail('owner', m, conn); continue }
                if (plugin.mod && !isMod && !isOwner) { await global.dfail('mod', m, conn); continue }
                if (plugin.group && !isGroup) { await global.dfail('group', m, conn); continue }
                if (plugin.botAdmin && !isBotAdmin) { await global.dfail('botAdmin', m, conn); continue }
                try {
                    await Promise.race([
                        plugin(m, { conn, args, text, usedPrefix, command, isOwner, isAdmin, isBotAdmin, participants, groupAdmins, isGroup }),
                        new Promise((_, rej) => setTimeout(() => rej(new Error(`plugin timeout: ${name}`)), 15000))
                    ])
                } catch (e) { console.error(chalk.yellow('[Plugin Error]:'), name, e.message) }
                break
            }
        }
    } catch (e) { console.error(chalk.red('[Handler Error]:'), e) }
}

global.dfail = async (type, m, conn) => {
    const msgTexts = {
        owner: '`𐔌👑꒱ ` _*Solo il proprietario può usare questo comando!*_',
        admin: '`𐔌🛡️ ꒱ ` _*Solo gli amministratori possono usare questo comando!*_',
        mod: '`𐔌🔰꒱ ` _*Solo i moderatori possono usare questo comando!*_',
        group: '`𐔌👥 ꒱ ` _*Questo comando funziona solo nei gruppi!*_',
        botAdmin: '`𐔌🤖 ꒱ ` _*Devo essere admin per farlo!*_'
    }
    if (msgTexts[type]) return conn.sendMessage(m.chat, { text: msgTexts[type] }, { quoted: m })
}

export { initDatabase, saveDatabase }