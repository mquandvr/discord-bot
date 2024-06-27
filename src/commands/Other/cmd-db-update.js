import { SlashCommandBuilder } from '@discordjs/builders';
import { retrieveData } from '../../utils/fetch.js';
import logger from "../../utils/log.js";
import { COLLECTION_GC_ATTRIBUTE, COLLECTION_GC_CLASS, COLLECTION_GC_HERO, COLLECTION_GC_IMAGE, COLLECTION_GC_META, COLLECTION_GC_TIER, COLLECTION_WUWE_ATTRIBUTE, COLLECTION_WUWE_HERO, COLLECTION_WUWE_IMAGE, COLLECTION_WUWE_NEWS, COLLECTION_WUWE_WEAPON } from '../../utils/constants.js';
import ConnectionGC from '../../db/databaseGC.js';
import ConnectionWuwa from '../../db/databaseWuwa.js';
const log = logger(import.meta.filename);

const connectionGC = new ConnectionGC();
const connectionWuwa = new ConnectionWuwa();


const data = new SlashCommandBuilder()
    .setName('db-update')
    .setDescription('Update Database Command!');

const execute = async (interaction) => {
    log.info("update meta");
    const url = process.env.url_meta;
    const data = await retrieveData(url);
    try {
        if (data && data.data) {
            await updateDB(data.data);
            log.info('update success!');
            await interaction.editReply({ ephemeral: true, content: 'Updated meta success!' });
        } else {
            log.warn('data not found');
            await interaction.editReply({ ephemeral: true, content: 'Data not found!' });
        }
    } catch (e) {
        log.error(`Error execute data: ${e}`);
    }

}

async function updateDB(data) {
    try {
        await updateGCData(data);
        await updateWuWaData(data);
    } catch (e) {
        log.error(`Error update DB: ${e}`);
    }
}

async function updateGCData(data) {
    try {
        await connectionGC.setCollection(COLLECTION_GC_META).setData(data.gc.meta).dropAndInsert();
        await connectionGC.setCollection(COLLECTION_GC_ATTRIBUTE).setData(data.gc.attribute).dropAndInsert();
        await connectionGC.setCollection(COLLECTION_GC_CLASS).setData(data.gc.class).dropAndInsert();
        await connectionGC.setCollection(COLLECTION_GC_HERO).setData(data.gc.hero).dropAndInsert();
        await connectionGC.setCollection(COLLECTION_GC_TIER).setData(data.gc.tier).dropAndInsert();
        // await connectionGC.setCollection(COLLECTION_GC_IMAGE).setData(data.gc.image).dropAndInsert();
    } catch (e) {
        log.error(`Error update DB GC: ${e}`);
    }
}

async function updateWuWaData(data) {
    try {
        // await dropCollection(database, COLLECTION_WUWE_NEWS);
        const dataWuwe = await connectionWuwa.setCollection(COLLECTION_WUWE_NEWS).findAll();
        if (!dataWuwe || dataWuwe.length === 0) {
            await connectionWuwa.setData({ articleId: 0 }).setCollection(COLLECTION_WUWE_NEWS).insertOneData();
        }

        await connectionWuwa.setCollection(COLLECTION_WUWE_HERO).setData(data.ww.hero).dropAndInsert();
        await connectionWuwa.setCollection(COLLECTION_WUWE_ATTRIBUTE).setData(data.ww.attribute).dropAndInsert();
        await connectionWuwa.setCollection(COLLECTION_WUWE_WEAPON).setData(data.ww.weapon).dropAndInsert();
        await connectionWuwa.setCollection(COLLECTION_WUWE_IMAGE).setData(data.ww.image).dropAndInsert();
    } catch (e) {
        log.error(`Error update DB Wuwa: ${e}`);
    }
}


export { data, execute };