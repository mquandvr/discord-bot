import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/v9";
import logger from "../utils/log.js";
import { getFilePaths } from "../utils/path.js";
const log = logger(import.meta.filename);

export const commandHandle = async (client) => {
  client.handleCommands = async (commandFoldersPath) => {
    client.commandArray = [];
    const commandFiles = getFilePaths(commandFoldersPath)
      .filter((file) => file.endsWith(".js"))
      .map((file) => file.replace("src", ".."));
    for (const filePath of commandFiles) {
      const command = await import(filePath);
      if ("data" in command && "execute" in command) {
        client.commands.set(command.data.name, command);
        client.commandArray.push(command.data.toJSON());
      } else {
        log.warn(
          `[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`,
        );
      }
    }

    const rest = new REST({
      version: "9",
    }).setToken(process.env.token);

    (async () => {
      try {
        log.info(
          `Started refreshing ${client.commandArray.length} application (/) commands.`,
        );

        const data = await rest.put(
          Routes.applicationCommands(process.env.client_id),
          {
            body: client.commandArray,
          },
        );

        log.info(
          `Successfully reloaded ${data.length} application (/) commands.`,
        );
      } catch (error) {
        log.error(`Error load command: ${error}`);
      }
    })();
  };
};
