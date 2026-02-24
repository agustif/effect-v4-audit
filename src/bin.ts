#!/usr/bin/env bun

import * as NodeServices from "@effect/platform-node/NodeServices"
import { readFile } from "node:fs/promises"
import path from "node:path"
import { glob } from "glob"
import * as Console from "effect/Console"
import * as Effect from "effect/Effect"
import * as CliError from "effect/unstable/cli/CliError"
import * as Command from "effect/unstable/cli/Command"
import * as Flag from "effect/unstable/cli/Flag"
import { analyzeV4Sources } from "./analyze.ts"
import { renderV4AuditDiagnostics, type V4AuditColorMode } from "./diagnostics.ts"
import { renderV4AuditJson, renderV4AuditTable } from "./render.ts"

const defaultIgnorePatterns = [
  "**/node_modules/**",
  "**/dist/**",
  "**/coverage/**",
  "**/.git/**",
  "**/.turbo/**"
]

const cwd = Flag.directory("cwd", { mustExist: true }).pipe(
  Flag.withAlias("c"),
  Flag.withDescription("Directory to scan"),
  Flag.withDefault(".")
)

const pattern = Flag.string("pattern").pipe(
  Flag.withAlias("p"),
  Flag.withDescription("Glob for files to scan"),
  Flag.withDefault("**/*.{ts,tsx,mts,cts}")
)

const ignore = Flag.string("ignore").pipe(
  Flag.withAlias("i"),
  Flag.withDescription("Glob pattern(s) to ignore (repeat --ignore for multiple values)"),
  Flag.between(0, Infinity)
)

const format = Flag.choice("format", ["diagnostic", "table", "json"] as const).pipe(
  Flag.withAlias("f"),
  Flag.withDescription("Report output format"),
  Flag.withDefault("diagnostic")
)

const color = Flag.choice("color", ["auto", "always", "never"] as const).pipe(
  Flag.withDescription("ANSI color output mode"),
  Flag.withDefault("auto")
)

const failOnFindings = Flag.boolean("fail-on-findings").pipe(
  Flag.withDescription("Exit with error code when at least one finding exists")
)

const toUserError = (cause: unknown, fallback: string): CliError.UserError =>
  new CliError.UserError({
    cause: cause instanceof Error
      ? cause.message
      : typeof cause === "string"
      ? cause
      : fallback
  })

const cli = Command.make("effect-v4-audit", {
  cwd,
  pattern,
  ignore,
  format,
  color,
  failOnFindings
}, (options) =>
  Effect.gen(function*() {
    const root = path.resolve(options.cwd)
    const toPosix = path.sep === "/" ? (file: string) => file : (file: string) => file.split(path.sep).join("/")

    const files = yield* Effect.tryPromise({
      try: () =>
        glob(options.pattern, {
          cwd: root,
          dot: false,
          follow: false,
          nodir: true,
          ignore: [...defaultIgnorePatterns, ...options.ignore]
        }),
      catch: (cause) => toUserError(cause, "Failed to collect files")
    }).pipe(Effect.map((files) => files.sort((a, b) => toPosix(a).localeCompare(toPosix(b)))))

    const sources = yield* Effect.forEach(files, (file) =>
      Effect.tryPromise({
        try: () => readFile(path.join(root, file), "utf8"),
        catch: (cause) => toUserError(cause, `Failed to read ${file}`)
      }).pipe(Effect.map((content) => ({
        path: toPosix(file),
        content
      }))))

    const report = analyzeV4Sources({ sources })
    const output = options.format === "json"
      ? renderV4AuditJson(report)
      : options.format === "table"
      ? renderV4AuditTable(report)
      : renderV4AuditDiagnostics(report, sources, { color: options.color as V4AuditColorMode })

    yield* Console.log(output)

    if (options.failOnFindings && report.summary.findingCount > 0) {
      yield* Effect.sync(() => {
        process.exitCode = 1
      })
    }
  }))

const main = Command.run(cli, { version: "0.2.2" }).pipe(
  Effect.provide(NodeServices.layer)
)

Effect.runPromise(main)
