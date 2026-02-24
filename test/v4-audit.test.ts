import { describe, expect, it } from "bun:test"
import { analyzeV4Sources, renderV4AuditDiagnostics, renderV4AuditJson, renderV4AuditTable } from "../src/index.ts"

describe("v4-audit", () => {
  it("finds legacy APIs and summarizes severities", () => {
    const report = analyzeV4Sources({
      sources: [
        {
          path: "src/main.ts",
          content: [
            `import { HttpApi } from "effect/unstable/httpapi"`,
            `const x = Effect.catchAll(effect, () => Effect.succeed("ok"))`,
            `Scope.extend(program, scope)`
          ].join("\n")
        }
      ]
    })

    expect(report.summary.findingCount).toBe(3)
    expect(report.summary.errorCount).toBe(2)
    expect(report.summary.warningCount).toBe(1)

    const ruleIds = report.findings.map((finding) => finding.ruleId)
    expect(ruleIds).toEqual([
      "unstable-effect-import",
      "legacy-catch-all",
      "legacy-scope-extend"
    ])
  })

  it("sorts findings deterministically by path and location", () => {
    const report = analyzeV4Sources({
      sources: [
        { path: "z.ts", content: "Effect.catchAll(effect, () => effect)" },
        { path: "a.ts", content: "Effect.catchAll(effect, () => effect)" }
      ]
    })

    expect(report.findings.map((finding) => finding.path)).toEqual(["a.ts", "z.ts"])
  })

  it("renders table and json output", () => {
    const report = analyzeV4Sources({
      sources: [
        { path: "src/file.ts", content: "Effect.forkDaemon(effect)" }
      ]
    })

    const table = renderV4AuditTable(report)
    expect(table).toContain("legacy-fork-daemon")
    expect(table).toContain("Suggestion:")

    const json = renderV4AuditJson(report)
    expect(JSON.parse(json)).toEqual(report)
  })

  it("reports a clear message when no findings exist", () => {
    const report = analyzeV4Sources({
      sources: [
        { path: "src/file.ts", content: "const n = 1" }
      ]
    })

    expect(renderV4AuditTable(report)).toBe("No v4-audit findings. Files scanned: 1.")
  })

  it("renders rust-style diagnostics with source snippet", () => {
    const source = {
      path: "src/file.ts",
      content: "const value = Effect.catchAll(effect, () => effect)"
    }

    const report = analyzeV4Sources({ sources: [source] })
    const diagnostics = renderV4AuditDiagnostics(report, [source])

    expect(diagnostics).toContain("error[legacy-catch-all]")
    expect(diagnostics).toContain("--> src/file.ts:1:")
    expect(diagnostics).toContain("const value = Effect.catchAll(effect, () => effect)")
    expect(diagnostics).toContain("^")
    expect(diagnostics).toContain("help: Use Effect.catch.")
  })

  it("renders ANSI colors when enabled", () => {
    const source = {
      path: "src/file.ts",
      content: "const value = Effect.catchAll(effect, () => effect)"
    }

    const report = analyzeV4Sources({ sources: [source] })
    const diagnostics = renderV4AuditDiagnostics(report, [source], { color: "always" })

    expect(diagnostics).toContain("\u001b[")
  })
})
