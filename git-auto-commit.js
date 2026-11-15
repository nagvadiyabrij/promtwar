#!/usr/bin/env node

/**
 * git-auto-commit.js
 * Automated Git commit and push workflow engine for AuraCare Hackathon Project.
 * 
 * Features:
 * - Runs every 10 minutes (configurable via config or --interval <min>)
 * - Automatically detects added, modified, and deleted files
 * - Strictly ignores sensitive files (.env, secrets, node_modules, build outputs, db files)
 * - Generates clear conventional commit messages based on file semantics
 * - Targets 40+ genuine commits across a full working day
 * - Pushes commits to connected GitHub remote safely with retry logic
 * - Maintains comprehensive logs in logs/git-auto-commit.log
 * - Supports daemon mode, one-shot mode (--once), and status query (--status)
 */

import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

// Load or default configuration
const CONFIG_PATH = path.resolve('git-auto-commit.config.json');
let config = {
  intervalMinutes: 10,
  targetCommitsPerDay: 40,
  remote: 'origin',
  branch: 'auto',
  maxRetries: 3,
  retryDelaySeconds: 5,
  logFile: 'logs/git-auto-commit.log',
  stateFile: '.git-auto-commit-state.json',
  pidFile: '.git-auto-commit.pid',
  ignorePatterns: [
    '^\\.env',
    '\\.env\\.',
    'node_modules',
    'data/.*\\.sqlite',
    'dist/',
    'build/',
    'logs/',
    '\\.git/',
    '\\.pem$',
    '\\.key$',
    'credentials',
    'id_rsa'
  ]
};

if (fs.existsSync(CONFIG_PATH)) {
  try {
    const raw = fs.readFileSync(CONFIG_PATH, 'utf8');
    config = { ...config, ...JSON.parse(raw) };
  } catch (err) {
    console.warn('[GitAutoCommit] Warning: Could not parse config file, using defaults.', err.message);
  }
}

// Ensure logs directory exists
const logFilePath = path.resolve(config.logFile);
const logDir = path.dirname(logFilePath);
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Logger utility
function log(level, message, meta = null) {
  const timestamp = new Date().toISOString();
  const metaStr = meta ? ` | ${JSON.stringify(meta)}` : '';
  const fileLog = `[${timestamp}] [${level.toUpperCase()}] ${message}${metaStr}\n`;

  // Write to log file
  try {
    fs.appendFileSync(logFilePath, fileLog, 'utf8');
  } catch (err) {
    console.error('Failed to write to log file:', err.message);
  }

  // Console output with color formatting
  let color = '\x1b[36m'; // Cyan
  if (level === 'warn') color = '\x1b[33m'; // Yellow
  if (level === 'error') color = '\x1b[31m'; // Red
  if (level === 'success') color = '\x1b[32m'; // Green

  console.log(`${color}[GitAutoCommit ${timestamp.slice(11, 19)}] [${level.toUpperCase()}]\x1b[0m ${message}`);
}

// Helper: Run Git command safely and return trimmed stdout
function runGit(command, options = {}) {
  try {
    return execSync(`git ${command}`, {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
      ...options
    }).trim();
  } catch (err) {
    const stderr = err.stderr ? err.stderr.toString().trim() : err.message;
    throw new Error(stderr || `Git command failed: git ${command}`);
  }
}

// State tracking (Daily commit counter towards 40+ target)
const stateFilePath = path.resolve(config.stateFile);

function loadState() {
  const today = new Date().toISOString().split('T')[0];
  let state = {
    date: today,
    dailyCommitCount: 0,
    totalCommitsAllTime: 0,
    lastCommitHash: null,
    lastCommitMessage: null,
    lastCommitTimestamp: null,
    history: []
  };

  if (fs.existsSync(stateFilePath)) {
    try {
      const data = JSON.parse(fs.readFileSync(stateFilePath, 'utf8'));
      if (data.date === today) {
        state = { ...state, ...data };
      } else {
        // New day rollover
        state.totalCommitsAllTime = data.totalCommitsAllTime || 0;
        state.date = today;
        state.dailyCommitCount = 0;
        state.history = [];
      }
    } catch (e) {
      log('warn', 'Could not read existing state file. Rebuilding state.');
    }
  }

  return state;
}

