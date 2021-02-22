import { errorResponseSymbol } from "../types/BackkError";

const emptyError = {
    [errorResponseSymbol]: true as true,
    statusCode: 500,
    errorMessage: 'Empty error'
}

export default emptyError;
