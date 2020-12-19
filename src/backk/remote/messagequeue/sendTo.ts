import * as fs from 'fs';
import { CompressionTypes } from 'kafkajs';
import { ErrorResponse } from '../../types/ErrorResponse';
import { getNamespace } from 'cls-hooked';
import { Send } from './sendInsideTransaction';
import sendOneOrMoreToKafka, { SendAcknowledgementType } from './kafka/sendOneOrMoreToKafka';
import sendOneOrMoreToRedis from './redis/sendOneOrMoreToRedis';
import parseRemoteServiceFunctionCallUrlParts from '../utils/parseRemoteServiceFunctionCallUrlParts';
import getSrcFilePathNameForTypeName from '../../utils/file/getSrcFilePathNameForTypeName';
import forEachAsyncSequential from '../../utils/forEachAsyncSequential';
import initializeController from '../../controller/initializeController';
import NoOpDbManager from '../../dbmanager/NoOpDbManager';
import tryValidateServiceFunctionArgument from '../../validation/tryValidateServiceFunctionArgument';
import { plainToClass } from 'class-transformer';
import generateClassFromSrcFile from '../../typescript/generator/generateClassFromSrcFile';
import { getFromContainer, MetadataStorage } from 'class-validator';

export interface SendToOptions {
  compressionType?: CompressionTypes;
  sendAcknowledgementType?: SendAcknowledgementType;
}

const remoteServiceNameToControllerMap: { [key: string]: any } = {};
const noOpDbManager = new NoOpDbManager('');

async function validateServiceFunctionArguments(sends: Send[]) {
  await forEachAsyncSequential(sends, async ({ serviceFunctionCallUrl, serviceFunctionArgument }) => {
    const { topic, serviceFunctionName } = parseRemoteServiceFunctionCallUrlParts(serviceFunctionCallUrl);

    const [serviceName, functionName] = serviceFunctionName.split('.');
    let controller;

    if (remoteServiceNameToControllerMap[serviceName]) {
      controller = remoteServiceNameToControllerMap[serviceName];
    } else {
      let remoteServiceRootDir;

      if (fs.existsSync('../' + topic)) {
        remoteServiceRootDir = '../' + topic;
      } else if (fs.existsSync('./' + topic)) {
        remoteServiceRootDir = './' + topic;
      } else {
        return;
      }

      const ServiceClass = generateClassFromSrcFile(
        serviceName.charAt(0).toUpperCase() + serviceName.slice(1) + 'Impl',
        remoteServiceRootDir
      );

      const serviceInstance = new ServiceClass(noOpDbManager);

      controller = {
        [serviceName]: serviceInstance
      };

      initializeController(controller, noOpDbManager, undefined, remoteServiceRootDir);
      remoteServiceNameToControllerMap[serviceName] = controller;
    }

    const serviceFunctionArgumentClassName =
      controller[`${serviceName}Types`].functionNameToParamTypeNameMap[functionName];

    const ServiceFunctionArgumentClass = controller[serviceName].Types[serviceFunctionArgumentClassName];

    const instantiatedServiceFunctionArgument = plainToClass(
      ServiceFunctionArgumentClass,
      serviceFunctionArgument
    );

    try {
      await tryValidateServiceFunctionArgument(
        functionName,
        noOpDbManager,
        instantiatedServiceFunctionArgument as object
      );
    } catch (error) {
      throw new Error(
        serviceFunctionCallUrl +
          ': Invalid remote service function call argument: ' +
          JSON.stringify(error.message)
      );
    }
  });
}

export async function sendOneOrMore(sends: Send[], isTransactional: boolean): Promise<void | ErrorResponse> {
  const clsNamespace = getNamespace('serviceFunctionExecution');
  clsNamespace?.set('remoteServiceCallCount', clsNamespace?.get('remoteServiceCallCount') + 1);

  if (process.env.NODE_ENV === 'development') {
    await validateServiceFunctionArguments(sends);
  }

  const { scheme } = parseRemoteServiceFunctionCallUrlParts(sends[0].serviceFunctionCallUrl);

  if (scheme === 'kafka') {
    return await sendOneOrMoreToKafka(sends, isTransactional);
  } else if (scheme === 'redis') {
    return await sendOneOrMoreToRedis(sends, isTransactional);
  }
}

export default async function sendTo(
  serviceFunctionCallUrl: string,
  serviceFunctionArgument: object,
  responseUrl?: string,
  options?: SendToOptions
): Promise<void | ErrorResponse> {
  return await sendOneOrMore(
    [
      {
        serviceFunctionCallUrl,
        serviceFunctionArgument,
        responseUrl,
        options
      }
    ],
    false
  );
}
