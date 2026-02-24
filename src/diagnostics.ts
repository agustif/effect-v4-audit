import type { V4AuditReport, V4AuditSourceFile } from "./types.ts"

export type V4AuditColorMode = "auto" | "always" | "never"

const resolveUseColor = (mode: V4AuditColorMode): boolean => {
  if (mode === "always") {
    return true
  }

  if (mode === "never") {
    return false
  }

  const globalProcess = (globalThis as any).process
  const hasProcess = typeof globalProcess === "object" && globalProcess !== null
  if (!hasProcess) {
    return false
  }

  if (globalProcess.env?.NO_COLOR === "1") {
    return false
  }

  if (globalProcess.env?.FORCE_COLOR && globalProcess.env.FORCE_COLOR !== "0") {
    return true
  }

  return globalProcess.stdout?.isTTY === true
}

const makeColor = (useColor: boolean) => {
  if (!useColor) {
    return {
      bold: (text: string): string => text,
      dim: (text: string): string => text,
      red: (text: string): string => text,
      yellow: (text: string): string => text,
      blue: (text: string): string => text,
      cyan: (text: string): string => text,
      green: (text: string): string => text
    }
  }

  return {
    bold: (text: string): string => `\x1b[1m${text}\x1b[0m`,
    dim: (text: string): string => `\x1b[2m${text}\x1b[0m`,
    red: (text: string): string => `\x1b[31m${text}\x1b[0m`,
    yellow: (text: string): string => `\x1b[33m${text}\x1b[0m`,
    blue: (text: string): string => `\x1b[34m${text}\x1b[0m`,
    cyan: (text: string): string => `\x1b[36m${text}\x1b[0m`,
    green: (text: string): string => `\x1b[32m${text}\x1b[0m`
  }
}

const lineAt = (content: string, line: number): string => {
  const lines = content.split("\n")
  if (line <= 0 || line > lines.length) {
    return ""
  }
  return lines[line - 1] ?? ""
}

const markerWidth = (match: string): number => Math.max(1, match.trim().length)

const digits = (value: number): number => `${Math.max(1, value)}`.length

const padLeft = (value: string, width: number): string => `${" ".repeat(Math.max(0, width - value.length))}${value}`

export const renderV4AuditDiagnostics = (
  report: V4AuditReport,
  sources: ReadonlyArray<V4AuditSourceFile>,
  options?: {
    readonly color?: V4AuditColorMode | undefined
  }
): string => {
  const color = makeColor(resolveUseColor(options?.color ?? "never"))

  if (report.summary.findingCount === 0) {
    return `No v4-audit findings. Files scanned: ${report.summary.filesScanned}.`
  }

  const sourceMap = new Map<string, string>()
  for (const source of sources) {
    sourceMap.set(source.path.split("\\").join("/"), source.content)
  }

  const lines: Array<string> = [
    `Findings: ${report.summary.findingCount} (errors: ${report.summary.errorCount}, warnings: ${report.summary.warningCount})`,
    `Files scanned: ${report.summary.filesScanned}, files with findings: ${report.summary.filesWithFindings}`,
    ""
  ]

  for (const finding of report.findings) {
    const severity = finding.severity === "error"
      ? color.bold(color.red("error"))
      : color.bold(color.yellow("warning"))
    const ruleId = color.bold(color.cyan(finding.ruleId))
    const sourceContent = sourceMap.get(finding.path)
    const codeLine = sourceContent ? lineAt(sourceContent, finding.line) : ""
    const lineNo = `${finding.line}`
    const gutterWidth = digits(finding.line)
    const marker = finding.severity === "error"
      ? color.red("^".repeat(markerWidth(finding.match)))
      : color.yellow("^".repeat(markerWidth(finding.match)))
    const columnOffset = Math.max(0, finding.column - 1)

    lines.push(`${severity}[${ruleId}]: ${finding.message}`)
    lines.push(`  ${color.blue("-->")} ${finding.path}:${finding.line}:${finding.column}`)
    lines.push(`${color.dim(" ".repeat(gutterWidth))} ${color.blue("|")}`)

    if (codeLine.length > 0) {
      lines.push(`${color.dim(padLeft(lineNo, gutterWidth))} ${color.blue("|")} ${codeLine}`)
      lines.push(`${color.dim(" ".repeat(gutterWidth))} ${color.blue("|")} ${" ".repeat(columnOffset)}${marker}`)
    } else {
      lines.push(`${color.dim(padLeft(lineNo, gutterWidth))} ${color.blue("|")} ${finding.match}`)
      lines.push(`${color.dim(" ".repeat(gutterWidth))} ${color.blue("|")} ${marker}`)
    }

    lines.push(`${color.dim(" ".repeat(gutterWidth))} ${color.green("=")} ${color.green("help")}: ${finding.suggestion}`)
    lines.push("")
  }

  return lines.join("\n")
}
