import { Client, GatewayIntentBits, Collection } from "discord.js";
import { commandHandle } from "./functions/handleCommands.js";
import { eventHandle } from "./functions/handleEvents.js";

import logger from "./utils/log.js";
const log = logger(import.meta.filename);

const eventsPath = "./src/events";
const commandFoldersPath = "./src/commands";
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.commands = new Collection();

const login = async () => {
  try {
    log.info("logging...");
    await commandHandle(client);
    await eventHandle(client);
    client.handleEvents(eventsPath);
    client.handleCommands(commandFoldersPath);
    await client.login(process.env.token);
  } catch (e) {
    log.error(`Error login: ${e}`);
  }
};

export { login, client };
