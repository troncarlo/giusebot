import fs from 'fs'
import path from 'path'

// Converte e normalizza i JID per i confronti di sicurezza
const decodeJid = (jid) => {
    if (!jid) return jid
    if (/:\d+@/gi.test(jid)) return jid.split(':')[0] + '@' + jid.split('@')[1]
    return jid.replace(/@lid$/, '@s.whatsapp.net')
}

// Verifica se un utente fa parte dei proprietari dinamici o globali
function isOwnerJid(rawJid) {
    const normalized = decodeJid(rawJid)
    const num = normalized.split('@')[0].replace(/[^0-9]/g, '')
    
    const ownersPath = path.join(process.cwd(), 'media', 'owners.json')
    let dynamicOwners = []
    try { dynamicOwners = JSON.parse(fs.readFileSync(ownersPath, 'utf-8')).dynamicOwners || [] } catch (e) {}

    return (
        global.owner.some(o => o[0].replace(/[^0-9]/g, '') === num) ||
        dynamicOwners.some(o => decodeJid(o.jid) === normalized)
    )
}

// Carica la whitelist locale dei VoIP dal file JSON
function getVoipWhitelist(chatJid) {
    const voipDbPath = path.resolve('./data/voips.json')
    if (!fs.existsSync(voipDbPath)) return []
    try {
        const voipDb = JSON.parse(fs.readFileSync(voipDbPath, 'utf-8'))
        return voipDb[chatJid] || []
    } catch (e) {
        return []
    }
}

/**
 * Evento scatenato all'ingresso dei partecipanti nel gruppo (group-participants.update)
 */
export async function antivoipEvent(conn, anu) {
    const { id, participants, action } = anu
    if (action !== 'add') return

    // Controlla se la funzione antivoip è attiva per questo specifico gruppo
    const chatSettings = global.db?.data?.groups?.[id]
    if (!chatSettings || !chatSettings.antivoip) return

    // Ottieni i dati dei partecipanti del gruppo per verificare se il bot è amministratore
    let groupMetadata = conn.chats?.[id]?.metadata
    if (!groupMetadata || !groupMetadata.participants) {
        try { groupMetadata = await conn.groupMetadata(id) } catch { return }
    }
    const botId = decodeJid(conn.user.id)
    const botInGroup = groupMetadata.participants.find(p => decodeJid(p.id || p.jid) === botId)
    const isBotAdmin = botInGroup ? (botInGroup.admin === 'admin' || botInGroup.admin === 'superadmin') : false
    if (!isBotAdmin) return

    const whitelist = getVoipWhitelist(id)

    for (const participant of participants) {
        if (participant.endsWith('@lid')) continue
        if (isOwnerJid(participant)) continue

        const senderNumber = participant.split('@')[0]
        if (senderNumber.startsWith('39')) continue
        if (whitelist.includes(senderNumber)) continue

        // Rilevato VoIP all'ingresso: espulsione immediata
        try {
            await conn.groupParticipantsUpdate(id, [participant], 'remove')
            await conn.sendMessage(id, {
                text: `╭*┈➤ 『 🚫 』 *ANTIVOIP ATTIVO*\n┆  『 👤 』 @${senderNumber}\n┆  『 ⏱️ 』 Rimosso all'ingresso: Prefisso non consentito!\n╰┈➤ \`giusebot\``,
                mentions: [participant]
            })
        } catch (e) {
            console.error('[ANTIVOIP EVENT ERROR]:', e)
        }
    }
}

/**
 * Controllo sui messaggi testuali tradizionali (Salvaguardia se l'evento d'ingresso fallisce)
 */
export async function antivoip(m, { conn, isAdmin, isBotAdmin, isOwner, isMod }) {
    if (!m.isGroup || isAdmin || !isBotAdmin || m.fromMe || isOwner || isMod) return false

    // Controlla lo stato nel database prima di procedere
    const chatSettings = global.db?.data?.groups?.[m.chat]
    if (!chatSettings || !chatSettings.antivoip) return false

    if (m.sender.endsWith('@lid')) return false

    const senderNumber = m.sender.split('@')[0]
    if (senderNumber.startsWith('39')) return false

    const whitelist = getVoipWhitelist(m.chat)
    if (whitelist.includes(senderNumber)) return false

    try {
        await conn.sendMessage(m.chat, { delete: m.key })
        await conn.groupParticipantsUpdate(m.chat, [m.sender], 'remove')
        
        await conn.sendMessage(m.chat, {
            text: `╭┈➤ 『 🚫 』 *ANTIVOIP ATTIVO*\n┆  『 👤 』 @${senderNumber}\n┆  『 ⏱️ 』 VoIP non consentiti in questo gruppo!\n╰┈➤ \`giusebot\``,
            mentions: [m.sender]
        })
        return true
    } catch (e) {
        console.error('[ANTIVOIP MSG ERROR]:', e)
        return false
    }
}