const { Interaction } = require("discord.js");
const heros = require('../data/hero.json');

module.exports = {
    name: 'interactionCreate',
    async execute(interaction, client) {
        if (interaction.isAutocomplete()) {
            const command = client.commands.get(interaction.commandName);

            if (!command) return;

            if (!command.autocomplete) {
                return console.error('No autocomplete handler was found');
            }

            try {
                console.log("run autocomplete")
                await command.autocomplete(interaction, client);
            } catch (error) {
                console.log(error);
                await interaction.reply({
                    content: 'There was an error while executing this command!',
                    ephemeral: true
                });
            }
        }

        if (interaction.isChatInputCommand()) {
            const command = client.commands.get(interaction.commandName);

            if (!command) return console.log('Command was not found');

            try {
                console.log("run execute")
                await command.execute(interaction, client);
            } catch (error) {
                console.error(error);
                await interaction.reply({
                    content: 'There was an error while executing this command!',
                    ephemeral: true,
                });
            }
        }

        if (interaction.isButton()) {
            console.log('test button click')
            // get the button's ID
            const buttonPress = client.buttons.get(interaction.customId);
            console.log(buttonPress)

            // run the code- this can be done however you want- I chose to do it this way.
            await buttonPress.execute(interaction);
        }

    },
};