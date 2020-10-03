import { readFileSync, writeFileSync } from 'fs';
import { getFileNamesRecursively } from './getSrcFilenameForTypeName';
import getTypeFilePathNameFor from './getTypeFilePathNameFor';
import getTypescriptLinesFor from './getTypescriptLinesFor';

function generateTypescriptFileFor(typeFilePathName: string, handledTypeFilePathNames: string[]) {
  const typeFileLines = readFileSync(typeFilePathName, { encoding: 'UTF-8' }).split('\n');
  let outputImportLines: string[] = [];
  let outputClassPropertyLines: string[] = [];
  typeFileLines.forEach((typeFileLine) => {
    const trimmedTypeFileLine = typeFileLine.trim();
    if (trimmedTypeFileLine.startsWith('...') && trimmedTypeFileLine.endsWith(';')) {
      const spreadType = trimmedTypeFileLine.slice(3, -1);
      if (spreadType.startsWith('Omit<')) {
        const baseType = spreadType
          .slice(5)
          .split(',')[0]
          .trim();

        const ommittedKeyParts = spreadType
          .slice(5)
          .split(',')[1]
          .slice(0, -1)
          .split('|');

        const omittedKeys = ommittedKeyParts.map((omittedKeyPart) => omittedKeyPart.trim().split(/["']/)[1]);

        const baseTypeFilePathName = getTypeFilePathNameFor(baseType);
        if (baseTypeFilePathName) {
          handledTypeFilePathNames.push(baseTypeFilePathName);
          generateTypescriptFileFor(baseTypeFilePathName, handledTypeFilePathNames);
        }

        const [importLines, classPropertyLines] = getTypescriptLinesFor(baseType, omittedKeys, 'omit');
        outputImportLines = outputImportLines.concat(importLines);
        outputClassPropertyLines = outputClassPropertyLines.concat(classPropertyLines);
      } else if (spreadType.startsWith('Pick<')) {
        const baseType = spreadType
          .slice(5)
          .split(',')[0]
          .trim();

        const pickedKeyParts = spreadType
          .slice(5)
          .split(',')[1]
          .slice(0, -1)
          .split('|');

        const pickedKeys = pickedKeyParts.map((pickedKeyPart) => pickedKeyPart.trim().split(/["']/)[1]);

        const baseTypeFilePathName = getTypeFilePathNameFor(baseType);
        if (baseTypeFilePathName) {
          handledTypeFilePathNames.push(baseTypeFilePathName);
          generateTypescriptFileFor(baseTypeFilePathName, handledTypeFilePathNames);
        }

        const [importLines, classPropertyLines] = getTypescriptLinesFor(baseType, pickedKeys, 'pick');
        outputImportLines = outputImportLines.concat(importLines);
        outputClassPropertyLines = outputClassPropertyLines.concat(classPropertyLines);
      } else {
        const spreadTypeFilePathName = getTypeFilePathNameFor(spreadType);
        if (spreadTypeFilePathName) {
          handledTypeFilePathNames.push(spreadTypeFilePathName);
          generateTypescriptFileFor(spreadTypeFilePathName, handledTypeFilePathNames);
        }

        const [importLines, classPropertyLines] = getTypescriptLinesFor(spreadType, [], 'omit');
        outputImportLines = outputImportLines.concat(importLines);
        outputClassPropertyLines = outputClassPropertyLines.concat(classPropertyLines);
      }
    } else {
      outputClassPropertyLines.push(typeFileLine);
    }
  });

  const outputFileLines = [
    '// This is an auto-generated file from the respective .type file',
    '// DO NOT MODIFY THIS FILE! Updates should be made to the respective .type file only',
    "// This file can be generated from the respective .type file by running npm script 'generateTypes'",
    '',
    ...outputImportLines,
    '',
    ...outputClassPropertyLines
  ];

  const outputFileContentsStr = outputFileLines.join('\n');
  const outputFileName = typeFilePathName.split('.')[0] + '.ts';
  writeFileSync(outputFileName, outputFileContentsStr, { encoding: 'UTF-8' });
}

(function generateTypescriptFilesFromTypeDefinitionFiles() {
  const filePathNames = getFileNamesRecursively(process.cwd() + '/src');
  const handledTypeFilePathNames: string[] = [];

  filePathNames
    .filter((filePathName: string) => filePathName.endsWith('.type'))
    .forEach((typeFilePathName) => {
      if (handledTypeFilePathNames.includes(typeFilePathName)) {
        return;
      }

      generateTypescriptFileFor(typeFilePathName, handledTypeFilePathNames);
    });
})();
