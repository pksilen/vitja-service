import _ from 'lodash';
import { parseSync } from '@babel/core';
import generate from '@babel/generator';
import { readFileSync } from 'fs';
import path from 'path';
import getSrcFilePathNameForTypeName, {
  hasSrcFilenameForTypeName
} from '../../utils/file/getSrcFilePathNameForTypeName';

function getDeclarationsFor(typeName: string, originatingTypeFilePathName: string) {
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
  let importLines: string[] = [];
  let classPropertyDeclarations: any[] = [];

  for (const node of nodes) {
    if (node.type === 'ImportDeclaration') {
      if (node.source.value.startsWith('.')) {
        const relativeImportPathName = node.source.value;

        const importAbsolutePathName = path.resolve(
          path.dirname(typeFilePathName ?? ''),
          relativeImportPathName
        );

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
      if (node.declaration.superClass) {
        const [superClassesImportLines, superClassesPropertyDeclarations] = getDeclarationsFor(
          node.declaration.superClass.name,
          originatingTypeFilePathName
        );

        importLines = importLines.concat(superClassesImportLines);
        classPropertyDeclarations = classPropertyDeclarations.concat(superClassesPropertyDeclarations);
      }

      node.declaration.body.body.forEach((classBodyNode: any) => {
        if (classBodyNode.type === 'ClassProperty') {
          classPropertyDeclarations.push(classBodyNode);
        }
      });
    }
  }

  return [importLines, classPropertyDeclarations];
}

export default function parseTypescriptLinesForTypeName(
  typeName: string,
  isBaseTypeOptional: boolean,
  isReadonly: boolean,
  isPublic: boolean,
  keys: string[],
  keyType: 'omit' | 'pick',
  originatingTypeFilePathName: string,
  keyToNewKeyMap?: { [key: string]: string[] }
): [string[], any[]] {
  let typeFilePathName;
  let fileContentsStr;

  if (hasSrcFilenameForTypeName(typeName)) {
    typeFilePathName = getSrcFilePathNameForTypeName(typeName);
    fileContentsStr = readFileSync(typeFilePathName, { encoding: 'UTF-8' });
  } else {
    throw new Error('In type file: ' + originatingTypeFilePathName + ': Unsupported type: ' + typeName);
  }

  const ast = parseSync(fileContentsStr, {
    plugins: [
      ['@babel/plugin-proposal-decorators', { legacy: true }],
      '@babel/plugin-proposal-class-properties',
      '@babel/plugin-transform-typescript'
    ]
  });

  const nodes = (ast as any).program.body;
  let importLines: string[] = [];
  const finalClassPropertyDeclarations: any[] = [];
  const classPropertyNames: string[] = [];

  for (const node of nodes) {
    if (node.type === 'ImportDeclaration') {
      if (node.source.value.startsWith('.')) {
        const relativeImportPathName = node.source.value;

        const importAbsolutePathName = path.resolve(
          path.dirname(typeFilePathName ?? ''),
          relativeImportPathName
        );

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
      let classPropertyDeclarations: any[] = [];

      if (node.declaration.superClass) {
        const [superClassesImportLines, superClassesPropertyDeclarations] = getDeclarationsFor(
          node.declaration.superClass.name,
          originatingTypeFilePathName
        );

        importLines = importLines.concat(superClassesImportLines);
        classPropertyDeclarations = classPropertyDeclarations.concat(superClassesPropertyDeclarations);
      }

      classPropertyDeclarations = classPropertyDeclarations.concat(node.declaration.body.body);

      classPropertyDeclarations.forEach((classBodyNode: any) => {
        if (classBodyNode.type === 'ClassProperty') {
          const propertyName = classBodyNode.key.name;
          classPropertyNames.push(propertyName);

          if (keyType === 'omit' && keys.includes(propertyName)) {
            return;
          } else if (keyType === 'pick') {
            if (!keys.includes(propertyName)) {
              return;
            }

            if (keyToNewKeyMap && keyToNewKeyMap[propertyName]) {
              keyToNewKeyMap[propertyName].forEach((newKey) => {
                const classProperty = _.cloneDeep(classBodyNode);
                classProperty.key.name = newKey;

                if (isBaseTypeOptional) {
                  classProperty.optional = true;
                  classProperty.definite = false;
                }

                if (isReadonly) {
                  classProperty.readonly = true;
                }

                if (isPublic) {
                  classProperty.accessibility = 'public';
                }

                finalClassPropertyDeclarations.push(classProperty);
              });
              return;
            }
          }
        }

        if (isBaseTypeOptional) {
          classBodyNode.optional = true;
          classBodyNode.definite = false;
        }

        if (isReadonly) {
          classBodyNode.readonly = true;
        }

        if (isPublic) {
          classBodyNode.accessibility = 'public';
        }

        finalClassPropertyDeclarations.push(classBodyNode);
      });
    }
  }

  keys.forEach((key) => {
    if (!classPropertyNames.some((classPropertyName) => classPropertyName === key)) {
      throw new Error('In type file: ' +
        originatingTypeFilePathName + ': key: ' + key + ' does not exists in type: ' + typeName
      );
    }
  });

  return [importLines, finalClassPropertyDeclarations];
}
