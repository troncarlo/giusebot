import axios from 'axios'
import fs from 'fs'
import { render } from 'takumi-js'
import parse from 'html-parse-stringify'

const dbPath = './data/lastfm.json'
const LASTFM_PLACEHOLDER = '2a96cbd8b46e442fc41c2b86b821562f'

const convertHtmlToNodes = (htmlString) => {
    const ast = parse.parse(htmlString.trim());
    const transform = (node) => {
        if (node.type === 'text') return node.content;
        const props = { ...node.attrs };
        if (props.class) {
            props.tw = props.class;
            delete props.class;
        }
        const children = node.children ? node.children.map(transform) : [];
        return {
            type: node.name,
            props: {
                ...props,
                children: children.length === 1 && typeof children[0] === 'string' ? children[0] : children
            }
        };
    };
    return transform(ast[0]);
};

const fetchCover = async (item, isAlbum, apiKey) => {
    if (isAlbum) {
        try {
            const imgs = item.image
            if (imgs?.length) {
                const best = imgs.find(i => i.size === 'extralarge' || i.size === 'mega') || imgs[imgs.length - 1]
                const url = best?.['#text']
                if (url?.trim() && !url.includes(LASTFM_PLACEHOLDER)) return url
            }
        } catch {}
        try {
            const q = `${item.artist?.name || ''} ${item.name}`.trim()
            const { data } = await axios.get('https://itunes.apple.com/search', {
                params: { term: q, limit: 1, media: 'music', entity: 'album' },
                timeout: 6000
            })
            const r = data.results?.[0]
            if (r?.artworkUrl100) return r.artworkUrl100.replace('100x100bb', '600x600bb')
        } catch {}
    } else {
        try {
            const { data } = await axios.get('https://ws.audioscrobbler.com/2.0/', {
                params: { method: 'artist.gettopalbums', artist: item.name, api_key: apiKey, limit: 1, format: 'json' },
                timeout: 6000
            })
            const albums = data.topalbums?.album
            if (albums?.length) {
                const imgs = albums[0].image
                const best = imgs?.find(i => i.size === 'extralarge' || i.size === 'mega') || imgs?.[imgs.length - 1]
                const url = best?.['#text']
                if (url?.trim() && !url.includes(LASTFM_PLACEHOLDER)) return url
            }
        } catch {}
        try {
            const { data } = await axios.get('https://itunes.apple.com/search', {
                params: { term: item.name, limit: 1, media: 'music', entity: 'album' },
                timeout: 6000
            })
            const r = data.results?.[0]
            if (r?.artworkUrl100) return r.artworkUrl100.replace('100x100bb', '600x600bb')
        } catch {}
    }
    return 'https://placehold.co/600x600/222/555?text=?'
}

