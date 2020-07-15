/// <reference types="@altv/types-server" />
import * as alt from 'alt-server';
import Discord from 'discord.js';

const discordClient = new Discord.Client();
const config = {
    botTokenSecret: process.env['BOT_SECRET'],
    serverId: process.env['SERVER_ID'],
    clientId: process.env['CLIENT_ID'],
    roleWhitelistId: process.env['ROLE_WHITELIST_ID'],
};

let whitelist = [];
let interval;

// Events
discordClient.on('ready', handleReady);
discordClient.on('error', handleError);
discordClient.on('rateLimit', handleRateLimit);
discordClient.on('userUpdate', handleUserUpdate);

function handleReady() {
    console.log(`[Whitelist] Discord Bot has Authenticated.`);

    if (!config.serverID || !config.WlRoleID) {
        console.error(`Configuration is missing. Please setup your .env file.`);
        return;
    }

    interval = alt.setInterval(refreshWhitelist, 60000);
}

function handleError(err) {
    console.log(err);
}

function handleRateLimit(err) {
    console.error(`Discord Bot has been Rate Limited. Google 'Rate Limits for Discord'`);
    console.log(err);
}

/**
 * Automatically update the discord white list.
 * @param  {Discord.User} user
 */
async function handleUserUpdate(user) {
    if (!user) {
        return;
    }

    const server = discordClient.guilds.cache.get(config.serverId);
    const member = await server.members.fetch(user.id);

    if (!member) {
        return;
    }

    const hasRole = member.roles.cache.has(config.roleWhitelistId);
    const index = whitelist.findIndex(id => id === user.id);

    if (!hasRole) {
        if (index <= -1) {
            return;
        }

        whitelist.splice(index, 1);
        console.log(`[Whitelist] ${member.displayName} was removed from the whitelist.`);
        return;
    }

    if (index >= 0) {
        return;
    }

    whitelist.push(user.id);
    logAsSuccess(`${member.displayName} was added to the whitelist.`);
}

/**
 * this function get all the users that have the role
 * 'whitelist' and put them in the array whitelist
 * @returns {void}
 */
function refreshWhitelist() {
    logAsDiscord(`Refreshing Whitelist`);

    whitelist = [];

    const server = discordClient.guilds.cache.get(process.env[config.botClientId]);
    const members = server.roles.cache.get(process.env[config.roleWhitelistId]).members.array();

    if (members.length <= 0) {
        logAsError(`No members are whitelisted at this time.`);
        return;
    }

    for (let i = 0; i < members.length; i++) {
        const member = members[i];
        if (!member) {
            continue;
        }

        if (!member.user) {
            continue;
        }

        whitelist.push(member.user.id);
    }

    logAsSuccess(`Refreshed Whitelist. Whitelisted Members: ${members.length}`);
}

discordClient.login(process.env[config.botTokenSecret]);
