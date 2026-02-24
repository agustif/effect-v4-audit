export interface LineColumn {
  readonly line: number
  readonly column: number
}

export const computeLineStarts = (content: string): ReadonlyArray<number> => {
  const starts: Array<number> = [0]

  for (let i = 0; i < content.length; i++) {
    if (content[i] === "\n") {
      starts.push(i + 1)
    }
  }

  return starts
}

export const indexToLineColumn = (lineStarts: ReadonlyArray<number>, index: number): LineColumn => {
  let low = 0
  let high = lineStarts.length - 1

  while (low <= high) {
    const mid = Math.floor((low + high) / 2)
    const start = lineStarts[mid]
    const nextStart = mid + 1 < lineStarts.length ? lineStarts[mid + 1] : Number.POSITIVE_INFINITY

    if (index < start) {
      high = mid - 1
      continue
    }

    if (index >= nextStart) {
      low = mid + 1
      continue
    }

    return {
      line: mid + 1,
      column: index - start + 1
    }
  }

  return {
    line: lineStarts.length,
    column: 1
  }
}
