export type ServerEvent = { name: string; data: string }

/**
 * Baca aliran Server-Sent Events dari body `fetch`. `EventSource` tidak bisa
 * dipakai karena `/api/chat/stream` adalah POST dengan body JSON.
 */
export async function* readServerEvents(
  body: ReadableStream<Uint8Array>
): AsyncGenerator<ServerEvent> {
  const reader = body.getReader()
  const decoder = new TextDecoder()
  let buffer = ""
  try {
    while (true) {
      const { value, done } = await reader.read()
      if (done) break
      // `stream: true` supaya karakter multibyte yang terbelah antar potongan utuh.
      buffer += decoder.decode(value, { stream: true }).replace(/\r\n?/g, "\n")

      let batas = buffer.indexOf("\n\n")
      while (batas !== -1) {
        const event = parseBlock(buffer.slice(0, batas))
        buffer = buffer.slice(batas + 2)
        if (event) yield event
        batas = buffer.indexOf("\n\n")
      }
    }
  } finally {
    reader.releaseLock()
  }
}

function parseBlock(block: string): ServerEvent | null {
  let name = "message"
  const data: string[] = []
  for (const line of block.split("\n")) {
    if (line.startsWith("event:")) name = line.slice(6).trim()
    else if (line.startsWith("data:")) data.push(line.slice(5).replace(/^ /, ""))
  }
  return data.length > 0 ? { name, data: data.join("\n") } : null
}
