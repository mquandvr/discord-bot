import { REST } from "@discordjs/rest";
import { Routes } from 'discord-api-types/v9';
import fs from 'fs';

const clientId = '1215905903287468072';

export const commandHandle = async (client) => {
    client.handleCommands = async (commandFolders, pathFile) => {
        client.commandArray = [];
        for (const folder of commandFolders) {
            const commandFiles = fs.readdirSync(`${pathFile}/${folder}`).filter(file => file.endsWith('.js'));
            for (const file of commandFiles) {
                const filePath = `../commands/${folder}/${file}`;
                const command = await import(filePath);
                client.commands.set(command.data.name, command);
                client.commandArray.push(command.data.toJSON());
            }
        }

        const rest = new REST({
            version: '9'
        }).setToken(process.env.token);

        (async () => {
            try {
                console.log(`Started refreshing ${client.commandArray.length} application (/) commands.`);

                const data = await rest.put(
                    Routes.applicationCommands(clientId), {
                        body: client.commandArray
                    },
                );

                console.log(`Successfully reloaded ${data.length} application (/) commands.`);
            } catch (error) {
                console.error(error);
            }
        })();
    };
};