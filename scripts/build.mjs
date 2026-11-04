import { spawnSync } from 'node:child_process';
import { mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { format, resolveConfig } from 'prettier';

const root = fileURLToPath(new URL('../', import.meta.url));
const output = join(root, 'js');
const check = process.argv.includes('--check');
const temporary = await mkdtemp(join(tmpdir(), 'house-style-build-'));

try {
  const compiler = spawnSync(
    process.execPath,
    [
      join(root, 'node_modules/typescript/bin/tsc'),
      '--project',
      join(root, 'tsconfig.json'),
      '--outDir',
      temporary,
    ],
    { cwd: root, stdio: 'inherit' },
  );
  if (compiler.error) throw compiler.error;
  if (compiler.status !== 0) {
    process.exitCode = compiler.status ?? 1;
  } else {
    const files = await readdir(temporary);
    const existing = await readdir(output);
    const stale = existing.filter((name) => !files.includes(name));
    const changed = [];
    for (const name of files) {
      const filepath = join(output, name);
      const source = await readFile(join(temporary, name), 'utf8');
      const generated = await format(
        '// Generated from src/ by pnpm run build. Do not edit.\n' + source,
        { ...(await resolveConfig(filepath)), filepath },
      );
      if (check) {
        const committed = existing.includes(name) ? await readFile(filepath, 'utf8') : undefined;
        if (committed !== generated) changed.push(name);
      } else {
        await writeFile(filepath, generated);
      }
    }
    if (check && (changed.length || stale.length)) {
      console.error(
        `Generated files are out of date: ${[...changed, ...stale].join(', ')}. Run pnpm run build and commit js/.`,
      );
      process.exitCode = 1;
    } else if (!check) {
      for (const name of stale) await rm(join(output, name));
    }
  }
} finally {
  await rm(temporary, { recursive: true, force: true });
}
