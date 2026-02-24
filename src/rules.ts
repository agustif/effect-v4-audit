import type { V4AuditRule } from "./types.ts"

const errorRule = (
  id: string,
  pattern: RegExp,
  message: string,
  suggestion: string
): V4AuditRule => ({
  id,
  severity: "error",
  pattern,
  message,
  suggestion
})

const warningRule = (
  id: string,
  pattern: RegExp,
  message: string,
  suggestion: string
): V4AuditRule => ({
  id,
  severity: "warning",
  pattern,
  message,
  suggestion
})

export const defaultV4AuditRules: ReadonlyArray<V4AuditRule> = [
  errorRule(
    "legacy-context-generic-tag",
    /\bContext\.GenericTag\b/g,
    "Context.GenericTag is a v3 API.",
    "Use ServiceMap.Service instead."
  ),
  errorRule(
    "legacy-context-tag",
    /\bContext\.Tag\b/g,
    "Context.Tag is a v3 API.",
    "Use ServiceMap.Service instead."
  ),
  errorRule(
    "legacy-context-reference",
    /\bContext\.Reference\b/g,
    "Context.Reference is a v3 API.",
    "Use ServiceMap.Reference instead."
  ),
  errorRule(
    "legacy-effect-tag",
    /\bEffect\.Tag\s*\(/g,
    "Effect.Tag is a v3 API.",
    "Use ServiceMap.Service class syntax or function syntax."
  ),
  errorRule(
    "legacy-effect-service",
    /\bEffect\.Service\s*\(/g,
    "Effect.Service is a v3 API.",
    "Use ServiceMap.Service plus explicit Layer.effect wiring."
  ),
  errorRule(
    "legacy-fiberref",
    /\bFiberRef\./g,
    "FiberRef APIs were replaced in v4.",
    "Use References.* values or ServiceMap.Reference."
  ),
  errorRule(
    "legacy-scope-extend",
    /\bScope\.extend\b/g,
    "Scope.extend was renamed in v4.",
    "Use Scope.provide."
  ),
  errorRule(
    "legacy-catch-all",
    /\bEffect\.catchAll\b/g,
    "Effect.catchAll was renamed in v4.",
    "Use Effect.catch."
  ),
  errorRule(
    "legacy-catch-all-cause",
    /\bEffect\.catchAllCause\b/g,
    "Effect.catchAllCause was renamed in v4.",
    "Use Effect.catchCause."
  ),
  errorRule(
    "legacy-catch-all-defect",
    /\bEffect\.catchAllDefect\b/g,
    "Effect.catchAllDefect was renamed in v4.",
    "Use Effect.catchDefect."
  ),
  errorRule(
    "legacy-catch-some",
    /\bEffect\.catchSome\b/g,
    "Effect.catchSome was renamed in v4.",
    "Use Effect.catchFilter."
  ),
  errorRule(
    "legacy-catch-some-cause",
    /\bEffect\.catchSomeCause\b/g,
    "Effect.catchSomeCause was renamed in v4.",
    "Use Effect.catchCauseFilter."
  ),
  errorRule(
    "legacy-catch-some-defect",
    /\bEffect\.catchSomeDefect\b/g,
    "Effect.catchSomeDefect was removed in v4.",
    "Use Effect.catchDefect or Effect.catchCause depending on intent."
  ),
  errorRule(
    "legacy-fork",
    /\bEffect\.fork\s*\(/g,
    "Effect.fork was renamed in v4.",
    "Use Effect.forkChild."
  ),
  errorRule(
    "legacy-fork-daemon",
    /\bEffect\.forkDaemon\b/g,
    "Effect.forkDaemon was renamed in v4.",
    "Use Effect.forkDetach."
  ),
  errorRule(
    "legacy-equal-equivalence",
    /\bEqual\.equivalence\b/g,
    "Equal.equivalence was renamed in v4.",
    "Use Equal.asEquivalence."
  ),
  warningRule(
    "unstable-effect-import",
    /from\s+["']effect\/unstable\/[^"']+["']/g,
    "Unstable module import detected.",
    "Treat unstable APIs as non-semver-stable and isolate usage."
  )
]
