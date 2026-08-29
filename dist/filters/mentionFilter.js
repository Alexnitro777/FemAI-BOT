"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitizeMentions = sanitizeMentions;
function sanitizeMentions(text) {
    return text
        .replace(/@everyone/g, '@\u200beveryone')
        .replace(/@here/g, '@\u200bhere')
        .replace(/<@&\d+>/g, '[роль]');
}