function saveState(state) {
  try {
    fs.writeFileSync(stateFilePath, JSON.stringify(state, null, 2), 'utf8');
  } catch (err) {
    log('error', `Failed to write state file: ${err.message}`);
  }
}

// Check if a file path is ignored by sensitive ignore rules
function isFileIgnored(filePath) {
  const normalized = filePath.replace(/\\/g, '/');
  for (const pattern of config.ignorePatterns) {
    const regex = new RegExp(pattern, 'i');
    if (regex.test(normalized)) {
      return true;
    }
  }
  return false;
}

// Generate Conventional Commit message based on changed files
function generateCommitMessage(changedFiles) {
  const files = changedFiles.map(f => f.replace(/\\/g, '/'));

  const uiFiles = files.filter(f => f.startsWith('src/'));
  const backendFiles = files.filter(f => f.startsWith('server/'));
  const testFiles = files.filter(f => f.startsWith('tests/'));
  const docFiles = files.filter(f => f.endsWith('.md'));
  const configFiles = files.filter(f =>
    f.includes('config') || f.includes('Dockerfile') || f.includes('cloudbuild') || f.includes('package')
  );

  // 1. UI changes
  if (uiFiles.length > 0 && backendFiles.length === 0) {
    if (uiFiles.some(f => f.includes('Elderly') || f.includes('Senior'))) {
      return 'ui: enhance senior 1-touch dashboard and accessibility controls';
    }
    if (uiFiles.some(f => f.includes('Caregiver'))) {
      return 'ui: update caregiver dashboard and vitals monitoring layout';
    }
    if (uiFiles.some(f => f.includes('Medications'))) {
      return 'feat: enhance medication management interface and pill cards';
    }
    if (uiFiles.some(f => f.includes('Appointments'))) {
      return 'feat: improve medical appointment booking and calendar view';
    }
    if (uiFiles.some(f => f.includes('Adherence'))) {
      return 'feat: update adherence analytics and interactive charts';
    }
    if (uiFiles.some(f => f.includes('Navbar') || f.includes('Footer'))) {
      return 'ui: improve responsive navigation and emergency controls';
    }
    if (uiFiles.some(f => f.includes('Login') || f.includes('Passcode') || f.includes('Register'))) {
      return 'feat: refine passcode PIN authentication and access views';
    }
    return `ui: update user interface components (${uiFiles.length} files)`;
  }

  // 2. Backend changes
  if (backendFiles.length > 0 && uiFiles.length === 0) {
    if (backendFiles.some(f => f.includes('auth') || f.includes('middleware'))) {
      return 'security: improve role-based authorization and authentication';
    }
    if (backendFiles.some(f => f.includes('cron') || f.includes('email') || f.includes('reminder'))) {
      return 'backend: refine proactive email reminder and cron scheduler';
    }
    if (backendFiles.some(f => f.includes('ai.js'))) {
      return 'backend: enhance Gemini AI drug interaction analysis engine';
    }
    if (backendFiles.some(f => f.includes('db.js') || f.includes('schema'))) {
      return 'database: update database schema and query handlers';
    }
    if (backendFiles.some(f => f.includes('medications.js'))) {
      return 'backend: update medication management and refill APIs';
    }
    if (backendFiles.some(f => f.includes('adherence.js'))) {
      return 'backend: optimize adherence tracking and dose logging APIs';
    }
    return `backend: update server API endpoints and services`;
  }

  // 3. Tests
  if (testFiles.length > 0 && uiFiles.length === 0 && backendFiles.length === 0) {
    return 'test: update automated API tests and verification suite';
  }

  // 4. Documentation
  if (docFiles.length > 0 && uiFiles.length === 0 && backendFiles.length === 0) {
    return 'docs: update project documentation and guides';
  }

  // 5. Config / Build
  if (configFiles.length > 0 && uiFiles.length === 0 && backendFiles.length === 0) {
    return 'build: update project configuration and build workflow';
  }

  // 6. Cross-stack full-feature update
  if (uiFiles.length > 0 && backendFiles.length > 0) {
    return 'feat: implement healthcare workflow improvements across frontend and backend';
  }

  return 'feat: update project codebase and features';
}

// Get the current active git branch
function getCurrentBranch() {
  try {
    const branch = runGit('branch --show-current');
    if (branch) return branch;
  } catch {}

  try {
    const status = runGit('status');
    const match = status.match(/On branch (\S+)/);
    if (match) return match[1];
  } catch {}

  return 'master';
}

