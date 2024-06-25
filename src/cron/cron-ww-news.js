import schedule from 'node-schedule';
import { COLLECTION_WUWE_CHANNEL } from '../utils/constants.js';
import { retriveContent } from '../commands/Community/wuwa/cmd-news.js';

import logger from "../utils/log.js";
import { Connections } from '../db/database.js';
let log = logger(import.meta.filename);
const connection = new Connections();

const createScheduleWWNews = async (client) => {
    // run 1 time / 1 hour
    schedule.scheduleJob('0 */1 * * *', async () => {
        const channels = await connection.connectWuwa(COLLECTION_WUWE_CHANNEL).findAll();
        if (!channels || channels.length === 0) {
            log.info("channels not found!");
        } else {
            channels.forEach(async c => {
                const channel = client.channels.cache.get(c.id);
                await retriveContent(channel);
            });
        }
    });
}

export default createScheduleWWNews;