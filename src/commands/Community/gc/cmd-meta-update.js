import { SlashCommandBuilder } from '@discordjs/builders';
import { retrieveData } from '../../../utils/fetch.js';
import { init } from '../../../database.js';

const data = new SlashCommandBuilder()
    .setName('gc-meta-update')
    .setDescription('Grandchase Hero Update Build Meta Command!');

const execute = async (interaction, client) => {
    console.log("update meta");
    let url = process.env.url_meta;
    let data = await retrieveData(url);
    try {
        if (data && data.data) {
            await init(data.data);
            console.log('update success!');
            await interaction.editReply({ ephemeral: true, content: 'Updated meta success!', fetchReply: false });
        } else {
            console.log('data not found');
            await interaction.editReply({ ephemeral: true, content: 'Data not found!', fetchReply: false });
        }
    } catch (e) {
        console.log("Error update data: ", e);
        await interaction.editReply({ ephemeral: true, content: 'Update meta failed!', fetchReply: false });
    }

}

export { data, execute };