// Push to GitHub with retry logic
function pushToRemote(branch) {
  let remotes = [];
  try {
    const remoteOutput = runGit('remote');
    remotes = remoteOutput.split('\n').map(r => r.trim()).filter(Boolean);
  } catch (err) {
    log('warn', `Could not query remotes: ${err.message}`);
    return false;
  }

  const targetRemote = config.remote || 'origin';
  if (!remotes.includes(targetRemote)) {
    log('info', `No remote '${targetRemote}' configured yet. Commit created locally.`);
    log('info', `Once connected ('git remote add origin <repo-url>'), commits will push automatically.`);
    return false;
  }

  let attempt = 0;
  while (attempt < config.maxRetries) {
    attempt++;
    try {
      log('info', `Pushing commits to ${targetRemote}/${branch} (Attempt ${attempt}/${config.maxRetries})...`);
      runGit(`push -u ${targetRemote} ${branch}`);
      log('success', `Successfully pushed commits to ${targetRemote}/${branch}!`);
      return true;
    } catch (err) {
      log('warn', `Push attempt ${attempt} failed: ${err.message}`);
      if (attempt < config.maxRetries) {
        const delayMs = config.retryDelaySeconds * 1000;
        log('info', `Retrying push in ${config.retryDelaySeconds} seconds...`);
        execSync(`node -e "setTimeout(() => {}, ${delayMs})"`);
      }
    }
  }

  log('error', `Failed to push to ${targetRemote}/${branch} after ${config.maxRetries} attempts. Will retry on next check.`);
  return false;
}

// Main execution cycle
export async function executeAutoCommitCycle() {
  log('info', '==================================================');
  log('info', 'Checking repository for modified and new changes...');

  let porcelainOutput = '';
  try {
    porcelainOutput = runGit('status --porcelain -uall');
  } catch (err) {
    log('error', `Failed to get git status: ${err.message}`);
    return { success: false, reason: 'git_status_failed' };
  }

  if (!porcelainOutput) {
    log('info', 'No changes detected. Working tree clean. (No commit created)');
    return { success: true, committed: false, reason: 'clean_working_tree' };
  }

  // Parse porcelain lines
  const lines = porcelainOutput.split('\n').filter(Boolean);
  const eligibleFiles = [];
  const ignoredFiles = [];

  for (const line of lines) {
    const statusPart = line.slice(0, 2);
    const rawFile = line.slice(2).trim();
    // Handle renamed files: "old -> new"
    const file = rawFile.includes(' -> ') ? rawFile.split(' -> ')[1] : rawFile;

    if (isFileIgnored(file)) {
      ignoredFiles.push(file);
    } else {
      eligibleFiles.push({ file, status: statusPart });
    }
  }

  if (ignoredFiles.length > 0) {
    log('info', `Safely skipped ${ignoredFiles.length} sensitive or excluded files:`, ignoredFiles.slice(0, 5));
  }

  if (eligibleFiles.length === 0) {
    log('info', 'Only ignored or sensitive files changed. No code commit required.');
    return { success: true, committed: false, reason: 'only_ignored_files' };
  }

  log('info', `Found ${eligibleFiles.length} eligible file change(s) to commit:`);
  eligibleFiles.forEach(f => log('info', `  [${f.status.trim() || 'M'}] ${f.file}`));

  // Stage eligible files individually
  for (const item of eligibleFiles) {
    try {
      runGit(`add "${item.file}"`);
    } catch (err) {
      log('warn', `Could not stage file ${item.file}: ${err.message}`);
    }
  }

  // Verify staged changes exist
  let stagedFiles = '';
  try {
    stagedFiles = runGit('diff --cached --name-only');
  } catch (err) {
    log('error', `Failed to check staged changes: ${err.message}`);
    return { success: false, reason: 'diff_failed' };
  }

  if (!stagedFiles) {
    log('info', 'No staged changes available after filtering. Skipping commit.');
    return { success: true, committed: false };
  }

  // Generate conventional commit message
  const stagedList = stagedFiles.split('\n').filter(Boolean);
  const commitMessage = generateCommitMessage(stagedList);

  // Load current state
  const state = loadState();
  const nextDailyCount = (state.dailyCommitCount || 0) + 1;
  const targetCommits = config.targetCommitsPerDay || 40;

  log('info', `Creating commit #${nextDailyCount} of today's target (Goal: ${targetCommits}+):`);
  log('info', `Commit Message: "${commitMessage}"`);

  // Create the commit
  let commitHash = '';
  try {
    runGit(`commit -m "${commitMessage}"`);
    commitHash = runGit('rev-parse --short HEAD');
    log('success', `Commit successfully created: [${commitHash}] ${commitMessage}`);
  } catch (err) {
    log('error', `Failed to create commit: ${err.message}`);
    return { success: false, reason: 'commit_failed' };
  }

  // Update State Tracking
  const now = new Date().toISOString();
  state.dailyCommitCount = nextDailyCount;
  state.totalCommitsAllTime = (state.totalCommitsAllTime || 0) + 1;
  state.lastCommitHash = commitHash;
  state.lastCommitMessage = commitMessage;
  state.lastCommitTimestamp = now;
  state.history.push({
    hash: commitHash,
    message: commitMessage,
    timestamp: now,
    filesCount: stagedList.length
  });

  saveState(state);
  log('info', `Daily Progress: ${nextDailyCount}/${targetCommits} commits completed today.`);

  // Push to remote
  const currentBranch = getCurrentBranch();
  const pushSuccess = pushToRemote(currentBranch);

  return {
    success: true,
    committed: true,
    hash: commitHash,
    message: commitMessage,
    dailyCommitCount: nextDailyCount,
    pushed: pushSuccess
  };
}

