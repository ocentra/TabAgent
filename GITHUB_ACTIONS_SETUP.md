# GitHub Actions Setup Guide

This document contains instructions for setting up GitHub Actions secrets and configuration for the TabAgent build and deployment workflow.

## Required GitHub Secrets

### 1. EXTENSION_PEM (Required for CRX Signing)

**Purpose:** Private key used to sign the Chrome extension (.crx file)

**How to add:**

1. Go to your GitHub repository settings
2. Navigate to **Settings → Secrets and variables → Actions**
3. Click **New repository secret**
4. Name: `EXTENSION_PEM`
5. Value: Copy the entire contents of `BKP/Extension.pem.backup` including the header and footer:

```
-----BEGIN PRIVATE KEY-----
MIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQDQb44X1ZvwpqQT
...
(full key contents)
...
JlHb+sA+izdmW4xviC11Qw==
-----END PRIVATE KEY-----
```

6. Click **Add secret**

**Security Note:** 
- ⚠️ Never commit this PEM file to git
- ⚠️ Keep `BKP/Extension.pem.backup` secure and backed up
- ⚠️ This key is already in `.gitignore` as `*.pem`

---

### 2. TABAGENT_DIST_TOKEN (Required for Deployment)

**Purpose:** Personal Access Token (PAT) with write access to the TabAgentDist repository

**How to create:**

1. Go to GitHub **Settings → Developer settings → Personal access tokens → Tokens (classic)**
2. Click **Generate new token (classic)**
3. Name: `TabAgent CI/CD`
4. Expiration: Choose appropriate duration (recommend 1 year)
5. Scopes:
   - ✅ `repo` (Full control of private repositories)
   - ✅ `workflow` (Update GitHub Action workflows)
6. Click **Generate token**
7. **IMPORTANT:** Copy the token immediately (you won't see it again!)

**How to add to repository:**

1. Go to TabAgent repository settings
2. Navigate to **Settings → Secrets and variables → Actions**
3. Click **New repository secret**
4. Name: `TABAGENT_DIST_TOKEN`
5. Value: Paste the PAT you just created
6. Click **Add secret**

---

## Workflow Triggers

The workflow (`build-and-deploy.yml`) runs on:

### 1. Push to `master` branch
```yaml
on:
  push:
    branches: [ master ]
```

**What it does:**
- Builds extension
- Creates signed CRX
- Builds native host binaries (Windows, macOS, Linux)
- Deploys to TabAgentDist repository
- Updates submodule reference

### 2. Manual Dispatch
```yaml
on:
  workflow_dispatch:
    inputs:
      bitnet_version:
        description: 'BitNet build version'
        default: 'latest'
```

**How to trigger:**
1. Go to **Actions** tab
2. Select **Build and Deploy Everything**
3. Click **Run workflow**
4. Choose branch and BitNet version
5. Click **Run workflow**

### 3. Repository Dispatch (BitNet releases)
```yaml
on:
  repository_dispatch:
    types: [bitnet_release]
```

Automatically triggered when BitNet repository creates a new release.

---

## Workflow Jobs Overview

### Job 1: Build Extension
- Checks out code with submodules
- Builds extension → `TabAgentDist/Extension/`
- **Creates signed CRX** → `TabAgentDist/Extension.crx`
- Uploads artifacts

### Job 2: Download BitNet Release
- Downloads latest or specified BitNet release
- Contains CPU and GPU binaries

### Job 3: Build Native Binaries (3 parallel jobs)
- Windows: PyInstaller → `.exe`
- macOS: PyInstaller → binary
- Linux: PyInstaller → binary
- Output: `TabAgentDist/NativeApp/binaries/{platform}/`

### Job 4-6: Prepare Installers (3 parallel jobs)
- Creates platform-specific installers
- Zips extension for distribution

### Job 7: Deploy
- Downloads all artifacts
- Copies to `TabAgentDist` submodule
- Commits and pushes to TabAgentDist repo
- Updates main repo's submodule reference

### Job 8: Create GitHub Release (tags only)
- Triggered when tag `v*` is pushed
- Creates release in TabAgentDist repo
- Attaches extension ZIP

---

## Verifying Setup

### Check Secrets
1. Go to **Settings → Secrets and variables → Actions**
2. Verify both secrets exist:
   - ✅ `EXTENSION_PEM`
   - ✅ `TABAGENT_DIST_TOKEN`

### Test Workflow
1. Make a small change to code
2. Commit and push to a test branch
3. Manually trigger workflow via Actions tab
4. Check workflow logs for:
   - ✅ Submodules initialized
   - ✅ Extension built
   - ✅ CRX created
   - ✅ Binaries built
   - ✅ Deploy succeeded

---

## Troubleshooting

### "Extension.crx not created"
**Cause:** `EXTENSION_PEM` secret not set or invalid

**Fix:**
1. Verify secret exists and contains valid PEM key
2. Check workflow logs for `crx3` errors

### "Permission denied" during deploy
**Cause:** `TABAGENT_DIST_TOKEN` missing or insufficient permissions

**Fix:**
1. Regenerate PAT with `repo` and `workflow` scopes
2. Update secret

### "Submodule not initialized"
**Cause:** Workflow checkout missing `submodules: 'recursive'`

**Fix:** Already fixed in current workflow (all jobs now checkout submodules)

### Build fails on specific platform
**Cause:** Platform-specific dependencies or build tool issues

**Fix:**
1. Check platform-specific job logs
2. Verify `Server/build-tool/` scripts are correct
3. Test locally on that platform

---

## Release Process

### Creating a New Release

1. **Update version** in `manifest.json` and `package.json`
2. **Commit changes** to `master`
3. **Create and push tag:**
   ```bash
   git tag -a v1.0.0 -m "Release v1.0.0"
   git push origin v1.0.0
   ```
4. **Workflow automatically:**
   - Builds everything
   - Deploys to TabAgentDist
   - Creates GitHub release with installers
   - Attaches extension ZIP

### Release Checklist
- [ ] Version updated in `manifest.json`
- [ ] Version updated in `package.json`
- [ ] Changelog updated (if you maintain one)
- [ ] Tag created and pushed
- [ ] Workflow completed successfully
- [ ] Release appears in TabAgentDist repo
- [ ] Extension and installers available for download

---

## Security Best Practices

1. **Never commit secrets to git**
   - PEM keys
   - Access tokens
   - API keys

2. **Rotate tokens regularly**
   - Update `TABAGENT_DIST_TOKEN` annually
   - Regenerate if compromised

3. **Limit token scope**
   - Only grant necessary permissions
   - Use repository-scoped tokens when possible

4. **Monitor workflow logs**
   - Check for exposed secrets (GitHub auto-redacts, but verify)
   - Review failed builds for security issues

5. **Protect branches**
   - Enable branch protection for `master`
   - Require pull request reviews
   - Require status checks to pass

---

## Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [GitHub Secrets Guide](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [Submodules Documentation](https://git-scm.com/book/en/v2/Git-Tools-Submodules)
- [Chrome Extension CRX Format](https://developer.chrome.com/docs/extensions/mv3/hosting/)

