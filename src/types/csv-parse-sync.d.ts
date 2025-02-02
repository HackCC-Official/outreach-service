declare module "csv-parse/sync" {
  import { Options } from "csv-parse";

  /**
   * Parses CSV input synchronously.
   * @param input The CSV data as a string or Buffer.
   * @param options Options for parsing the CSV.
   * @returns An array of parsed records with type T.
   */
  export function parse<T = Record<string, unknown>>(input: Buffer | string, options: Options): T[];
} 