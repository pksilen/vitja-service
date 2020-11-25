import { readFileSync } from 'fs';
import * as ts from 'typescript';
import path from 'path';
import getSrcFilePathNameForTypeName from '../utils/file/getSrcFilePathNameForTypeName';
import { getFromContainer, MetadataStorage } from "class-validator";

export default function generateClassFromSrcFile(typeName: string) {
  const srcFilePathName = getSrcFilePathNameForTypeName(typeName);
  const fileContentsStr = readFileSync(srcFilePathName, { encoding: 'UTF-8' });
  const srcDirectory = path.dirname(srcFilePathName).split(/src/)[1];
  const result = ts.transpileModule(fileContentsStr, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2017,
      emitDecoratorMetadata: true,
      experimentalDecorators: true
    }
  });

  const newOutputText = result.outputText.replace(
    /require\("\.{2}\//g,
    'require("../../../dist' + srcDirectory + '/../'
  );
  const generatedClass = eval(newOutputText);
  console.log(getFromContainer(MetadataStorage).getTargetValidationMetadatas(generatedClass, ''));
  return generatedClass;
}
