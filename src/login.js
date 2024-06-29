import fs from 'fs';
import { Client, GatewayIntentBits, Collection } from 'discord.js';
import { commandHandle } from './functions/handleCommands.js';
import { eventHandle } from './functions/handleEvents.js';

import logger from "./utils/log.js";
const log = logger(import.meta.filename);

const eventsPath = './src/events';
//const functionsPath = './src/functions';
const commandFoldersPath = './src/commands';
//const functions = fs.readdirSync(functionsPath).filter(file => file.endsWith(".js"));
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith(".js"));
const commandFolders = fs.readdirSync(commandFoldersPath);
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

client.commands = new Collection();

const login = async () => {
    try {
        log.info('logging...');
        await commandHandle(client);
        await eventHandle(client);
        client.handleEvents(eventFiles);
        client.handleCommands(commandFolders, commandFoldersPath);
        await client.login(process.env.token);
    } catch (e) {
        log.error(e);
    }
};

export { login, client };