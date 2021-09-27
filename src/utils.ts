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

export function groupBy<Type>(array: Type[], key: string): { [key: string]: Type[] } {
  return array.reduce(function (rv, x) {
    ;(rv[x[key]] = rv[x[key]] || []).push(x)
    return rv
  }, {})
}

export function groupObjToArray<Type>(
  obj: { [key: string]: Type[] },
  keyName: string,
  valueName: string,
): {}[] {
  return Object.entries(obj).map(([key, value]) => {
    let y = {}
    y[keyName] = key
    y[valueName] = value
    return y
  })
}
