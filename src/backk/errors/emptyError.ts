import { backkErrorSymbol } from "../types/BackkError";

const emptyError = {
    [backkErrorSymbol]: true,
    statusCode: 500,
    errorMessage: 'Empty error'
}

export default emptyError;
