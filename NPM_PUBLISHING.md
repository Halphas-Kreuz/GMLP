# Publishing to NPM

This repo can be published as an NPM package so users can install it (or run it via `npx`) without cloning.

## Recommended Package Name

The unscoped name `gmlp-auditor` may be taken on npm. The easiest way to avoid name conflicts is to publish under a scope you control (scopes are lowercase on npm):

- `@kaalveniiz/gmlp-auditor` (example)

Your CLI command can still be `gmlp-auditor` (that is controlled by the `bin` field in `package.json`).

## Dry Run (What Will Be Published)

From the repo root:

```bash
npm pack --dry-run
```

This prints the exact file list that would be included in the published tarball (controlled by `package.json#files`).

## Publish Steps

1. Update `package.json#name` to your final npm package name (often scoped).
2. Login:

```bash
npm login
```

3. Publish:

- If scoped: you likely need `--access public`

```bash
npm publish --access public
```

## Install / Run

After publishing:

- Install globally:

```bash
npm install -g @your-org/gmlp-auditor
gmlp-auditor smoke
```

- Or run via npx:

```bash
npx @your-org/gmlp-auditor smoke
```

## Notes

- This CLI does not store API keys on disk. Keys are entered at runtime (masked) or provided via environment variables.
- Config (endpoints only) is written to `./.gmlp-auditor/config.json` in the directory where the user runs the command.
