import fs from 'fs'

const walletPath = './data/wallet.json'
const bancaPath = './data/banca.json'

const getDb = (path) => {
    if (!fs.existsSync('./data')) fs.mkdirSync('./data', { recursive: true })
    if (!fs.existsSync(path)) fs.writeFileSync(path, JSON.stringify({}))
    return JSON.parse(fs.readFileSync(path, 'utf-8'))
}

const saveDb = (path, data) => fs.writeFileSync(path, JSON.stringify(data, null, 2))

const generateCard = () => {
    const isPremium = Math.random() > 0.8 
    const brand = isPremium ? 'MASTERCARD' : 'VISA'
    const tier = isPremium ? 'BLACK' : 'STANDARD'
    const prefix = isPremium ? '5' : '4'
    let number = prefix
    for (let i = 0; i < 15; i++) number += Math.floor(Math.random() * 10)
    return { brand, tier, number: number.match(/.{1,4}/g).join(' ') }
}

const handler = async (m, { conn, usedPrefix, command, text }) => {
    const jid = m.sender
    const name = m.pushName || (conn.getName ? await conn.getName(jid) : jid.split('@')[0])
    let walletDb = getDb(walletPath)
    let bancaDb = getDb(bancaPath)

    if (!walletDb[jid]) walletDb[jid] = { money: 0, bank: 0, lastFree: 0 }
    if (!bancaDb[jid]) bancaDb[jid] = { hasCard: false }

    const userMoney = walletDb[jid].money || 0
    const userBank = walletDb[jid].bank || 0
    const card = bancaDb[jid]

    const fakeContact = {
        key: { fromMe: false, participant: jid, remoteJid: 'status@broadcast' },
        message: {
            contactMessage: {
                displayName: name,
                vcard: `BEGIN:VCARD\nVERSION:3.0\nN:;${name};;;\nFN:${name}\nitem1.TEL;waid=${jid.split('@')[0]}:${jid.split('@')[0]}\nEND:VCARD`
            }
        }
    }

    if (command === 'wallet' || command === 'bal') {
        let walletTxt = `╭─── 〔 👛 *WALLET* 〕 ───┈\n`
        walletTxt += `┆ 👤 *UTENTE:* @${jid.split('@')[0]}\n`
        walletTxt += `┆ 💵 *CONTANTI:* €${userMoney.toLocaleString()}\n`
        walletTxt += `┆ 💳 *BANCARIO:* €${userBank.toLocaleString()}\n`
        walletTxt += `╰──────────────────┈`
        
        if (card.hasCard) {
            walletTxt += `\n╭─── 〔 💳 *CARD INFO* 〕 ───┈\n`
            walletTxt += `┆ 🏷️ *BRAND:* ${card.brand}\n`
            walletTxt += `┆ 🎖️ *TIER:* ${card.tier}\n`
            walletTxt += `┆ 🔢 *NUMERO:* \`${card.number}\`\n`
            walletTxt += `╰──────────────────┈`
        }

        const buttons = [
            { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "🏛️ BANCA", id: `${usedPrefix}banca` }) },
            { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "🎁 DAILY", id: `${usedPrefix}daily` }) }
        ]

        const msg = {
            viewOnceMessage: {
                message: {
                    interactiveMessage: {
                        header: { title: "◯  𐙚  *──  w a l l e t  ──*", hasVideoMessage: false },
                        body: { text: walletTxt },
                        nativeFlowMessage: { buttons },
                        contextInfo: {
                            mentionedJid: [jid],
                            stanzaId: 'annoyedSystem',
                            participant: '0@s.whatsapp.net',
                            quotedMessage: fakeContact.message
                        }
                    }
                }
            }
        }
        return await conn.relayMessage(m.chat, msg, {})
    }

    if (command === 'banca') {
        if (!card.hasCard) {
            const buyMsg = {
                viewOnceMessage: {
                    message: {
                        interactiveMessage: {
                            header: { title: "◯  𐙚  *──  b a n k  ──*", hasVideoMessage: false },
                            body: { text: "🚫 Non possiedi ancora una carta di debito per accedere ai servizi bancari.\n\nPuoi emetterne una adesso al costo di *250€*." },
                            footer: { text: "annoyed system" },
                            nativeFlowMessage: {
                                buttons: [
                                    { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "💳 ACQUISTA CARTA (250€)", id: `${usedPrefix}shop buy carta` }) }
                                ]
                            },
                            contextInfo: {
                                stanzaId: 'annoyedSystem',
                                participant: '0@s.whatsapp.net',
                                quotedMessage: fakeContact.message
                            }
                        }
                    }
                }
            }
            return await conn.relayMessage(m.chat, buyMsg, {})
        }
        
        let bancaTxt = `╭─── 〔 🏛️ *ANNOYED BANK* 〕 ───┈\n`
        bancaTxt += `┆ 🏦 *SALDO:* €${userBank.toLocaleString()}\n`
        bancaTxt += `┆ 💳 *CIRCUITO:* ${card.brand}\n`
        bancaTxt += `╰──────────────────┈\n\n`
        bancaTxt += `*Azioni:*\n`
        bancaTxt += `⚡ \`.dep all\` | \`.dep <cifra>\` \n`
        bancaTxt += `⚡ \`.with all\` | \`.with <cifra>\``

        const buttons = [
            { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "👛 PORTAFOGLIO", id: `${usedPrefix}wallet` }) },
            { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "🏧 PRELEVA TUTTO", id: `${usedPrefix}with all` }) }
        ]

        const msg = {
            viewOnceMessage: {
                message: {
                    interactiveMessage: {
                        header: { title: "◯  𐙚  *──  b a n k  ──*", hasVideoMessage: false },
                        body: { text: bancaTxt },
                        footer: { text: "annoyed system" },
                        nativeFlowMessage: { buttons },
                        contextInfo: {
                            stanzaId: 'annoyedSystem',
                            participant: '0@s.whatsapp.net',
                            quotedMessage: fakeContact.message
                        }
                    }
                }
            }
        }
        return await conn.relayMessage(m.chat, msg, {})
    }

    if (command === 'dep' || command === 'with') {
        if (!card.hasCard) return m.reply('🚫 Serve la carta per operare in banca.')
        let input = (text || '').trim().toLowerCase()
        let amt = input === 'all' ? (command === 'dep' ? userMoney : userBank) : parseInt(input.replace(/[^0-9]/g, ''))

        if (isNaN(amt) || amt <= 0) return m.reply('❌ Specifica una cifra valida.')
        
        if (command === 'dep') {
            if (userMoney < amt) return m.reply('❌ Cash insufficiente.')
            walletDb[jid].money -= amt
            walletDb[jid].bank += amt
        } else {
            if (userBank < amt) return m.reply('❌ Saldo insufficiente.')
            walletDb[jid].bank -= amt
            walletDb[jid].money += amt
        }
        
        saveDb(walletPath, walletDb)
        return m.reply(`✅ Operazione di *€${amt.toLocaleString()}* eseguita.`)
    }

    if (command === 'free' || command === 'daily') {
        const cooldown = 86400000 
        const now = Date.now()
        if (now - (walletDb[jid].lastFree || 0) < cooldown) {
            const remaining = cooldown - (now - walletDb[jid].lastFree)
            const hours = Math.floor(remaining / 3600000)
            const mins = Math.floor((remaining % 3600000) / 60000)
            return m.reply(`⏳ Torna tra *${hours}h e ${mins}m*.`)
        }

        const prize = Math.floor(Math.random() * 401) + 100
        walletDb[jid].money += prize
        walletDb[jid].lastFree = now
        saveDb(walletPath, walletDb)
        return m.reply(`🎁 *BONUS*\nHai ricevuto *€${prize}*. 🌸`)
    }

    if (command === 'shop' && text === 'buy carta') {
        if (card.hasCard) return m.reply('⚠️ Hai già una carta.')
        if (userMoney < 250) return m.reply('❌ Fondi insufficienti. La carta costa 250€.')
        
        const newCard = generateCard()
        walletDb[jid].money -= 250
        bancaDb[jid] = { hasCard: true, ...newCard, number: newCard.number }
        
        saveDb(walletPath, walletDb)
        saveDb(bancaPath, bancaDb)
        return m.reply(`✅ *CARTA EMESSA!*\nCircuito: ${newCard.brand}\nTipo: ${newCard.tier}\nNumero: ${newCard.number}`)
    }
}

handler.command = ['wallet', 'bal', 'banca', 'shop', 'dep', 'with', 'free', 'daily']
handler.tags = ['rpg']
export default handler