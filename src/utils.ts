export function objectHash(obj: unknown): number {
  const json = JSON.stringify(obj)

  let hash = 0
  if (json.length == 0) {
    return hash
  }
  for (let i = 0; i < json.length; i++) {
    const char = json.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32bit integer
  }
  return hash
}
