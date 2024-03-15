const { SlashCommandBuilder } = require('@discordjs/builders');
const { retrieveData } = require('../../utils/fetch');
const { writeFile } = require('../../utils/files');

const data = new SlashCommandBuilder()
    .setName('gc-meta-update')
    .setDescription('Grandchase Hero Update Build Meta Command!');

const execute = async (interaction, client) => {
    console.log("update meta");
    let url = process.env.url_meta;
    let data = await retrieveData(url);
    try {
        if (data && data.data) {
            writeFile(data.data);
            console.log('update success!');
            await interaction.reply({ ephemeral: true, content: 'Updated meta success!', fetchReply: false });
        } else {
            console.log('data not found');
            await interaction.reply({ ephemeral: true, content: 'Data not found!', fetchReply: false });
        }
    } catch (e) {
        await interaction.reply({ ephemeral: true, content: 'Update meta failed!', fetchReply: false });
    }

}
module.exports = { data, execute };