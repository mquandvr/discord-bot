import { DATABASE_NAME_WUWE } from "../utils/constants.js";
import Connections from "./database.js";

class ConnectionWuwa extends Connections {
  constructor() {
    super();
    this.database = this.client.db(DATABASE_NAME_WUWE);
  }
}

export default ConnectionWuwa;
