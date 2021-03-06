export type BettererConfigPaths = ReadonlyArray<string>;
export type BettererConfigFilters = ReadonlyArray<RegExp>;
export type BettererConfigIgnore = ReadonlyArray<string>;

export type BettererConfigPartial = Partial<{
  configPaths: BettererConfigPaths | string;
  resultsPath: string;
  filters: BettererConfigFilters | ReadonlyArray<string> | string;
  ignores: BettererConfigIgnore | string;
  cwd: string;
  update: boolean;
}>;

export type BettererConfig = {
  configPaths: BettererConfigPaths;
  resultsPath: string;
  filters: BettererConfigFilters;
  ignores: BettererConfigIgnore;
  cwd: string;
  update: boolean;
};
