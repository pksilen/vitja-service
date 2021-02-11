import { readFileSync } from 'fs';

export default function tryGetSeparatedValuesFromFile(filePathName: string, separator = '\n'): string[] {
  return readFileSync(filePathName, { encoding: 'UTF-8' })
    .split(separator)
    .filter((entry) => entry)
    .map((entry) => entry.trim());
}
