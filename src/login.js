import fs from 'fs';
import { Client, GatewayIntentBits, Collection } from 'discord.js';
import { commandHandle } from './functions/handleCommands.js';
import { eventHandle } from './functions/handleEvents.js';

const eventsPath = './src/events';
//const functionsPath = './src/functions';
const commandFoldersPath = './src/commands';
//const functions = fs.readdirSync(functionsPath).filter(file => file.endsWith(".js"));
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith(".js"));
const commandFolders = fs.readdirSync(commandFoldersPath);
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

client.commands = new Collection();

const login = async () => {
    await commandHandle(client);
    await eventHandle(client);
    client.handleEvents(eventFiles);
    client.handleCommands(commandFolders, commandFoldersPath);
    client.login(process.env.token)
}

export { login };