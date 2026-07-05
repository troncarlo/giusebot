// Codice di gp-setppgp.js by kinder

import Jimp from 'jimp'

let handler = async (m, { args, conn, command, usedPrefix }) => {
   
   if (!m.isGroup) return m.reply('ⓘ 𝐐𝐮𝐞𝐬𝐭𝐨 𝐜𝐨𝐦𝐚𝐧𝐝𝐨 𝐩𝐮ò 𝐞𝐬𝐬𝐞𝐫𝐞 𝐮𝐬𝐚𝐭𝐨 𝐬𝐨𝐥𝐨 𝐧𝐞𝐢 𝐠𝐫𝐮𝐩𝐩𝐢.')

   let q = m.quoted ? m.quoted : m
   let mime = (q.msg || q).mimetype || q.mediaType || ''
   
   if (!/image/g.test(mime)) return m.reply(`ⓘ 𝐑𝐢𝐬𝐩𝐨𝐧𝐝𝐢 𝐚 𝐮𝐧'𝐢𝐦𝐦𝐚𝐠𝐢𝐧𝐞 𝐜𝐨𝐧 𝐢𝐥 𝐜𝐨𝐦𝐚𝐧𝐝𝐨 *${usedPrefix + command}* oppure *${usedPrefix + command} --full*`)
   
   let media = await q.download()
   
   if (args[0] == '--full') {
      let { img } = await pepe(media)
      
      await conn.query({
         tag: 'iq',
         attrs: {
            to: m.chat,
            type: 'set',
            xmlns: 'w:profile:picture'
         },
         content: [{
            tag: 'picture',
            attrs: { type: 'image' },
            content: img
         }]
      })
      return m.reply('ⓘ 𝐋𝐚 𝐟𝐨𝐭𝐨 𝐩𝐫𝐨𝐟𝐢𝐥𝐨 𝐝𝐞𝐥 𝐠𝐫𝐮𝐩𝐩𝐨 è 𝐬𝐭𝐚𝐭𝐚 𝐜𝐚𝐦𝐛𝐢𝐚𝐭𝐚 𝐜𝐨𝐧 𝐬𝐮𝐜𝐜𝐞𝐬𝐬𝐨 (𝐒𝐜𝐡𝐞𝐫𝐦𝐨 𝐈𝐧𝐭𝐞𝐫𝐨).')
   }
   
   await conn.updateProfilePicture(m.chat, media)
   await m.reply('ⓘ 𝐋𝐚 𝐟𝐨𝐭𝐨 𝐩𝐫𝐨𝐟𝐢𝐥𝐨 𝐝𝐞𝐥 𝐠𝐫𝐮𝐩𝐩𝐨 è 𝐬𝐭𝐚𝐭𝐚 𝐜𝐚𝐦𝐛𝐢𝐚𝐭𝐚 𝐜𝐨𝐧 𝐬𝐮𝐜𝐜𝐞𝐬𝐬𝐨.')
}

handler.help = ['setppgc']
handler.tags = ['group']
handler.command = /^(setppgp|setppgroup|fotogruppo)/i

handler.group = true
handler.admin = true
handler.botAdmin = true

export default handler
async function pepe(media) {
   const jimp_1 = await Jimp.read(media)
   const min = jimp_1.getWidth()
   const max = jimp_1.getHeight()
   const cropped = jimp_1.crop(0, 0, min, max)
   return {
      img: await cropped.scaleToFit(720, 720).getBufferAsync(Jimp.MIME_JPEG),
      preview: await cropped.normalize().getBufferAsync(Jimp.MIME_JPEG)
   }
}