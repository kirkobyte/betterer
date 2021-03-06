import { betterer } from '@betterer/betterer';

import { createFixture } from './fixture';

describe('betterer', () => {
  it('should report the existence of RegExp matches', async () => {
    const { logs, paths, readFile, cleanup, resolve, writeFile } = await createFixture('test-betterer-regexp', {
      '.betterer.js': `
const { regexpBetterer } = require('@betterer/regexp');

module.exports = {
  'regexp no hack comments': regexpBetterer('./src/**/*.ts', /(\\/\\/\\s*HACK)/i)
};      
      `
    });

    const configPaths = [paths.config];
    const resultsPath = paths.results;
    const indexPath = resolve('./src/index.ts');

    await writeFile(indexPath, `// HACK:`);

    const newTestRun = await betterer({ configPaths, resultsPath });

    expect(newTestRun.new).toEqual(['regexp no hack comments']);

    const sameTestRun = await betterer({ configPaths, resultsPath });

    expect(sameTestRun.same).toEqual(['regexp no hack comments']);

    await writeFile(indexPath, `// HACK:\n// HACK:`);

    const worseTestRun = await betterer({ configPaths, resultsPath });

    expect(worseTestRun.worse).toEqual(['regexp no hack comments']);

    const result = await readFile(resultsPath);

    expect(result).toMatchSnapshot();

    await writeFile(indexPath, ``);

    const betterTestRun = await betterer({ configPaths, resultsPath });

    expect(betterTestRun.better).toEqual(['regexp no hack comments']);

    const completedTestRun = await betterer({ configPaths, resultsPath });

    expect(completedTestRun.completed).toEqual(['regexp no hack comments']);

    expect(logs).toMatchSnapshot();

    await cleanup();
  });

  it('should throw if there is no globs', async () => {
    const { paths, logs, cleanup } = await createFixture('test-betterer-regexp-no-globs', {
      '.betterer.js': `
const { regexpBetterer } = require('@betterer/regexp');

module.exports = {
  'regexp no hack comments': regexpBetterer()
};
      `
    });

    const configPaths = [paths.config];
    const resultsPath = paths.results;

    await expect(async () => await betterer({ configPaths, resultsPath })).rejects.toThrow();

    expect(logs).toMatchSnapshot();

    await cleanup();
  });

  it('should throw if there is no regexp', async () => {
    const { paths, logs, cleanup } = await createFixture('test-betterer-regexp-no-regexp', {
      '.betterer.js': `
const { regexpBetterer } = require('@betterer/regexp');

module.exports = {
  'regexp no hack comments': regexpBetterer('./src/**/*.ts')
};      
      `
    });

    const configPaths = [paths.config];
    const resultsPath = paths.results;

    await expect(async () => await betterer({ configPaths, resultsPath })).rejects.toThrow();

    expect(logs).toMatchSnapshot();

    await cleanup();
  });
});
