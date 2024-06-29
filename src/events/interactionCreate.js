import { Events } from "discord.js";
import logger from "../utils/log.js";
let log = logger(import.meta.filename);

export default {
    name: Events.InteractionCreate,
    async execute(interaction, client) {
        log.info("call interaction");
        if (interaction.isAutocomplete()) {
            const command = client.commands.get(interaction.commandName);

            if (!command) return;

            if (!command.autocomplete) {
                return log.error('No autocomplete handler was found');
            }

            try {
                log.info("run autocomplete");
                await command.autocomplete(interaction, client);
            } catch (error) {
                log.error(error);
                await interaction.reply({content: 'There was an error while executing this command!', ephemeral: true });
            }
        }

        if (interaction.isChatInputCommand()) {
            const command = client.commands.get(interaction.commandName);

            if (!command) return log.info('Command was not found');

            if (command.devOnly) {
                log.info(`User ${interaction.member.id} use command for developer`);
                const developers = process.env.developers.split(',');
                if (!developers.includes(interaction.member.id)) {
                    await interaction.editReply({ ephemeral: true, content: 'This command is for developers only!' });
                    log.warn(`User ${interaction.member.id} is not developer`);
                    return;
                }
            }

            try {
                log.info("run execute input command");
                await interaction.deferReply();
                const validate = await command.validate(interaction, client);
                if (validate) {
                    await command.execute(interaction, client);
                }
            } catch (error) {
                log.error(error);
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
                } else {
                    await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
                }
            }
        }

        // if (interaction.isButton()) {
        //     const command = client.commands.get(interaction.commandName);

        //     if (!command) return log.info('Command was not found');

        //     try {
        //         log.info("run execute button")
        //         await command.execute(interaction, client);
        //     } catch (error) {
        //         log.error(error);
        //         await interaction.reply({
        //             content: 'There was an error while executing this command!',
        //             ephemeral: true,
        //         });
        //     }
        // }

    },
};