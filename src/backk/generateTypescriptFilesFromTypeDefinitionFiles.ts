import { parseSync } from "@babel/core";
import generate from "@babel/generator";
import { exec, execSync } from "child_process";
import { readFileSync, writeFileSync } from "fs";
import _ from "lodash";
import { getFileNamesRecursively } from "./getSrcFilePathNameForTypeName";
import getTypeFilePathNameFor from "./getTypeFilePathNameFor";
import getTypescriptLinesFor from "./getTypescriptLinesFor";

function generateTypescriptFileFor(typeFilePathName: string, handledTypeFilePathNames: string[]) {
  const typeFileLines = readFileSync(typeFilePathName, { encoding: 'UTF-8' }).split('\n');
  let outputImportCodeLines: string[] = [];
  let outputClassPropertyDeclarations: any[] = [];
  const codeLines: string[] = [];

  typeFileLines.forEach((typeFileLine) => {
    const trimmedTypeFileLine = typeFileLine.trim();
    if (trimmedTypeFileLine.startsWith('...') && trimmedTypeFileLine.endsWith(';')) {
      const spreadType = trimmedTypeFileLine.slice(3, -1);
      if (spreadType.startsWith('Omit<')) {
        let baseType = spreadType
          .slice(5)
          .split(',')[0]
          .trim();

        let isBaseTypeOptional = false;
        if (baseType.startsWith('Partial<')) {
          baseType = baseType.slice(8, -1);
          isBaseTypeOptional = true;
        }

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

        const [importLines, classPropertyDeclarations] = getTypescriptLinesFor(
          baseType,
          isBaseTypeOptional,
          omittedKeys,
          'omit',
          typeFilePathName
        );
        outputImportCodeLines = outputImportCodeLines.concat(importLines);
        outputClassPropertyDeclarations = outputClassPropertyDeclarations.concat(classPropertyDeclarations);
      } else if (spreadType.startsWith('Pick<')) {
        let baseType = spreadType
          .slice(5)
          .split(',')[0]
          .trim();

        let isBaseTypeOptional = false;
        if (baseType.startsWith('Partial<')) {
          baseType = baseType.slice(8, -1);
          isBaseTypeOptional = true;
        }

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

        const [importLines, classPropertyDeclarations] = getTypescriptLinesFor(
          baseType,
          isBaseTypeOptional,
          pickedKeys,
          'pick',
          typeFilePathName
        );
        outputImportCodeLines = outputImportCodeLines.concat(importLines);
        outputClassPropertyDeclarations = outputClassPropertyDeclarations.concat(classPropertyDeclarations);
      } else {
        const spreadTypeFilePathName = getTypeFilePathNameFor(spreadType);
        let isBaseTypeOptional = false;
        let baseType = spreadType;
        if (baseType.startsWith('Partial<')) {
          baseType = baseType.slice(8, -1);
          isBaseTypeOptional = true;
        }

        if (spreadTypeFilePathName) {
          handledTypeFilePathNames.push(spreadTypeFilePathName);
          generateTypescriptFileFor(spreadTypeFilePathName, handledTypeFilePathNames);
        }

        const [importLines, classPropertyDeclarations] = getTypescriptLinesFor(
          baseType,
          isBaseTypeOptional,
          [],
          'omit',
          typeFilePathName
        );
        outputImportCodeLines = outputImportCodeLines.concat(importLines);
        outputClassPropertyDeclarations = outputClassPropertyDeclarations.concat(classPropertyDeclarations);
      }
    } else {
      codeLines.push(typeFileLine);
    }
  });

  const ast = parseSync(codeLines.join('\n'), {
    plugins: [
      ['@babel/plugin-proposal-decorators', { legacy: true }],
      '@babel/plugin-proposal-class-properties',
      '@babel/plugin-transform-typescript'
    ]
  });

  const nodes = (ast as any).program.body;
  for (const node of nodes) {
    if (
      (node.type === 'ExportDefaultDeclaration' || node.type === 'ExportNamedDeclaration') &&
      node.declaration.type === 'ClassDeclaration'
    ) {
      const declarations = outputClassPropertyDeclarations.concat(node.declaration.body.body);
      declarations.reverse();
      const uniqueDeclarations = _.uniqBy(declarations, (declaration) => declaration.key.name);
      uniqueDeclarations.reverse();
      node.declaration.body.body = uniqueDeclarations;
    }
  }

  const outputCode = generate(ast as any).code;
  const outputFileHeaderLines = [
    '// This is an auto-generated file from the respective .type file',
    '// DO NOT MODIFY THIS FILE! Updates should be made to the respective .type file only',
    "// This file can be generated from the respective .type file by running npm script 'generateTypes'",
    '',
    ..._.uniq(outputImportCodeLines),
    ''
  ];

  let outputFileContentsStr = outputFileHeaderLines.join('\n') + '\n' + outputCode;
  outputFileContentsStr = outputFileContentsStr
    .split('\n')
    .map((outputFileLine) => {
      if (outputFileLine.endsWith(';') && !outputFileLine.startsWith('import')) {
        return outputFileLine + '\n';
      }
      return outputFileLine;
    })
    .join('\n');

  const outputFileName = typeFilePathName.split('.')[0] + '.ts';
  writeFileSync(outputFileName, outputFileContentsStr, { encoding: 'UTF-8' });
  exec(process.cwd() + '/node_modules/.bin/organize-imports-cli ' + outputFileName, () => {
    exec(process.cwd() + '/node_modules/.bin/prettier --write ' + outputFileName);
  });
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