let handler = async (m, { conn, text, usedPrefix }) => {
    const db = fs.existsSync(dbPath) ? JSON.parse(fs.readFileSync(dbPath, 'utf-8')) : {}
    const user = db[m.sender]
    const apiKey = global.APIKeys?.lastfm

    if (!apiKey) return m.reply('_Configura LastFM API Key._')
    if (!user) return m.reply(`_Registrati prima con ${usedPrefix}fmset_`)

    await conn.sendPresenceUpdate('composing', m.chat)

    try {
        const isAlbum = text?.toLowerCase() === 'album'
        const method = isAlbum ? 'user.gettopalbums' : 'user.gettopartists'

        const res = await axios.get('https://ws.audioscrobbler.com/2.0/', {
            params: { method, user, api_key: apiKey, period: '7day', limit: 5, format: 'json' }
        })

        const data = res.data.topartists?.artist || res.data.topalbums?.album
        if (!data || data.length < 3) return m.reply('_Dati insufficienti su Last.fm._')

        const covers = await Promise.all(data.slice(0, 3).map(item => fetchCover(item, isAlbum, apiKey)))
        const fmt = (n) => Number(n).toLocaleString('it-IT')

        const rowsHtml = data.slice(3, 5).map((item, i) => `
            <div tw="flex items-center justify-between py-3 border-b border-white/10 w-full">
                <div tw="flex items-center">
                    <span tw="font-sans text-xl font-black text-white/20 w-8">${i + 4}</span>
                    <span tw="font-sans text-base font-bold text-zinc-200 truncate w-[400px]">${item.name}</span>
                </div>
                <span tw="font-sans text-sm text-white/40">${fmt(item.playcount)}</span>
            </div>
        `).join('')

        const htmlTemplate = `
            <div tw="w-full h-full flex flex-col justify-between bg-zinc-950 p-10 font-sans relative overflow-hidden" style="width: 1080px; height: 1440px;">
                
                <div tw="absolute inset-0 flex">
                    <img src="${covers[0]}" tw="w-full h-full object-cover opacity-20 blur-3xl scale-110" />
                </div>
                <div tw="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80"></div>

                <div tw="flex flex-col items-center mt-12 relative">
                    <div tw="bg-white/10 border border-white/20 px-4 py-1.5 rounded-full mb-4">
                        <span tw="text-xs font-bold uppercase tracking-widest text-white/50">7 days · ${isAlbum ? 'albums' : 'artists'}</span>
                    </div>
                    <span tw="text-6xl font-black text-zinc-100 tracking-tight">Weekly Chart</span>
                </div>

                <div tw="flex flex-col justify-end flex-1 relative">
                    
                    <div tw="flex items-end justify-center mb-10 w-full">
                        
                        <div tw="flex flex-col items-center bg-white/5 border border-white/10 rounded-l-3xl p-6 w-[280px] h-[360px] relative mr-[-1px]">
                            <div tw="relative mt-[-70px] mb-4 flex">
                                <img src="${covers[1]}" tw="w-36 h-36 rounded-2xl object-cover border-2 border-white/20 shadow-2xl" />
                                <span tw="absolute bottom-[-10px] right-[-10px] bg-zinc-900 border border-white/20 w-10 h-10 rounded-full flex items-center justify-center text-lg">🥈</span>
                            </div>
                            <span tw="text-lg font-black text-zinc-200 text-center truncate w-[230px] mb-2">${data[1].name}</span>
                            <span tw="text-xs font-bold text-zinc-100 bg-white/10 border border-white/15 px-3 py-1 rounded-full">${fmt(data[1].playcount)} plays</span>
                        </div>

                        <div tw="flex flex-col items-center bg-white/10 border border-white/20 rounded-t-3xl p-6 w-[320px] h-[420px] relative z-10 shadow-2xl">
                            <div tw="relative mt-[-90px] mb-5 flex">
                                <img src="${covers[0]}" tw="w-44 h-44 rounded-2xl object-cover border-2 border-white/30 shadow-2xl" />
                                <span tw="absolute bottom-[-10px] right-[-10px] bg-zinc-900 border border-white/20 w-12 h-12 rounded-full flex items-center justify-center text-xl">🥇</span>
                            </div>
                            <span tw="text-2xl font-black text-zinc-100 text-center truncate w-[270px] mb-3">${data[0].name}</span>
                            <span tw="text-sm font-bold text-zinc-100 bg-white/15 border border-white/20 px-4 py-1.5 rounded-full">${fmt(data[0].playcount)} plays</span>
                        </div>

                        <div tw="flex flex-col items-center bg-white/5 border border-white/10 rounded-r-3xl p-6 w-[280px] h-[320px] relative ml-[-1px]">
                            <div tw="relative mt-[-70px] mb-4 flex">
                                <img src="${covers[2]}" tw="w-36 h-36 rounded-2xl object-cover border-2 border-white/20 shadow-2xl" />
                                <span tw="absolute bottom-[-10px] right-[-10px] bg-zinc-900 border border-white/20 w-10 h-10 rounded-full flex items-center justify-center text-lg">🥉</span>
                            </div>
                            <span tw="text-lg font-black text-zinc-200 text-center truncate w-[230px] mb-2">${data[2].name}</span>
                            <span tw="text-xs font-bold text-zinc-100 bg-white/10 border border-white/15 px-3 py-1 rounded-full">${fmt(data[2].playcount)} plays</span>
                        </div>

                    </div>

                    <div tw="bg-zinc-900/90 border border-white/10 border-b-0 rounded-t-3xl p-8 flex flex-col w-full mx-auto max-w-[880px] shadow-2xl">
                        ${rowsHtml}
                    </div>

                </div>
            </div>
        `

        const nodeStructure = convertHtmlToNodes(htmlTemplate)
        const imageBuffer = await render(nodeStructure, { 
            width: 1080, 
            height: 1440 
        })

        await conn.sendMessage(m.chat, { image: imageBuffer, ...global.newsletter() }, { quoted: m })
    } catch (e) {
        console.error(e)
        m.reply('_Errore nel rendering._')
    }
}

handler.help = ['fmtop artist', 'fmtop album']
handler.tags = ['fm']
handler.command = ['fmtop']

export default handler