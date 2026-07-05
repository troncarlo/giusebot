import { downloadContentFromMessage } from '@realvare/baileys'

let handler = async (m, { args, conn }) => {
   let q = m.quoted ? m.quoted : m
   
   let msg = q.message ? q.message : (q.msg || q)
   let imageMessage = msg.imageMessage || (msg.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage)
   let mime = imageMessage?.mimetype || msg.mimetype || ''
   
   if (!/image/g.test(mime) && !imageMessage) {
      return m.reply('Rispondi a un\'immagine.')
   }
   
   let media
   try {
      const stream = await downloadContentFromMessage(imageMessage, 'image')
      let buffer = Buffer.from([])
      for await (const chunk of stream) {
         buffer = Buffer.concat([buffer, chunk])
      }
      media = buffer
   } catch (err) {
      console.error(err)
      return m.reply('Errore durante il download dell\'immagine.')
   }

   let botJid = conn.user && (conn.user.id ? conn.user.id.split(':')[0] + '@s.whatsapp.net' : conn.user.jid)
   if (!botJid) return m.reply('Impossibile recuperare il JID del bot.')
   
   await conn.updateProfilePicture(botJid, media)
   await m.reply('La foto profilo del bot è stata cambiata con successo.')
}

handler.help = ['setppbot']
handler.tags = ['owner']
handler.command = /^(setpp|setppbot|immagineprofilo)$/i
handler.owner = true

export default handler