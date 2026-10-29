const STORAGE_KEY = "chatbot:session-id"

let cadangan: string | null = null

/**
 * `session_id` untuk merangkai percakapan dan membatasi laju, bukan untuk
 * mengenali orang (PRD §11). Nilainya acak -- JANGAN pernah diisi NIM atau email,
 * walaupun portal menampilkannya.
 */
export function getSessionId(): string {
  try {
    const tersimpan = localStorage.getItem(STORAGE_KEY)
    if (tersimpan) return tersimpan
    const id = randomId()
    localStorage.setItem(STORAGE_KEY, id)
    return id
  } catch {
    // localStorage diblokir (mode privat, pengaturan peramban): cukup per tab.
    cadangan ??= randomId()
    return cadangan
  }
}

/**
 * Ganti `session_id` untuk "Percakapan baru". Server merangkai pesan sesi yang
 * sama sebagai satu percakapan selama jedanya di bawah 30 menit
 * (`api/app/observability/chatlog.py`), jadi tanpa sesi baru percakapan yang
 * baru dimulai tercatat menyambung percakapan lama di log admin.
 */
export function gantiSesi(): void {
  cadangan = randomId()
  try {
    localStorage.setItem(STORAGE_KEY, cadangan)
  } catch {
    // localStorage diblokir: `getSessionId` memakai `cadangan`.
  }
}

function randomId(): string {
  // `randomUUID` hanya ada di konteks aman; portal yang dibuka lewat IP LAN tidak.
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID()
  return Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) =>
    b.toString(16).padStart(2, "0")
  ).join("")
}
