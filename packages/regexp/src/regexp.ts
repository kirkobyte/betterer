import { BettererFileTest, BettererFileIssuesMapRaw, BettererFileIssuesRaw } from '@betterer/betterer';
import * as stack from 'callsite';
import { promises as fs } from 'fs';
import * as glob from 'glob';
import * as minimatch from 'minimatch';
import * as path from 'path';
import { promisify } from 'util';

import { FILE_GLOB_REQUIRED, REGEXP_REQUIRED } from './errors';

const globAsync = promisify(glob);

export function regexpBetterer(globs: string | ReadonlyArray<string>, regexp: RegExp): BettererFileTest {
  if (!globs) {
    throw FILE_GLOB_REQUIRED();
  }
  if (!regexp) {
    throw REGEXP_REQUIRED();
  }

  const [, callee] = stack();
  const cwd = path.dirname(callee.getFileName());
  const globsArray = Array.isArray(globs) ? globs : [globs];
  const resolvedGlobs = globsArray.map((glob) => path.resolve(cwd, glob));

  return new BettererFileTest(async (files) => {
    regexp = new RegExp(regexp.source, regexp.flags.includes('g') ? regexp.flags : `${regexp.flags}g`);

    let testFiles: Array<string> = [];
    if (files.length !== 0) {
      testFiles = files.filter((filePath) => resolvedGlobs.find((currentGlob) => minimatch(filePath, currentGlob)));
    } else {
      await Promise.all(
        resolvedGlobs.map(async (currentGlob) => {
          const globFiles = await globAsync(currentGlob);
          testFiles.push(...globFiles);
        })
      );
    }

    const matches = await Promise.all(
      testFiles.map(async (filePath) => {
        return await getFileMatches(regexp, filePath);
      })
    );

    return testFiles.reduce((fileInfoMap, filePath, index) => {
      fileInfoMap[filePath] = matches[index];
      return fileInfoMap;
    }, {} as BettererFileIssuesMapRaw);
  });
}

async function getFileMatches(regexp: RegExp, filePath: string): Promise<BettererFileIssuesRaw> {
  const matches: Array<RegExpExecArray> = [];
  const fileText = await fs.readFile(filePath, 'utf8');

  let currentMatch;
  do {
    currentMatch = regexp.exec(fileText);
    if (currentMatch) {
      matches.push(currentMatch);
    }
  } while (currentMatch);

  return matches.map((match) => {
    const [matchText] = match;
    return {
      message: 'RegExp match',
      filePath,
      fileText,
      start: match.index,
      end: match.index + matchText.length
    };
  });
}
