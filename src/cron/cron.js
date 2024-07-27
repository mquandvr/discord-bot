import createScheduleWWNews from "./cron-ww-news.js";
import createScheduleCheckCodeRedeemHsr from "./cron-hsr-codes.js";

import logger from "../utils/log.js";
let log = logger(import.meta.filename);

const jobs = async (client) => {
  await createScheduleWWNews(client);
  await createScheduleCheckCodeRedeemHsr(client);
};
export default jobs;
