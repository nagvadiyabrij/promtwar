# AuraCare Automated Git Workflow & Commit Guide

This guide documents the automated Git commit and push system configured for the **AuraCare** Hackathon project.

---

## 🎯 Main Objectives & Features

1. **Automated 10-Minute Cycles:** Evaluates repository changes every 10 minutes without disrupting ongoing coding.
2. **Conventional Commit Messages:** Automatically detects whether changes are in UI, backend, database, security, tests, or documentation, and creates standard conventional commit messages (e.g. `feat: ...`, `fix: ...`, `ui: ...`, `backend: ...`, `test: ...`, `docs: ...`).
3. **Daily Target (40+ Commits):** Maintains persistent daily state tracking (`.git-auto-commit-state.json`) measuring progress toward 40+ genuine commits across a full working day.
4. **Strict Security Filters:** Automatically ignores sensitive files (`.env*`, `*.pem`, `*.key`, `credentials`, `node_modules`, `data/*.sqlite*`, build folders) so secrets are never staged.
5. **Safe Push & Network Retry:** Pushes commits to the configured GitHub remote (`origin`) and active branch, retrying up to 3 times on transient network drops.
6. **Detailed Audit Logging:** Full timestamped history logged to `logs/git-auto-commit.log`.

---

## 🚀 Commands Reference

| Action | Command | Description |
| :--- | :--- | :--- |
| **Start in Background** | `npm run git:start` | Launches background daemon on Windows and records PID |
| **Stop Automation** | `npm run git:stop` | Terminates background process and cleans up PID |
| **Check Live Status** | `npm run git:status` | Shows today's commit count, last commit hash, and daemon status |
| **Run One-Shot Now** | `npm run git:commit-now` | Checks repository once, creates commit if changes exist, pushes, and exits |
| **Run in Foreground** | `npm run git:auto` | Starts automation in foreground console with live color output |

---

## 🔗 Connecting Your GitHub Remote

To enable automatic pushing to GitHub:

```bash
# 1. Add your public GitHub repository URL as origin
git remote add origin https://github.com/YOUR_USERNAME/auracare.git

# 2. Verify remote is configured
git remote -v

# 3. Set upstream branch
git branch -M master
```

Once `origin` is added, any commit created by the automation will be pushed automatically to GitHub. If no remote is configured yet, the automation will create commits locally and log a notice until the remote is added.

---

## ⚙️ Configuration (`git-auto-commit.config.json`)

```json
{
  "intervalMinutes": 10,
  "targetCommitsPerDay": 40,
  "remote": "origin",
  "branch": "auto",
  "maxRetries": 3,
  "retryDelaySeconds": 5,
  "logFile": "logs/git-auto-commit.log",
  "stateFile": ".git-auto-commit-state.json",
  "pidFile": ".git-auto-commit.pid",
  "ignorePatterns": [
    "^\\.env",
    "\\.env\\.",
    "node_modules",
    "data/.*\\.sqlite",
    "dist/",
    "build/",
    "logs/",
    "\\.git/",
    "\\.pem$",
    "\\.key$",
    "credentials",
    "id_rsa"
  ]
}
```

---

## 🧪 Testing the Workflow

Run an immediate one-shot test:

```bash
npm run git:commit-now
```

The system will scan for modified files, stage safe files, generate the conventional commit message, commit, and print the updated status.
