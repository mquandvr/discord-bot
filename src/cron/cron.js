import createScheduleWWNews from "./cron-ww-news.js";

const jobs = (client) => {
    createScheduleWWNews(client);
}
export default jobs;