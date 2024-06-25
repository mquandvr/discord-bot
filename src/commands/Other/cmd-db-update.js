import { SlashCommandBuilder } from '@discordjs/builders';
import { retrieveData } from '../../utils/fetch.js';
import logger from "../../utils/log.js";
import { Connections } from '../../db/database.js';
import { COLLECTION_GC_ATTRIBUTE, COLLECTION_GC_CLASS, COLLECTION_GC_HERO, COLLECTION_GC_IMAGE, COLLECTION_GC_META, COLLECTION_GC_TIER, COLLECTION_WUWE_ATTRIBUTE, COLLECTION_WUWE_HERO, COLLECTION_WUWE_IMAGE, COLLECTION_WUWE_NEWS, COLLECTION_WUWE_WEAPON } from '../../utils/constants.js';
let log = logger(import.meta.filename);

const connection = new Connections();

const data = new SlashCommandBuilder()
    .setName('db-update')
    .setDescription('Update Database Command!');

const execute = async (interaction) => {
    log.info("update meta");
    let url = process.env.url_meta;
    let data = await retrieveData(url);
    try {
        if (data && data.data) {
            await updateDB(data.data);
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

async function updateDB(data) {
    try {
        await updateGCData(data);
        await updateWuWaData(data);
    } catch (e) {
        log.error(e);
    }
}

async function updateGCData(data) {
    try {
        await connection.connectGC(COLLECTION_GC_META).setData(data.gc.meta).dropAndInsert();
        await connection.connectGC(COLLECTION_GC_ATTRIBUTE).setData(data.gc.attribute).dropAndInsert();
        await connection.connectGC(COLLECTION_GC_CLASS).setData(data.gc.class).dropAndInsert();
        await connection.connectGC(COLLECTION_GC_HERO).setData(data.gc.hero).dropAndInsert();
        await connection.connectGC(COLLECTION_GC_TIER).setData(data.gc.tier).dropAndInsert();
        await connection.connectGC(COLLECTION_GC_IMAGE).setData(data.gc.image).dropAndInsert();
    } catch (e) {
        log.error(e);
    }
}

async function updateWuWaData(data) {
    try {
        // await dropCollection(database, COLLECTION_WUWE_NEWS);
        const dataWuwe = await connection.connectWuwa(COLLECTION_WUWE_NEWS).findAll();
        if (!dataWuwe || dataWuwe.length === 0) {
            await connection.setData({ articleId: 0 }).connectWuwa(COLLECTION_WUWE_NEWS).insertOneData();
        }

        await connection.connectWuwa(COLLECTION_WUWE_HERO).setData(data.ww.hero).dropAndInsert();
        await connection.connectWuwa(COLLECTION_WUWE_ATTRIBUTE).setData(data.ww.attribute).dropAndInsert();
        await connection.connectWuwa(COLLECTION_WUWE_WEAPON).setData(data.ww.weapon).dropAndInsert();
        await connection.connectWuwa(COLLECTION_WUWE_IMAGE).setData(data.ww.image).dropAndInsert();
    } catch (e) {
        log.error(e);
    }
}


export { data, execute };