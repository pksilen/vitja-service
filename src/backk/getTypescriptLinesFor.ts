import { parseSync } from '@babel/core';
import generate from '@babel/generator';
import { readFileSync } from 'fs';
import getSrcFilenameForTypeName, { hasSrcFilenameForTypeName } from './getSrcFilenameForTypeName';

export default function getTypescriptLinesFor(
  typeName: string,
  keys: string[],
  keyType: 'omit' | 'pick'
): [string[], string[]] {
  if (!hasSrcFilenameForTypeName(typeName)) {
    if (typeName === 'Id') {
      return [[], ['@IsString()', '@MaxLength(24)', '_id!: string;']];
    }
  }

  const typeFile = getSrcFilenameForTypeName(typeName);
  const fileContentsStr = readFileSync(typeFile, { encoding: 'UTF-8' });

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
