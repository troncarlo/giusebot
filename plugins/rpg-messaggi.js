import fs from 'fs'

const transactionPath = './data/transazioni.json'
const walletPath = './data/wallet.json'

const getWallet = () => {
    if (!fs.existsSync(walletPath)) return {}
    try {
        return JSON.parse(fs.readFileSync(walletPath, 'utf-8'))
    } catch { return {} }
}

const saveWallet = (data) => {
    fs.writeFileSync(walletPath, JSON.stringify(data, null, 2))
}

const saveTransaction = (jid, amount, type) => {
    try {
        if (!fs.existsSync('./data')) fs.mkdirSync('./data')
        let logs = fs.existsSync(transactionPath) ? JSON.parse(fs.readFileSync(transactionPath, 'utf-8')) : []
        logs.push({
            jid,
            amount,
            type,
            timestamp: Date.now(),
            date: new Date().toLocaleString('it-IT')
        })
        fs.writeFileSync(transactionPath, JSON.stringify(logs, null, 2))
    } catch (e) { console.error(e) }
}

let handler = m => m

handler.before = async function (m, { conn }) {
    if (!m.sender || m.key.fromMe || m.isBaileys) return !0

    let user = global.db.data.users[m.sender]
    if (!user || !user.messages) return !0

    const threshold = 120
    const reward = 450

    if (user.messages > 0 && user.messages % threshold === 0) {
        let walletDb = getWallet()
        
        if (!walletDb[m.sender]) walletDb[m.sender] = { money: 0, bank: 0, lastFree: 0 }
        
        walletDb[m.sender].money += reward
        
        saveWallet(walletDb)
        saveTransaction(m.sender, reward, 'PREMIO_MESSAGGI')
        
        let testo = `_🎊 *Congratulazioni* @${m.sender.split('@')[0]}! Hai raggiunto gli *${user.messages}* messaggi. Ho aggiunto ${reward}€ al tuo saldo!_ \n\n> Continua a chattare per altro denaro! 💸`

        const msg = {
            viewOnceMessage: {
                message: {
                    interactiveMessage: {
                        body: { text: testo },
                        nativeFlowMessage: {
                            buttons: [
                                {
                                    name: "quick_reply",
                                    buttonParamsJson: JSON.stringify({ display_text: "👛 VEDI SALDO", id: `.wallet` })
                                }
                            ]
                        },
                        contextInfo: {
                            mentionedJid: [m.sender],
                            isForwarded: true
                        }
                    }
                }
            }
        }

        await conn.relayMessage(m.chat, msg, { quoted: m })
    }

    return !0
}

export default handler