
/**
 * @param {Error} err
 * @returns {string}
 * @description Get the line from the error stack
 * @example
 * const { getLineFromError } = require("./src/utils/functions");
 *  
 * const err = new Error("Something went wrong");
 * const line = getLineFromError(err);
 * console.log(line); // 1
**/
const getLineFromError = (err = { stack: "" }) => {
    const { stack } = err;
    const lines = stack.split("\n");
    return lines[1] ? lines[1].trim() : "No line";
}

module.exports = { getLineFromError };