// Display current status
function printStatus() {
  const state = loadState();
  console.log('\n======================================================');
  console.log('       AuraCare Git Automation Engine Status          ');
  console.log('======================================================');
  console.log(`Date:                   ${state.date}`);
  console.log(`Today's Commits:        ${state.dailyCommitCount} / ${config.targetCommitsPerDay} (Target: 40+)`);
  console.log(`Total Commits (All):    ${state.totalCommitsAllTime}`);
  console.log(`Check Interval:         Every ${config.intervalMinutes} minutes`);
  console.log(`Target Remote:          ${config.remote}`);
  console.log(`Active Branch:          ${getCurrentBranch()}`);
  console.log(`Log File:               ${config.logFile}`);
  console.log(`Last Commit Hash:       ${state.lastCommitHash || 'None'}`);
  console.log(`Last Commit Message:    ${state.lastCommitMessage || 'None'}`);
  console.log(`Last Commit Time:       ${state.lastCommitTimestamp || 'None'}`);

  const pidFile = path.resolve(config.pidFile);
  if (fs.existsSync(pidFile)) {
    const pid = fs.readFileSync(pidFile, 'utf8').trim();
    console.log(`Background Process:     ACTIVE (PID: ${pid})`);
  } else {
    console.log(`Background Process:     INACTIVE`);
  }
  console.log('======================================================\n');
}

// CLI Argument Handling
const args = process.argv.slice(2);

if (args.includes('--status')) {
  printStatus();
  process.exit(0);
}

if (args.includes('--once')) {
  log('info', 'Running one-shot auto-commit check...');
  executeAutoCommitCycle().then((res) => {
    printStatus();
    process.exit(res.success ? 0 : 1);
  });
} else {
  // Continuous Scheduler Daemon Mode
  const intervalMinutes = args.includes('--interval')
    ? parseInt(args[args.indexOf('--interval') + 1], 10) || config.intervalMinutes
    : config.intervalMinutes;

  const intervalMs = intervalMinutes * 60 * 1000;

  // Record PID
  const pidFile = path.resolve(config.pidFile);
  fs.writeFileSync(pidFile, process.pid.toString(), 'utf8');

  // Handle process shutdown
  const cleanup = () => {
    log('info', 'Stopping Git Automation Scheduler...');
    if (fs.existsSync(pidFile)) {
      try { fs.unlinkSync(pidFile); } catch {}
    }
    process.exit(0);
  };

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);

  log('info', `======================================================`);
  log('info', `🚀 AuraCare Git Auto-Commit Daemon Started`);
  log('info', `🕒 Schedule: Checking every ${intervalMinutes} minutes`);
  log('info', `🎯 Target: 40+ meaningful commits across the working day`);
  log('info', `📄 Logs saved to: ${config.logFile}`);
  log('info', `======================================================`);

  // Run immediately on launch
  executeAutoCommitCycle();

  // Schedule recurring interval
  setInterval(executeAutoCommitCycle, intervalMs);
}
