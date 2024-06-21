import createScheduleWWNews from "./cron-ww-news.js";

const jobs = (client) => {
    createScheduleWWNews(client);
    console.log("enabled jobs");
}
export default jobs;