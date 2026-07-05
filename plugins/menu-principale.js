import fs from 'fs';
import { join } from 'path';

function detectDevice(msgID) {
  if (!msgID) return 'unknown';
  if (/^[a-zA-Z]+-[a-fA-F0-9]+$/.test(msgID)) return 'bot';
  if (msgID.startsWith('false_') || msgID.startsWith('true_')) return 'web';
  if (msgID.startsWith('3EB0') && /^[A-Z0-9]+$/.test(msgID)) return 'web';
  if (msgID.includes(':')) return 'desktop';
  if (/^[A-F0-9]{32}$/i.test(msgID)) return 'android';
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(msgID)) return 'ios';
  if (/^[A-Z0-9]{20,25}$/i.test(msgID) && !msgID.startsWith('3EB0')) return 'ios';
  return 'unknown';
}

function getRandomMenus() {
  const allMenus = [
    { title: "🛡️ Funzioni", command: "menufunzioni" },
    { title: "🛡️ Admin", command: "menuadmin" },
    { title: "🎮 Giochi", command: "menu-giochi" },
    { title: "🔰 Moderatori", command: "menumod" },
    { title: "🎶 Menu FM", command: "menufm" }
  ];
  const shuffled = allMenus.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, 5);
}

let handler = async (m, { conn, usedPrefix }) => {
  try {
    await conn.sendPresenceUpdate('composing', m.chat);
    
    const packageJson = JSON.parse(fs.readFileSync(join(process.cwd(), 'package.json')));
    const botVersion = packageJson.version || '1.0.0';

    let _uptime = process.uptime() * 1000;
    let uptime = clockString(_uptime);
    let totalreg = Object.keys(global.db.data?.users || {}).length;

    let name = m.pushName || (conn.getName ? await conn.getName(m.sender) : m.sender.split('@')[0]);

    let caption = `╭┈   『 🌸 』 \`ciao\` ─  *${name}*
┆       
┆   『 🕒 』 \`uptime\` ─  *_${uptime}_*
┆   『 👥 』 \`utenti\` ─  *_${totalreg}_*
┆  
╰┈➤ 『 📦 』 \`vs\` ─  *_${botVersion}_*`.trim();

    const msgID = m.id || m.key?.id;
    const deviceType = detectDevice(msgID);
    const isGroup = m.chat.endsWith('@g.us');

    if (deviceType === 'ios') {
      const randomMenus = getRandomMenus();
      const buttons = randomMenus.map(menu => ({
        buttonId: usedPrefix + menu.command,
        buttonText: { displayText: menu.title },
        type: 1
      }));

      await conn.sendMessage(m.chat, {
        text: caption,
        buttons: buttons,
        headerType: 1,
        mentions: [m.sender],
        ...global.newsletter()
      }, { quoted: m });

    } else {
      if (isGroup) {
        await conn.sendMessage(m.chat, {
          interactiveButtons: [{
            name: "single_select",
            buttonParamsJson: JSON.stringify({
              title: "『 📲 』𝐬𝐜𝐞𝐠𝐥𝐢 𝐦𝐞𝐧𝐮",
              sections: [{
                title: "𝘮𝘦𝘯𝘶 𝘥𝘪𝘷𝘦𝘳𝘵𝘪𝘮𝘦𝘯𝘵𝘰",
                rows: [
                  { id: `${usedPrefix}menu-giochi`, title: "🎮 Giochi", description: "Divertimento ed RPG", command: `.menu-giochi` },
                  { id: `${usedPrefix}menufm`, title: "🎶 Menu FM", description: "Integrazione Last.fm" }
                ],
                
              },
            {
                title: "𝘮𝘦𝘯𝘶 𝘢𝘮𝘮𝘪𝘯𝘪𝘴𝘵𝘳𝘢𝘵𝘰𝘳𝘪",
                rows: [
                  { id: `${usedPrefix}funzioni`, title: "🛡️ Funzioni", description: "Lista funzioni bot" },
                  { id: `${usedPrefix}menuadmin`, title: "🛡️ Admin", description: "Comandi di amministrazione" },
                  { id: `${usedPrefix}menumod`, title: "🔰 Moderatori", description: "Pannello moderazione" },
                ],
                
              }]
            })
          }],
          text: caption,
          title: "◯  𐙚  *──  m e n u  ──*",
        }, { quoted: m });
      } else {
        const sections = [
          {
            title: "Menu Principale",
            rows: [
              { title: "🛡️ Funzioni", description: "Lista funzioni bot", rowId: `${usedPrefix}funzioni` },
              { title: "🛡️ Admin", description: "Comandi di amministrazione", rowId: `${usedPrefix}menuadmin` },
              { title: "🎮 Giochi", description: "Divertimento ed RPG", rowId: `${usedPrefix}menu-giochi` },
              { title: "🔰 Moderatori", description: "Pannello moderazione", rowId: `${usedPrefix}menumod` },
              { title: "🎶 Menu FM", description: "Integrazione Last.fm", rowId: `${usedPrefix}menufm` }
            ]
          }
        ];

        await conn.sendMessage(m.chat, {
          text: caption,
          title: "◯  𐙚  *──  m e n u  ──*",
          buttonText: "Menu Disponibili",
          sections
        }, { quoted: m });
      }
    }

  } catch (e) {
    console.error(e);
  }
};

function clockString(ms) {
  let h = Math.floor(ms / 3600000);
  let m = Math.floor(ms / 60000) % 60;
  let s = Math.floor(ms / 1000) % 60;
  return [h, m, s].map(v => v.toString().padStart(2, '0')).join(':');
}

handler.help = ['menu'];
handler.tags = ['main'];
handler.command = ['menu', 'start', 'help', 'menuall', 'menucompleto', 'comandi'];

export default handler;