import type { V4AuditReport } from "./types.ts"

export const renderV4AuditJson = (report: V4AuditReport): string => JSON.stringify(report, null, 2)

export const renderV4AuditTable = (report: V4AuditReport): string => {
  if (report.summary.findingCount === 0) {
    return `No v4-audit findings. Files scanned: ${report.summary.filesScanned}.`
  }

  const lines: Array<string> = [
    `Findings: ${report.summary.findingCount} (errors: ${report.summary.errorCount}, warnings: ${report.summary.warningCount})`,
    `Files scanned: ${report.summary.filesScanned}, files with findings: ${report.summary.filesWithFindings}`,
    ""
  ]

  for (const finding of report.findings) {
    lines.push(`[${finding.severity.toUpperCase()}] ${finding.ruleId} ${finding.path}:${finding.line}:${finding.column}`)
    lines.push(`  ${finding.message}`)
    lines.push(`  Suggestion: ${finding.suggestion}`)
    lines.push(`  Match: ${JSON.stringify(finding.match)}`)
    lines.push("")
  }

  return lines.join("\n")
}
