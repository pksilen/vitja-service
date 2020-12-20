import { CallOrSendTo } from "../messagequeue/sendInsideTransaction";
import forEachAsyncSequential from "../../utils/forEachAsyncSequential";
import parseRemoteServiceFunctionCallUrlParts from "./parseRemoteServiceFunctionCallUrlParts";
import fs from "fs";
import generateClassFromSrcFile from "../../typescript/generator/generateClassFromSrcFile";
import initializeController from "../../controller/initializeController";
import { plainToClass } from "class-transformer";
import tryValidateServiceFunctionArgument from "../../validation/tryValidateServiceFunctionArgument";
import NoOpDbManager from "../../dbmanager/NoOpDbManager";

export const remoteServiceNameToControllerMap: { [key: string]: any } = {};
const noOpDbManager = new NoOpDbManager('');

export async function validateServiceFunctionArguments(sends: CallOrSendTo[]) {
  await forEachAsyncSequential(sends, async ({ remoteServiceFunctionUrl, serviceFunctionArgument }) => {
    const { topic, serviceFunctionName } = parseRemoteServiceFunctionCallUrlParts(remoteServiceFunctionUrl);

    const [serviceName, functionName] = serviceFunctionName.split('.');
    let controller;

    if (remoteServiceNameToControllerMap[`${topic}$/${serviceName}`]) {
      controller = remoteServiceNameToControllerMap[`${topic}$/${serviceName}`];
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
      remoteServiceNameToControllerMap[`${topic}$/${serviceName}`] = controller;
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
        remoteServiceFunctionUrl +
        ': Invalid remote service function callRemoteService argument: ' +
        JSON.stringify(error.message)
      );
    }
  });
}
