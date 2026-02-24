import { computeLineStarts, indexToLineColumn } from "./line-starts.ts"
import { defaultV4AuditRules } from "./rules.ts"
import type { V4AuditFinding, V4AuditReport, V4AuditRule, V4AuditSourceFile, V4AuditSummary } from "./types.ts"

const normalizePath = (path: string): string => path.split("\\").join("/")

const asGlobalRegExp = (pattern: RegExp): RegExp => {
  const flags = pattern.flags.includes("g") ? pattern.flags : `${pattern.flags}g`
  return new RegExp(pattern.source, flags)
}

const compareFindings = (left: V4AuditFinding, right: V4AuditFinding): number =>
  left.path.localeCompare(right.path) ||
  left.line - right.line ||
  left.column - right.column ||
  left.ruleId.localeCompare(right.ruleId) ||
  left.match.localeCompare(right.match)

const compareRules = (left: V4AuditRule, right: V4AuditRule): number => left.id.localeCompare(right.id)

const scanSourceForRule = (
  source: V4AuditSourceFile,
  rule: V4AuditRule
): ReadonlyArray<V4AuditFinding> => {
  const path = normalizePath(source.path)
  const lineStarts = computeLineStarts(source.content)
  const pattern = asGlobalRegExp(rule.pattern)
  const findings: Array<V4AuditFinding> = []

  let match: RegExpExecArray | null = null
  while ((match = pattern.exec(source.content)) !== null) {
    const position = indexToLineColumn(lineStarts, match.index)
    findings.push({
      ruleId: rule.id,
      severity: rule.severity,
      message: rule.message,
      suggestion: rule.suggestion,
      path,
      line: position.line,
      column: position.column,
      match: match[0]
    })

    if (match[0].length === 0) {
      pattern.lastIndex = pattern.lastIndex + 1
    }
  }

  return findings
}

const buildByRuleSummary = (findings: ReadonlyArray<V4AuditFinding>): Readonly<Record<string, number>> => {
  const summary = new Map<string, number>()
  for (const finding of findings) {
    summary.set(finding.ruleId, (summary.get(finding.ruleId) ?? 0) + 1)
  }

  const byRule: Record<string, number> = {}
  for (const [ruleId, count] of [...summary.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    byRule[ruleId] = count
  }
  return byRule
}

const buildSummary = (
  filesScanned: number,
  findings: ReadonlyArray<V4AuditFinding>
): V4AuditSummary => {
  let errorCount = 0
  let warningCount = 0

  const filesWithFindings = new Set<string>()
  for (const finding of findings) {
    filesWithFindings.add(finding.path)
    if (finding.severity === "error") {
      errorCount++
    } else {
      warningCount++
    }
  }

  return {
    filesScanned,
    filesWithFindings: filesWithFindings.size,
    findingCount: findings.length,
    errorCount,
    warningCount,
    byRule: buildByRuleSummary(findings)
  }
}

export const analyzeV4Sources = (options: {
  readonly sources: ReadonlyArray<V4AuditSourceFile>
  readonly rules?: ReadonlyArray<V4AuditRule> | undefined
}): V4AuditReport => {
  const rules = [...(options.rules ?? defaultV4AuditRules)].sort(compareRules)
  const sources = [...options.sources].sort((a, b) => normalizePath(a.path).localeCompare(normalizePath(b.path)))

  const findings = sources.flatMap((source) => rules.flatMap((rule) => scanSourceForRule(source, rule)))
  findings.sort(compareFindings)

  return {
    version: 1,
    summary: buildSummary(sources.length, findings),
    findings
  }
}
