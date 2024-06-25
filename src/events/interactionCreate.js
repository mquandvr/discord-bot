import logger from "../utils/log.js";
let log = logger(import.meta.filename);

export default {
    name: 'interactionCreate',
    async execute(interaction, client) {
        log.info("call interaction")
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
                await interaction.reply({
                    content: 'There was an error while executing this command!',
                    ephemeral: true
                });
            }
        }

        if (interaction.isChatInputCommand()) {
            const command = client.commands.get(interaction.commandName);

            if (!command) return log.info('Command was not found');

            try {
                log.info("run execute input command")
                await interaction.deferReply();
                await command.execute(interaction, client);
            } catch (error) {
                log.error(error);
                await interaction.reply({
                    content: 'There was an error while executing this command!',
                    ephemeral: true,
                });
            }
        }

        if (interaction.isButton()) {
            const command = client.commands.get(interaction.commandName);

            if (!command) return log.info('Command was not found');

            try {
                log.info("run execute button")
                await command.execute(interaction, client);
            } catch (error) {
                log.error(error);
                await interaction.reply({
                    content: 'There was an error while executing this command!',
                    ephemeral: true,
                });
            }
        }

    },
};