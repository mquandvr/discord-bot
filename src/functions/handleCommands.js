import { REST } from "@discordjs/rest";
import { Routes } from 'discord-api-types/v9';
import fs from 'fs';
import logger from "../utils/log.js";
let log = logger(import.meta.filename);

export const commandHandle = async (client) => {
    client.handleCommands = async (commandFolders, pathFile) => {
        client.commandArray = [];
        for (const folder of commandFolders) {
            const commandSubFolders = fs.readdirSync(`${pathFile}/${folder}`);
            for (const subFolder of commandSubFolders) {
                let path = `${folder}/${subFolder}`;
                if (subFolder.endsWith('.js')) {
                    path = `${folder}`;
                }
                const commandFiles = fs.readdirSync(`${pathFile}/${path}`).filter(file => file.endsWith('.js'));
                for (const file of commandFiles) {
                    const filePath = `../commands/${path}/${file}`;
                    const command = await import(filePath);
                    if ('data' in command && 'execute' in command) {
                        client.commands.set(command.data.name, command);
                        client.commandArray.push(command.data.toJSON());
                    } else {
                        log.warn(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
                    }
                }
            }
        }

        const rest = new REST({
            version: '9'
        }).setToken(process.env.token);

        (async () => {
            try {
                log.info(`Started refreshing ${client.commandArray.length} application (/) commands.`);

                const data = await rest.put(
                    Routes.applicationCommands(process.env.client_id), {
                    body: client.commandArray
                },
                );

                log.info(`Successfully reloaded ${data.length} application (/) commands.`);
            } catch (error) {
                log.error(error);
            }
        })();
    };
};