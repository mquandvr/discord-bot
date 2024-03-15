const fs = require('fs');
const path = require('path');
const eventsPath = path.join(__dirname, 'events');
const functionsPath = path.join(__dirname, 'functions');
const commandFoldersPath = path.join(__dirname, 'commands');
const functions = fs.readdirSync(functionsPath).filter(file => file.endsWith(".js"));
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith(".js"));
const commandFolders = fs.readdirSync(commandFoldersPath);
const { Client, GatewayIntentBits, Collection } = require(`discord.js`);

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

client.commands = new Collection();

const login = () => {
    for (file of functions) {
        require(`${functionsPath}/${file}`)(client);
    }
    client.handleEvents(eventFiles, eventsPath);
    client.handleCommands(commandFolders, commandFoldersPath);
    client.login(process.env.token)
}

module.exports = { login };