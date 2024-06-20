import schedule from 'node-schedule';
import { findAll } from '../database.js';
import { COLLECTION_WUWE_CHANNEL, DATABASE_NAME_WUWE } from '../utils/constants.js';
import { retriveContent } from '../commands/Community/wuwa/cmd-news.js';

const createScheduleWWNews = async (client) => {
    // run 1 time / 1 hour
    schedule.scheduleJob('0 */1 * * *', async () => {
        console.log("schedule running");
        const channels = await findAll(COLLECTION_WUWE_CHANNEL, DATABASE_NAME_WUWE);
        if (!channels || channels.length === 0) {
            console.log("channels not found!");
        } else {
            channels.forEach(async c => {
                const channel = client.channels.cache.get(c.id);
                await retriveContent(channel);
            });
        }
    });
    
}

export default createScheduleWWNews;