// Isolate each experimental VM fixture in its own Node process. On the tested
// Windows Node 22.19 build, many VM contexts in one process can access-violate.
// Every discovered case runs once, without retries; child failures are fatal.
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const pure = spawnSync(process.execPath, ['--test', fileURLToPath(new URL('./feedback-presets.test.mjs', import.meta.url))], {encoding:'utf8', timeout:15000});
process.stdout.write(pure.stdout || '');
if (pure.error || pure.status !== 0) { process.stderr.write(pure.stderr || ''); throw pure.error ?? Error('Feedback preset tests failed'); }
const file = fileURLToPath(new URL('./native-swipe.test.mjs', import.meta.url));
const listing = spawnSync(process.execPath, ['--experimental-vm-modules', file], {
    env: {...process.env, AUTO_REWRITE_LIST_CASES: '1'}, encoding: 'utf8', timeout: 15000,
});
if (listing.error || listing.status !== 0) throw listing.error ?? Error(listing.stderr);
const cases = JSON.parse(listing.stdout);
if (!cases.length || new Set(cases).size !== cases.length) throw Error('Missing or duplicate test names');
let passed = 0;
for (const name of cases) {
    const pattern = '^' + name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$';
    const child = spawnSync(process.execPath, ['--experimental-vm-modules', '--test', '--test-name-pattern=' + pattern, file], {
        env: {...process.env, AUTO_REWRITE_LIST_CASES: '0'}, encoding: 'utf8', timeout: 15000,
    });
    if (child.error || child.status !== 0 || !/# pass 1\r?\n/.test(child.stdout)) {
        process.stderr.write(child.stdout || ''); process.stderr.write(child.stderr || '');
        throw child.error ?? Error(`Test failed: ${name} (exit ${child.status})`);
    }
    console.log(`PASS ${++passed}/${cases.length}: ${name}`);
}
console.log(`All ${passed} cases passed in isolated processes.`);
