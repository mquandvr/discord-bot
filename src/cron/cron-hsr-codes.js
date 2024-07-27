import schedule from "node-schedule";
import { doRedeemCode } from "../commands/Community/hsr/cmd-hsr-redeem.js";

import logger from "../utils/log.js";
const log = logger(import.meta.filename);

const createScheduleCheckCodeRedeemHsr = async (client) => {
  log.info("jobs createScheduleCheckCodeRedeemHsr actived");
  // run 1 time / 1 hour
  schedule.scheduleJob("0 */1 * * *", async () => {
    try {
      await doRedeemCode(client, true);
    } catch (e) {
      log.error(`Error execute schedule hsr codes: ${e}`);
    }
  });
};

export default createScheduleCheckCodeRedeemHsr;
