import { parseSync } from '@babel/core';
import generate from '@babel/generator';
import { readFileSync } from 'fs';
import path from 'path';
import getSrcFilePathNameForTypeName, { hasSrcFilenameForTypeName } from './getSrcFilePathNameForTypeName';

export default function getTypescriptLinesFor(
  typeName: string,
  keys: string[],
  keyType: 'omit' | 'pick',
  originatingTypeFilePathName: string
): [string[], string[]] {
  if (!hasSrcFilenameForTypeName(typeName)) {
    if (typeName === 'Id') {
      return [[], ['@IsString()', '@MaxLength(24)', '_id!: string;']];
    }
  }

  const typeFilePathName = getSrcFilePathNameForTypeName(typeName);
  const fileContentsStr = readFileSync(typeFilePathName, { encoding: 'UTF-8' });

  const ast = parseSync(fileContentsStr, {
    plugins: [
      ['@babel/plugin-proposal-decorators', { legacy: true }],
      '@babel/plugin-proposal-class-properties',
      '@babel/plugin-transform-typescript'
    ]
  });

  const nodes = (ast as any).program.body;
  const importLines: string[] = [];
  const classPropertyLines: string[] = [];

  for (const node of nodes) {
    if (node.type === 'ImportDeclaration') {
      if (node.source.value.startsWith('.')) {
        const relativeImportPathName = node.source.value;
        const importAbsolutePathName = path.resolve(path.dirname(typeFilePathName), relativeImportPathName);
        const newRelativeImportPathName = path.relative(
          path.dirname(originatingTypeFilePathName),
          importAbsolutePathName
        );

        if (newRelativeImportPathName !== relativeImportPathName) {
          node.source.value = newRelativeImportPathName;
        }
      }

      importLines.push(generate(node).code);
    }
    if (
      (node.type === 'ExportDefaultDeclaration' || node.type === 'ExportNamedDeclaration') &&
      node.declaration.type === 'ClassDeclaration'
    ) {
      node.declaration.body.body.forEach((classBodyNode: any) => {
        if (classBodyNode.type === 'ClassProperty') {
          const propertyName = classBodyNode.key.name;
          if (keyType === 'omit' && keys.includes(propertyName)) {
            return;
          } else if (keyType === 'pick') {
            if (keys.includes(propertyName)) {
              classPropertyLines.push(generate(classBodyNode).code + '\n');
            }
            return;
          }
        }
        classPropertyLines.push(generate(classBodyNode).code + '\n');
      });
    }
  }

  return [importLines, classPropertyLines];
}
