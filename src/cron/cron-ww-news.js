import schedule from "node-schedule";
import { COLLECTION_WUWE_CHANNEL } from "../utils/constants.js";
import { retriveContent } from "../commands/Community/wuwa/cmd-news.js";

import logger from "../utils/log.js";
import ConnectionWuwa from "../db/databaseWuwa.js";
const log = logger(import.meta.filename);
const connection = new ConnectionWuwa();

const createScheduleWWNews = async (client) => {
  // run 1 time / 1 hour
  schedule.scheduleJob("0 */1 * * *", async () => {
    try {
      const channels = await connection
        .setCollection(COLLECTION_WUWE_CHANNEL)
        .setQuery({ enabled: true })
        .findByCondition();
      if (!channels || channels.length === 0) {
        log.info("channels not found!");
      } else {
        channels.forEach(async (c) => {
          const channel = client.channels.cache.get(c.id);
          await retriveContent(channel, channel.guild);
        });
      }
    } catch (e) {
      log.error(`Error execute schedule wuwa news: ${e}`);
    }
  });
};

export default createScheduleWWNews;
