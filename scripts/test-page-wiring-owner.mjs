import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { ownsPageWiring } from './lib/page-wiring-owner.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const scratch = path.resolve(root, '.qa-runtime');
fs.mkdirSync(scratch, { recursive: true });
const fixture = fs.mkdtempSync(path.join(scratch, 'page-wiring-'));
const html = '<!doctype html><html><head><title>Fixture</title></head><body>Page</body></html>';
const preserved = ['play/last-bastion/index.html', 'play/last-bastion/dev/index.html',
  'privacy/last-bastion/index.html', 'go/arcade/test/index.html'];
const ordinary = ['index.html', 'play/pinball/index.html', 'privacy/another-game/index.html'];
try {
  for (const rel of [...preserved, ...ordinary]) {
    const target = path.join(fixture, rel);
    fs.mkdirSync(path.dirname(target), { recursive: true }); fs.writeFileSync(target, html);
  }
  assert.equal(ownsPageWiring('play/last-bastion-extra/index.html'), false);
  for (const script of ['build-pwa.mjs', 'build-theme.mjs']) {
    execFileSync(process.execPath, [path.join(root, 'scripts', script)], { cwd: fixture, stdio: 'pipe' });
    const after = Object.fromEntries(ordinary.map(rel => [rel, fs.readFileSync(path.join(fixture, rel), 'utf8')]));
    execFileSync(process.execPath, [path.join(root, 'scripts', script)], { cwd: fixture, stdio: 'pipe' });
    for (const rel of ordinary) assert.equal(fs.readFileSync(path.join(fixture, rel), 'utf8'), after[rel], `${script} must be idempotent: ${rel}`);
    for (const rel of preserved) assert.equal(fs.readFileSync(path.join(fixture, rel), 'utf8'), html, `${script} changed owner-held ${rel}`);
  }
  for (const rel of ordinary) {
    const result = fs.readFileSync(path.join(fixture, rel), 'utf8');
    assert.match(result, /pwa:generated/); assert.match(result, /theme:generated/);
  }
  console.log('Page wiring ownership: both real generators preserve standalone/legal/redirect pages; ordinary pages update idempotently.');
} finally {
  // Only remove the verified fixture created directly under this scratch root.
  assert.equal(path.dirname(path.resolve(fixture)), scratch);
  fs.rmSync(fixture, { recursive: true, force: true });
}
