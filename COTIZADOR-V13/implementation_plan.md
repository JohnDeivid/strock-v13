# Vercel Build Error Fix: Function Runtimes

The build error `"Function Runtimes must have a valid version, for example now-php@1.0.0"` is caused by an invalid/unrecognized `runtime` value in the `functions` configuration of [vercel.json](file:///c:/Users/User%20Name/Downloads/Cotizador-v10/vercel.json). Specifically, `nodejs24.x` is likely not a recognized internal runtime name for that field, triggering a fallback to legacy builder logic.

In modern Vercel, the Node.js version should be controlled via [package.json](file:///c:/Users/User%20Name/Downloads/Cotizador-v10/package.json) `engines`, and explicit `functions` configuration is usually unnecessary for standard Node.js functions in `/api`.

## Proposed Changes

### Configuration Cleanup

#### [MODIFY] [vercel.json](file:///c:/Users/User%20Name/Downloads/Cotizador-v10/vercel.json)
- Remove the `functions` property entirely.
- Clean up redundant `rewrites`.

## Verification Plan

### Automated Tests
- Run `vercel build` locally (if Vercel CLI is available) to verify that the configuration is now valid.
- Since I cannot run `vercel build` without a linked project, I will verify the JSON syntax and structure against modern Vercel standards.

### Manual Verification
- The user should deploy the updated repository to Vercel. The build should now proceed past the "Function Runtimes" error and correctly pick up Node 24 from `package.json`.
