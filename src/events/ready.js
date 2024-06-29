import { Events } from "discord.js";
import logger from "../utils/log.js";
let log = logger(import.meta.filename);

export default {
    name: Events.ClientReady,
    once: true,
    async execute(client) {
        log.info(`Ready! Logged in as ${client.user.tag}`);
    },
};