# CLAUDE.md

## Project Structure

- Root `package.json` - Extension packaging only (tfx-cli)
- `runInlineCSharpTask/` - Actual task code with its own package.json, TypeScript source, and tests

## Common Commands

```bash
npm run build    # Build the task (runs in runInlineCSharpTask/)
npm test         # Run tests
npm run package  # Create .vsix file locally
```

## Versioning

Versions are set automatically from git tags at build time. Do not manually edit:
- `vss-extension.json` version
- `runInlineCSharpTask/task.json` version

## Releasing

Push a tag matching `v*` to trigger the release workflow:

```bash
git tag v1.0.4
git push origin main
git push origin v1.0.4
```

The workflow will:
1. Update task.json version from the tag
2. Build and test
3. Create a GitHub release with the .vsix attached
4. Publish to Azure DevOps Marketplace (if `AZURE_DEVOPS_PAT` secret is configured)

## Azure DevOps Marketplace

To enable automatic publishing, add an `AZURE_DEVOPS_PAT` secret to the GitHub repository with a PAT that has Marketplace publish permissions.
