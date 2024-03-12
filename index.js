const { Client, GatewayIntentBits, EmbedBuilder, PermissionsBitField, Permissions, MessageManager, Embed, Collection } = require(`discord.js`);
const fs = require('fs');
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

client.commands = new Collection();

require('dotenv').config();

var express = require('express');
var app = express();
//var path = require('path');

//app.use(express.static(__dirname)); // Current directory is root
app.use('/media', express.static(__dirname + '/assets'));

app.use('/healthz', (req, res) => {
    res.sendStatus(200).json("healthz");;
});

app.use('/', (req, res) => {
    res.sendStatus(200).json("hello world");;
});

app.use('/login', (req, res) => {
    const functions = fs.readdirSync("./src/functions").filter(file => file.endsWith(".js"));
    const eventFiles = fs.readdirSync("./src/events").filter(file => file.endsWith(".js"));
    const commandFolders = fs.readdirSync("./src/commands");
    
    (async () => {
        for (file of functions) {
            require(`./src/functions/${file}`)(client);
        }
        client.handleEvents(eventFiles, "./src/events");
        client.handleCommands(commandFolders, "./src/commands");
        await client.login(process.env.token)
    })();
});

//app.use(express.static('/assets'));

app.listen(80);
console.log('Listening on port 80');