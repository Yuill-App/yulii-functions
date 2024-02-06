import validate = require("validate.js");
import * as validators from "./validators";

(validate as any).Promise = global.Promise;

validate.extend(validate.validators, validators);

export default validate;
