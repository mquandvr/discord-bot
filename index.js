const { Client, GatewayIntentBits, Collection } = require(`discord.js`);
const fs = require('fs');
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

client.commands = new Collection();

require('dotenv').config();

var express = require('express');
var app = express();
//var path = require('path');

//app.use(express.static(__dirname)); // Current directory is root
app.use('/media', express.static(__dirname + '/assets'));

app.use('/update-meta', (req, res) => {
    // res.send('updateMeta');
        console.log("update Meta")
    const request = require('request');

    let url = process.env.url_meta;

    let options = {json: true};

    request(url, options, (error, resp, body) => {
        if (error) {
            console.log(error)
            return res.send('error');
        };

        if (!error && res.statusCode == 200) {
            // do something with JSON, using the 'body' variable
            console.log("body", body.data);
            fs.writeFileSync('./src/data/meta.json', JSON.stringify(body.data));
            res.send('done');
        };
    });

});

app.use('/healthz', (req, res) => {
    res.send('healthz');
});

app.use('/', (req, res) => {
    res.send('hello world');
});
//app.use(express.static('/assets'));

app.listen(80);
console.log('Listening on port 80');

const functions = fs.readdirSync("./src/functions").filter(file => file.endsWith(".js"));
const eventFiles = fs.readdirSync("./src/events").filter(file => file.endsWith(".js"));
const commandFolders = fs.readdirSync("./src/commands");

(async () => {
    for (file of functions) {
        require(`./src/functions/${file}`)(client);
    }
    client.handleEvents(eventFiles, "./src/events");
    client.handleCommands(commandFolders, "./src/commands");
    client.login(process.env.token)
})();
