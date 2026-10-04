// Minimal ambient declarations for the handful of Node.js builtins a couple
// of test files shell out to Python with (src/notice.test.ts,
// src/sanitizeBundlePy.test.ts). This project has no @types/node dependency
// (it is a browser-only viewer app) and adding one is out of scope for these
// two tests — so rather than pull in a new devDependency, this declares just
// the two names those tests actually use.
declare module "node:child_process" {
    export function execFileSync(
        command: string,
        args?: readonly string[],
        options?: { cwd?: string; stdio?: string | string[] }
    ): Buffer | string;
}

declare const process: { cwd(): string };
