import { REST } from "@discordjs/rest";
import { Routes } from 'discord-api-types/v9';
import fs from 'fs';

export const commandHandle = async (client) => {
    client.handleCommands = async (commandFolders, pathFile) => {
        client.commandArray = [];
        for (const folder of commandFolders) {
            const commandSubFolders = fs.readdirSync(`${pathFile}/${folder}`);
            for (const subFolder of commandSubFolders) {
                const commandFiles = fs.readdirSync(`${pathFile}/${folder}/${subFolder}`).filter(file => file.endsWith('.js'));
                for (const file of commandFiles) {
                    const filePath = `../commands/${folder}/${subFolder}/${file}`;
                    const command = await import(filePath);
                    client.commands.set(command.data.name, command);
                    client.commandArray.push(command.data.toJSON());
                }
            }
        }

        const rest = new REST({
            version: '9'
        }).setToken(process.env.token);

        (async () => {
            try {
                console.log(`Started refreshing ${client.commandArray.length} application (/) commands.`);

                const data = await rest.put(
                    Routes.applicationCommands(process.env.client_id), {
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