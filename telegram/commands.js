"use strict";
const process = require('process');
const Telegraf = require('telegraf');


const ADMINS = process.env.ADMINS || "151262755"


function commandHandlers(bot) {
    bot.start((ctx) => {
        console.log(`Started a chat with @${ctx.from.username}`);
        if (isAuthorized(ctx.from.id)) {
            ctx.reply('Welcome!');
        } else {
            ctx.reply('You are not authorized to use this bot!');
        }
    });
    bot.command('status', (ctx) => {
        console.log(`Received command from @${ctx.from.username}`);
        if (isAuthorized(ctx.from.id)) {
            ctx.reply('Authorized');
        } else {
            ctx.reply('Unauthorized');
        }
    });
}


function isAuthorized(userId) {
    allowedIds = ADMINS.split('|');
    return allowedIds.includes(userId);
}


module.exports = commandHandlers;