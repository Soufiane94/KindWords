// `npm test`: runs every test twice, once in each time zone the app's
// first users live in (9G). France and Morocco change their clocks on
// different dates (Morocco around Ramadan), and scheduling must stay right
// through both. Extra arguments go to Jest, e.g. `npm test -- reminderPlan`.

const { spawnSync } = require('child_process');

const TIME_ZONES = ['Europe/Paris', 'Africa/Casablanca'];

let failed = false;
for (const timeZone of TIME_ZONES) {
  console.log(`\n=== Tests in ${timeZone} ===\n`);
  const result = spawnSync('npx', ['jest', ...process.argv.slice(2)], {
    stdio: 'inherit',
    shell: true,
    env: { ...process.env, KINDWORDS_TEST_TZ: timeZone },
  });
  if (result.status !== 0) failed = true;
}
process.exit(failed ? 1 : 0);
