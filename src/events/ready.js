import logger from "../utils/log.js";
let log = logger(import.meta.filename);

export default {
    name: 'ready',
    once: true,
    async execute(client) {
        log.info(`Ready! Logged in as ${client.user.tag}`);
    },
};