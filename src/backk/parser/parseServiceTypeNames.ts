import { readFileSync } from 'fs';
import { parseSync } from '@babel/core';

export default function parseServiceTypeNames(
  serviceName: string,
  serviceFileName: string
): [{ [key: string]: string }, { [key: string]: string }] {
  const fileContentsStr = readFileSync(serviceFileName, { encoding: 'UTF-8' });
  const fileRows = fileContentsStr.split('\n');
  const ast = parseSync(fileContentsStr, {
    plugins: [
      ['@babel/plugin-proposal-decorators', { legacy: true }],
      '@babel/plugin-proposal-class-properties',
      '@babel/plugin-transform-typescript'
    ]
  });
  const serviceClassName = serviceName.charAt(0).toUpperCase() + serviceName.slice(1);
  const functionNameToParamTypeNameMap: { [key: string]: string } = {};
  const functionNameToReturnTypeNameMap: { [key: string]: string } = {};

  const nodes = (ast as any).program.body;
  for (const node of nodes) {
    if (
      node.type === 'ExportDefaultDeclaration' &&
      node.declaration.type === 'ClassDeclaration' &&
      node.declaration.id.name === serviceClassName
    ) {
      for (const classBodyNode of node.declaration.body.body) {
        if (classBodyNode.type === 'TSDeclareMethod') {
          const functionName = classBodyNode.key.name;

          if (classBodyNode.params.length >= 1) {
            const paramTypeNameStart = classBodyNode.params[0].typeAnnotation.loc.start;
            const paramTypeNameEnd = classBodyNode.params[0].typeAnnotation.loc.end;
            const paramTypeName = fileRows[paramTypeNameStart.line - 1].slice(
              paramTypeNameStart.column + 2,
              paramTypeNameEnd.column
            );

            if ((paramTypeName.charAt(0) === paramTypeName.charAt(0).toLowerCase() && paramTypeName.charAt(0) !== '_') || paramTypeName.endsWith('[]') || paramTypeName.startsWith('Array<')) {
              throw new Error(serviceName + '.' + functionName + ': input argument type must be a user-defined class type');
            }

            functionNameToParamTypeNameMap[functionName] = paramTypeName;
          }

          const returnTypeNameStart = classBodyNode.returnType.typeAnnotation.loc.start;
          const returnTypeNameEnd = classBodyNode.returnType.typeAnnotation.loc.end;
          let returnTypeName = fileRows[returnTypeNameStart.line - 1].slice(
            returnTypeNameStart.column,
            returnTypeNameEnd.column
          );

          if (returnTypeName.startsWith('Promise')) {
            returnTypeName = returnTypeName.slice(8, -1);
          }

          functionNameToReturnTypeNameMap[functionName] = returnTypeName;
        }
      }
    }
  }

  return [functionNameToParamTypeNameMap, functionNameToReturnTypeNameMap];
}
