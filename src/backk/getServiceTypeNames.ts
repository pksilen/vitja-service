import { readFileSync } from 'fs';
import { parseSync } from '@babel/core';

export default function getServiceTypeNames(
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
          if (classBodyNode.params.length === 1) {
            const paramTypeNameStart = classBodyNode.params[0].typeAnnotation.loc.start;
            const paramTypeNameEnd = classBodyNode.params[0].typeAnnotation.loc.end;
            functionNameToParamTypeNameMap[functionName] = fileRows[paramTypeNameStart.line - 1].slice(
              paramTypeNameStart.column + 2,
              paramTypeNameEnd.column
            );
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
