import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'

// Use the running DSH's own dependency graph, including its Cordis instance.
export function dshRequire(ctx) {
  return createRequire(ctx.profileContext.installAnchor)
}

export function importDsh(requireDsh, specifier) {
  return import(pathToFileURL(requireDsh.resolve(specifier)).href)
}
