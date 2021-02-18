import { readFileSync } from 'fs';
import { parseSync } from '@babel/core';
import isValidFunctionArgumentTypeName from '../../utils/type/isValidFunctionArgumentTypeName';

export default function parseServiceFunctionNameToArgAndReturnTypeNameMaps(
  serviceName: string,
  serviceFileName: string,
  remoteServiceRootDir = ''
): [string | undefined, { [key: string]: string }, { [key: string]: string }, { [key: string]: string }] {
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
  const functionNameToFunctionArgumentTypeNameMap: { [key: string]: string } = {};
  const functionNameToFunctionReturnValueTypeNameMap: { [key: string]: string } = {};
  let serviceDocumentation;
  const functionNameToDocumentationMap: { [key: string]: string } = {};
  const nodes = (ast as any).program.body;

  for (const node of nodes) {
    if (
      node.type === 'ExportDefaultDeclaration' &&
      node.declaration.type === 'ClassDeclaration' &&
      node.declaration.id.name === serviceClassName
    ) {
      serviceDocumentation = node.leadingComments?.[0].value;

      for (const classBodyNode of node.declaration.body.body) {
        if (classBodyNode.type === 'TSDeclareMethod') {
          if (classBodyNode.accessibility === 'private' || classBodyNode.accessibility === 'protected') {
            // noinspection ContinueStatementJS
            continue;
          }

          const functionName = classBodyNode.key.name;

          if (classBodyNode.params.length >= 1) {
            const functionArgumentTypeNameStart = classBodyNode.params[0].typeAnnotation.loc.start;
            const functionArgumentTypeNameEnd = classBodyNode.params[0].typeAnnotation.loc.end;
            const functionArgumentTypeName = fileRows[functionArgumentTypeNameStart.line - 1].slice(
              functionArgumentTypeNameStart.column + 2,
              functionArgumentTypeNameEnd.column
            );

            if (!isValidFunctionArgumentTypeName(functionArgumentTypeName, remoteServiceRootDir)) {
              throw new Error(
                serviceName + '.' + functionName + ': input argument type must be a user-defined class type'
              );
            }

            functionNameToFunctionArgumentTypeNameMap[functionName] = functionArgumentTypeName;
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

          functionNameToFunctionReturnValueTypeNameMap[functionName] = returnTypeName;
          functionNameToDocumentationMap[functionName] = classBodyNode.leadingComments?.[0].value;
        }
      }
    }
  }

  return [
    serviceDocumentation,
    functionNameToFunctionArgumentTypeNameMap,
    functionNameToFunctionReturnValueTypeNameMap,
    functionNameToDocumentationMap
  ];
}
