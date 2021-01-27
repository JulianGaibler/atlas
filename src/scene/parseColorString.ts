export default parseColor

const baseHues = {
  blue: 240,
  green: 180,
  orange: 60,
  purple: 300,
  red: 0,
  yellow: 120,
}

function parseColor(colorString) {
  let parts = [],
    alpha = 1,
    space = null

  if (typeof colorString === 'string') {
    //color space
    const m = /^((?:rgb|hs[lb])a?)\s*\(([^\)]*)\)/.exec(colorString)
    if (m) {
      const name = m[1]
      const isRGB = name === 'rgb'
      const base = name.replace(/a$/, '')
      space = base
      parts = m[2].trim().split(/\s*[,\/]\s*|\s+/)

      if (parts.length < 3) return null

      parts.map(function (x, i) {
        //<percentage>
        if (/%$/.test(x)) {
          //alpha
          if (i === 3) return parseFloat(x) / 100
          //rgb
          if (base === 'rgb') return (parseFloat(x) * 255) / 100
          return parseFloat(x)
        }
        //hue
        else if (base[i] === 'h') {
          //<deg>
          if (/deg$/.test(x)) {
            return parseFloat(x)
          }
          //<base-hue>
          else if (baseHues[x] !== undefined) {
            return baseHues[x]
          }
        }
        return parseFloat(x)
      })

      if (name === base) parts.push(1)
      alpha = isRGB ? 1 : parts[3] === undefined ? 1 : parts[3]
      parts = parts.slice(0, 3)
    }

    //hex
    else if (/^#?[A-Fa-f0-9]+$/.test(colorString)) {
      const base = colorString[0] === '#' ? colorString.slice(1) : colorString
      const size = base.length

      if (size < 3 || size === 5 || size === 7 || size > 8) return null

      const isShort = size <= 4
      alpha = 1.0

      if (isShort) {
        parts = [
          parseInt(base[0] + base[0], 16),
          parseInt(base[1] + base[1], 16),
          parseInt(base[2] + base[2], 16),
        ]
        if (size === 4) {
          alpha = parseInt(base[3] + base[3], 16) / 255
        }
      } else {
        parts = [
          parseInt(base[0] + base[1], 16),
          parseInt(base[2] + base[3], 16),
          parseInt(base[4] + base[5], 16),
        ]
        if (size === 8) {
          alpha = parseInt(base[6] + base[7], 16) / 255
        }
      }

      if (!parts[0]) parts[0] = 0
      if (!parts[1]) parts[1] = 0
      if (!parts[2]) parts[2] = 0

      space = 'rgb'
    }
  }

  if (space === null) return null

  if (space === 'hsl') {
    parts = hslToRgb(parts)
  } else if (space === 'hsv') {
    parts = hsvToRgb(parts)
  }

  return {
    hex: rgbToHex(parts),
    alpha: alpha,
  }
}

function hslToRgb(hsl) {
  const h = hsl[0] / 360
  const s = hsl[1] / 100
  const l = hsl[2] / 100
  let t2
  let t3
  let val

  if (s === 0) {
    val = l * 255
    return [val, val, val]
  }

  if (l < 0.5) {
    t2 = l * (1 + s)
  } else {
    t2 = l + s - l * s
  }

  const t1 = 2 * l - t2

  const rgb = [0, 0, 0]
  for (let i = 0; i < 3; i++) {
    t3 = h + (1 / 3) * -(i - 1)
    if (t3 < 0) {
      t3++
    }

    if (t3 > 1) {
      t3--
    }

    if (6 * t3 < 1) {
      val = t1 + (t2 - t1) * 6 * t3
    } else if (2 * t3 < 1) {
      val = t2
    } else if (3 * t3 < 2) {
      val = t1 + (t2 - t1) * (2 / 3 - t3) * 6
    } else {
      val = t1
    }

    rgb[i] = val * 255
  }

  return rgb
}

function hsvToRgb(hsv) {
  const h = hsv[0] / 60
  const s = hsv[1] / 100
  let v = hsv[2] / 100
  const hi = Math.floor(h) % 6

  const f = h - Math.floor(h)
  const p = 255 * v * (1 - s)
  const q = 255 * v * (1 - s * f)
  const t = 255 * v * (1 - s * (1 - f))
  v *= 255

  switch (hi) {
    case 0:
      return [v, t, p]
    case 1:
      return [q, v, p]
    case 2:
      return [p, v, t]
    case 3:
      return [p, q, v]
    case 4:
      return [t, p, v]
    case 5:
      return [v, p, q]
  }
}

function rgbToHex(args) {
  const integer =
    ((Math.round(args[0]) & 0xff) << 16) +
    ((Math.round(args[1]) & 0xff) << 8) +
    (Math.round(args[2]) & 0xff)

  const string = integer.toString(16).toUpperCase()
  return '000000'.substring(string.length) + string
}
