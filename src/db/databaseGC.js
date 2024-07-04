import { DATABASE_NAME_GRANDCHASE } from "../utils/constants.js";
import Connections from "./database.js";

class ConnectionGC extends Connections {
  constructor() {
    super();
    this.database = this.client.db(DATABASE_NAME_GRANDCHASE);
  }
}

export default ConnectionGC;
