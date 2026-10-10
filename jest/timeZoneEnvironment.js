// Runs every test file in the time zone named by KINDWORDS_TEST_TZ (9G), so
// the scheduling tests can check clock changes in France and Morocco from
// any computer. Node only follows a time zone set while it's running (on
// Windows it ignores a TZ set before it starts), and test files only see a
// copy of the environment, so it's set here, in the real worker process,
// before each test file runs. Otherwise it's React Native's own test
// environment, which jest-expo uses.

const ReactNativeEnv = require('@react-native/jest-preset/jest/react-native-env.js');

module.exports = class TimeZoneEnvironment extends ReactNativeEnv {
  constructor(config, context) {
    super(config, context);
    if (process.env.KINDWORDS_TEST_TZ) process.env.TZ = process.env.KINDWORDS_TEST_TZ;
  }
};
