import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { cp, mkdir, mkdtemp, readFile, readdir, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

const root = fileURLToPath(new URL('../../', import.meta.url));

// Exercise an isolated checkout so failure checks never modify the real output.
test('build checking rejects stale output and type errors without rewriting shipped files', async () => {
  const checkout = await mkdtemp(join(tmpdir(), 'house-style-build-test-'));
  try {
    await mkdir(join(checkout, 'scripts'));
    for (const path of [
      'src',
      'js',
      'scripts/build.mjs',
      'tsconfig.json',
      'package.json',
      '.prettierrc.json',
    ]) {
      await cp(join(root, path), join(checkout, path), { recursive: true });
    }
    await symlink(join(root, 'node_modules'), join(checkout, 'node_modules'), 'dir');
    const build = (...args) =>
      spawnSync(process.execPath, ['scripts/build.mjs', ...args], {
        cwd: checkout,
        encoding: 'utf8',
      });
    const contents = async () =>
      Object.fromEntries(
        await Promise.all(
          (await readdir(join(checkout, 'js'))).map(async (name) => [
            name,
            await readFile(join(checkout, 'js', name), 'utf8'),
          ]),
        ),
      );
    const expected = await contents();
    const clean = build('--check');
    assert.equal(clean.status, 0, clean.stdout + clean.stderr);

    await writeFile(join(checkout, 'js/cast.js'), '// stale\n');
    await rm(join(checkout, 'js/field.d.ts'));
    await writeFile(join(checkout, 'js/obsolete.js'), '// obsolete\n');
    const stale = await contents();
    const check = build('--check');
    assert.equal(check.status, 1);
    for (const name of ['cast.js', 'field.d.ts', 'obsolete.js'])
      assert.ok(check.stderr.includes(name));
    assert.deepEqual(await contents(), stale);

    const repaired = build();
    assert.equal(repaired.status, 0, repaired.stdout + repaired.stderr);
    assert.deepEqual(await contents(), expected);

    await writeFile(join(checkout, 'src/invalid.ts'), 'export const value: number = "wrong";\n');
    for (const args of [[], ['--check']]) {
      const invalid = build(...args);
      assert.notEqual(invalid.status, 0);
      assert.match(invalid.stdout, /not assignable to type 'number'/);
      assert.deepEqual(await contents(), expected);
    }
  } finally {
    await rm(checkout, { recursive: true, force: true });
  }
});
