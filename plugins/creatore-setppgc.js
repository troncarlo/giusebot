import { downloadContentFromMessage } from '@realvare/baileys'

let handler = async (m, { conn, isBotAdmin, isGroup }) => {

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
   
   await conn.updateProfilePicture(m.chat, media)
   await m.reply('La foto del gruppo è stata cambiata con successo.')
}

handler.help = ['setppgc']
handler.tags = ['group']
handler.command = /^(setppgc|setppgroup|immaginegruppo)$/i
handler.group = true
handler.admin = true 

export default handler