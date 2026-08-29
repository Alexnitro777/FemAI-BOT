"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
require("dotenv/config");
function required(name) {
    const value = process.env[name];
    if (!value)
        throw new Error(`Переменная окружения ${name} не задана`);
    return value;
}
exports.config = {
    token: required('DISCORD_TOKEN'),
    googleKey: required('GOOGLE_API_KEY'),
    modelName: process.env.MODEL_NAME ?? 'gemma-3-27b-it',
};
