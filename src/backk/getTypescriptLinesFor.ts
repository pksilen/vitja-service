import { parseSync } from '@babel/core';
import generate from '@babel/generator';
import { readFileSync } from 'fs';
import path from 'path';
import getSrcFilePathNameForTypeName, { hasSrcFilenameForTypeName } from './getSrcFilePathNameForTypeName';

function getDeclarationsFor(typeName: string, originatingTypeFilePathName: string) {
  let fileContentsStr;
  let typeFilePathName;

  if (typeName === 'Id') {
    fileContentsStr = `
    import { MaxLength } from 'class-validator';
    
    export default class Id {
      @MaxLength(24)
      _id!: string;
    }
    `;
  } else {
    typeFilePathName = getSrcFilePathNameForTypeName(typeName);
    fileContentsStr = readFileSync(typeFilePathName, { encoding: 'UTF-8' });
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

export default function getTypescriptLinesFor(
  typeName: string,
  isBaseTypeOptional: boolean,
  keys: string[],
  keyType: 'omit' | 'pick',
  originatingTypeFilePathName: string,
  keyToNewKeyMap?: { [key: string]: string}
): [string[], any[]] {
  let typeFilePathName;
  let fileContentsStr;

  if (hasSrcFilenameForTypeName(typeName)) {
    typeFilePathName = getSrcFilePathNameForTypeName(typeName);
    fileContentsStr = readFileSync(typeFilePathName, { encoding: 'UTF-8' });
  } else {
    if (typeName === 'Id') {
      fileContentsStr = `
    import { MaxLength } from 'class-validator';
    
    export default class Id {
      @MaxLength(24)
      _id!: string;
    }
    `;
    } else if (typeName === 'OptPostQueryOps') {
      fileContentsStr = `
      import { MaxLength, IsOptional, IsArray, IsInt, IsInstance, Min, Max } from 'class-validator';
      
      export class OptPostQueryOps{
  @IsOptional()
  @MaxLength(4096, { each: true })
  @IsArray()
  includeResponseFields?: string[] = [];

  @IsOptional()
  @MaxLength(4096, { each: true })
  @IsArray()
  excludeResponseFields?: string[] = [];

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10000)
  pageNumber?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10000)
  pageSize?: number;

  @IsOptional()
  @IsInstance(SortBy, { each: true })
  @IsArray()
  sortBys?: SortBy[];
}
      `;
    } else {
      throw new Error('Unsupported type: ' + typeName);
    }
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
      if (isBaseTypeOptional && !importLines.includes("import { IsOptional } from 'class-validator';")) {
        importLines.push("import { IsOptional } from 'class-validator';");
      }
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
          if (keyType === 'omit' && keys.includes(propertyName)) {
            return;
          } else if (keyType === 'pick') {
            if (!keys.includes(propertyName)) {
              return;
            }

            if (keyToNewKeyMap && keyToNewKeyMap[propertyName]) {
              classBodyNode.key.name = keyToNewKeyMap[propertyName];
            }
          }
        }
        if (isBaseTypeOptional) {
          const isOptionalDecorator = {
            type: 'Decorator',
            expression: {
              type: 'CallExpression',
              callee: {
                type: 'Identifier',
                name: 'IsOptional'
              },
              arguments: []
            }
          };

          if (classBodyNode.decorators) {
            classBodyNode.decorators.push(isOptionalDecorator);
          } else {
            classBodyNode.decorators = [isOptionalDecorator];
          }
        }
        finalClassPropertyDeclarations.push(classBodyNode);
      });
    }
  }

  return [importLines, finalClassPropertyDeclarations];
}
