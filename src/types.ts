export type V4AuditSeverity = "error" | "warning"

export interface V4AuditRule {
  readonly id: string
  readonly severity: V4AuditSeverity
  readonly pattern: RegExp
  readonly message: string
  readonly suggestion: string
}

export interface V4AuditSourceFile {
  readonly path: string
  readonly content: string
}

export interface V4AuditFinding {
  readonly ruleId: string
  readonly severity: V4AuditSeverity
  readonly message: string
  readonly suggestion: string
  readonly path: string
  readonly line: number
  readonly column: number
  readonly match: string
}

export interface V4AuditSummary {
  readonly filesScanned: number
  readonly filesWithFindings: number
  readonly findingCount: number
  readonly errorCount: number
  readonly warningCount: number
  readonly byRule: Readonly<Record<string, number>>
}

export interface V4AuditReport {
  readonly version: 1
  readonly summary: V4AuditSummary
  readonly findings: ReadonlyArray<V4AuditFinding>
}
