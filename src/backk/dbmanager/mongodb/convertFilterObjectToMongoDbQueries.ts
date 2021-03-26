import MongoDbQuery from "./MongoDbQuery";
import shouldUseRandomInitializationVector from "../../crypt/shouldUseRandomInitializationVector";
import shouldEncryptValue from "../../crypt/shouldEncryptValue";
import encrypt from "../../crypt/encrypt";

export default function convertFilterObjectToMongoDbQueries(filters: object): MongoDbQuery<any>[] {
  return Object.entries(filters).map(([fieldPathName, fieldValue]) => {
    const lastDotPosition = fieldPathName.lastIndexOf('.');


    if (lastDotPosition !== -1) {
      const fieldName = fieldPathName.slice(lastDotPosition + 1);
      const subEntityPath = fieldPathName.slice(0, lastDotPosition);

      let finalFieldValue;
      if (!shouldUseRandomInitializationVector(fieldName) && shouldEncryptValue(fieldName)) {
        finalFieldValue = encrypt(fieldValue, false);
      }

      return new MongoDbQuery({ [fieldName]: finalFieldValue }, subEntityPath);
    }

    let finalFieldValue;
    if (!shouldUseRandomInitializationVector(fieldPathName) && shouldEncryptValue(fieldPathName)) {
      finalFieldValue = encrypt(fieldValue, false);
    }

    return new MongoDbQuery({ [fieldPathName]: finalFieldValue });
  });
}
