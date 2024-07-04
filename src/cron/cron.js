import createScheduleWWNews from "./cron-ww-news.js";

import logger from "../utils/log.js";
let log = logger(import.meta.filename);

const jobs = async (client) => {
  await createScheduleWWNews(client);
  log.info("enabled jobs [%s]", "createScheduleWWNews");
};
export default jobs;
