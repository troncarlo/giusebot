import fs from 'fs'

const walletPath = './data/wallet.json'

const getDb = (dbPath) => {
    if (!fs.existsSync('./data')) fs.mkdirSync('./data', { recursive: true })
    if (!fs.existsSync(dbPath)) fs.writeFileSync(dbPath, JSON.stringify({}))
    return JSON.parse(fs.readFileSync(dbPath, 'utf-8'))
}

const saveDb = async (dbPath, data) => {
    await fs.promises.writeFile(dbPath, JSON.stringify(data, null, 2))
}

const handler = async (m, { conn, args, usedPrefix, command }) => {
    conn.sendMessage(m.chat, { react: { text: '🪙', key: m.key } }).catch(() => {})

    const extra = global.newsletter ? global.newsletter() : {}
    const jid = m.sender
    let walletDb = getDb(walletPath)

    if (!walletDb[jid]) walletDb[jid] = {}
    if (typeof walletDb[jid].money !== 'number') walletDb[jid].money = 0

    const risultati = ['testa', 'croce']
    let guess = args[0] ? args[0].toLowerCase() : null
    let bet = args[1] ? parseInt(args[1]) : 0
    let textMsg = ''
    
    let risultato = risultati[Math.floor(Math.random() * risultati.length)]

    if (guess && risultati.includes(guess)) {
        const isWin = Math.random() < 0.40
        risultato = isWin ? guess : (guess === 'testa' ? 'croce' : 'testa')

        if (args[1]) {
            if (isNaN(bet) || bet < 1) {
                conn.sendMessage(m.chat, { react: { text: '⚠️', key: m.key } }).catch(() => {})
                return conn.sendMessage(m.chat, {
                    text: `╭┈  『 ⚠️ 』 \`errore\`\n╰┈➤ Inserisci un importo valido da scommettere.`,
                    ...extra
                }, { quoted: m })
            }
            if (walletDb[jid].money < bet) {
                conn.sendMessage(m.chat, { react: { text: '⚠️', key: m.key } }).catch(() => {})
                return conn.sendMessage(m.chat, {
                    text: `╭┈  『 ⚠️ 』 \`errore\`\n╰┈➤ Non hai abbastanza contanti! Il tuo saldo attuale è di *€${walletDb[jid].money.toLocaleString()}*.`,
                    ...extra
                }, { quoted: m })
            }
            walletDb[jid].money -= bet 
        }

        let profitText = ''

        if (isWin) {
            if (bet > 0) {
                const winAmount = Math.floor(bet * 1.5)
                walletDb[jid].money += winAmount
                profitText = `\n┆  『 💵 』 \`vincita\` ─ *+€${winAmount.toLocaleString()}*\n┆  『 💰 』 \`saldo attuale\` ─ *€${walletDb[jid].money.toLocaleString()}*`
            }
            textMsg = `╭┈  『 🪙 』 \`coinflip\`\n┆  『 🎯 』 \`tua scelta\` ─ *${guess.toUpperCase()}*\n┆  『 🎰 』 \`risultato\` ─ *${risultato.toUpperCase()}*${profitText}\n╰┈➤ 『 🎉 』 \`esito\` ─ *HAI VINTO!* `
        } else {
            if (bet > 0) {
                profitText = `\n┆  『 💸 』 \`perdita\` ─ *-€${bet.toLocaleString()}*\n┆  『 💰 』 \`saldo attuale\` ─ *€${walletDb[jid].money.toLocaleString()}*`
            }
            textMsg = `╭┈  『 🪙 』 \`coinflip\`\n┆  『 🎯 』 \`tua scelta\` ─ *${guess.toUpperCase()}*\n┆  『 🎰 』 \`risultato\` ─ *${risultato.toUpperCase()}*${profitText}\n╰┈➤ 『 ❌ 』 \`esito\` ─ *HAI PERSO!*`
        }

        if (bet > 0) saveDb(walletPath, walletDb)
        
        conn.sendMessage(m.chat, { react: { text: isWin ? '🎉' : '❌', key: m.key } }).catch(() => {})
        
    } else {
        textMsg = `╭┈  『 ⚠️ 』 \`errore\`\n╰┈➤ Inserisci la tua scelta (testa o croce) e un importo.\n\nEsempio: \`${usedPrefix}${command} testa 100\``
        conn.sendMessage(m.chat, { react: { text: '⚠️', key: m.key } }).catch(() => {})
    }

    await conn.sendMessage(m.chat, {
        text: textMsg,
        ...extra
    }, { quoted: m })
}

handler.help = ['coinflip <testa/croce> [importo]']
handler.tags = ['rpg']
handler.command = ['coinflip', 'testacroce', 'flip', 'cf']

export default handler