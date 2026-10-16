/**
 * Publishes a version: bumps it, tags it and pushes it, which deploys it.
 *
 *   npm run release -- minor              patch | minor | major | 2.3.0
 *   npm run release -- minor --dry-run    checks and tests only
 *
 * Run it from `dev` with everything committed. It commits "chore: release x.y.z"
 * (package.json, package-lock.json, README badge), tags it vx.y.z with the commits
 * since the previous version as notes, moves `main` up to `dev` and pushes dev, main
 * and the tag together. The tag starts the Deploy workflow.
 */
import { execFileSync, execSync } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('..', import.meta.url));
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const bump = args.find((arg) => !arg.startsWith('--'));

const git = (...gitArgs) => execFileSync('git', gitArgs, { cwd: root, encoding: 'utf8' }).trim();
const run = (command) => execSync(command, { cwd: root, stdio: 'inherit' });

function fail(message) {
    console.error(`\n✖ ${message}`);
    process.exit(1);
}

function isAncestor(commit, of) {
    try {
        git('merge-base', '--is-ancestor', commit, of);
        return true;
    } catch {
        return false;
    }
}

function nextVersion(current, bump) {
    const [major, minor, patch] = current.split('.').map(Number);
    if (bump === 'major') return `${major + 1}.0.0`;
    if (bump === 'minor') return `${major}.${minor + 1}.0`;
    if (bump === 'patch') return `${major}.${minor}.${patch + 1}`;
    if (/^\d+\.\d+\.\d+$/.test(bump)) return bump;
    fail(`Unknown version "${bump}": patch, minor, major or a number like 2.3.0.`);
}

const isNewer = (next, current) => next.localeCompare(current, undefined, { numeric: true }) > 0;

if (!bump) fail('Usage: npm run release -- <patch|minor|major|x.y.z> [--dry-run]');

// Repository state
if (git('branch', '--show-current') !== 'dev') fail('Run it from the dev branch.');
if (git('status', '--porcelain')) fail('Commit or stash your changes first.');
git('fetch', '--quiet', '--tags', 'origin');
if (!isAncestor('origin/dev', 'HEAD')) fail('origin/dev has commits that dev does not: pull first.');
if (!isAncestor('origin/main', 'HEAD')) fail('main has commits that dev does not: merge main into dev first.');

const pkg = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));
const version = nextVersion(pkg.version, bump);
const tag = `v${version}`;
if (!isNewer(version, pkg.version)) fail(`${version} is not newer than ${pkg.version}.`);
if (git('tag', '--list', tag)) fail(`${tag} already exists.`);

const previous = git('tag', '--list', 'v*', '--sort=-v:refname').split('\n')[0];
const notes = git('log', '--no-merges', '--format=- %s', previous ? `${previous}..HEAD` : '-20');
if (!notes) fail(`Nothing to release since ${previous}.`);

console.log(`\n${previous || 'First version'} → ${tag}\n\n${notes}\n`);

run('npx vitest run');

if (dryRun) {
    console.log(`\n✔ Dry run: ${tag} is ready to be released.`);
    process.exit(0);
}

// Version bump
run(`npm version ${version} --no-git-tag-version`);
const readmePath = path.join(root, 'README.md');
const readme = await readFile(readmePath, 'utf8');
await writeFile(readmePath, readme.replace(/badge\/version-[\d.]+-blue/, `badge/version-${version}-blue`));

git('commit', '--all', '--message', `chore: release ${version}`);
git('tag', '--annotate', tag, '--message', `${tag}\n\n${notes}`);

// dev, main and the tag go up together, or none of them does.
try {
    git('push', '--atomic', 'origin', 'HEAD:refs/heads/dev', 'HEAD:refs/heads/main', `refs/tags/${tag}`);
} catch {
    fail(`The push failed: ${tag} is ready locally. Retry with:\n  git push --atomic origin HEAD:refs/heads/dev HEAD:refs/heads/main refs/tags/${tag}`);
}
git('branch', '--force', 'main', 'HEAD');

const repo = git('remote', 'get-url', 'origin').match(/github\.com[:/](.+?)(?:\.git)?$/)?.[1];
console.log(`\n✔ ${tag} released. Deployment: https://github.com/${repo}/actions/workflows/deploy.yml`);
