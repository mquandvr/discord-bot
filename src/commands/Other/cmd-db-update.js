import { SlashCommandBuilder } from '@discordjs/builders';
import { retrieveData } from '../../utils/fetch.js';
import { init } from '../../database.js';
import logger from "../../utils/log.js";
let log = logger(import.meta.filename);

const data = new SlashCommandBuilder()
    .setName('db-update')
    .setDescription('Update Database Command!');

const execute = async (interaction) => {
    log.info("update meta");
    let url = process.env.url_meta;
    let data = await retrieveData(url);
    try {
        if (data && data.data) {
            await init(data.data);
            log.info('update success!');
            await interaction.editReply({ ephemeral: true, content: 'Updated meta success!', fetchReply: false });
        } else {
            log.warn('data not found');
            await interaction.editReply({ ephemeral: true, content: 'Data not found!', fetchReply: false });
        }
    } catch (e) {
        log.error("Error update data: ", e);
    }

}

export { data, execute };