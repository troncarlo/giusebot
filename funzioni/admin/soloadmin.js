export async function soloadmin(m, { isAdmin, isOwner, isMod, isGroup }) {
    if (m.isBaileys || !isGroup) return true
    
    if (isAdmin === undefined) return true

    const chat = global.db.data.groups[m.chat]
    
    if (chat?.soloadmin) {
        const isAuthorized = isAdmin || isMod || isOwner || m.fromMe
        
        if (!isAuthorized) {
            return false
        }
    }
    
    return true
}