import { errorResponseSymbol } from "../types/ErrorResponse";

const emptyError = {
    [errorResponseSymbol]: true as true,
    statusCode: 500,
    errorMessage: 'Empty error'
}

export default emptyError;
