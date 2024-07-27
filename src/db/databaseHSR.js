import { DATABASE_NAME_HSR } from "../utils/constants.js";
import Connections from "./database.js";

class ConnectionHSR extends Connections {
  constructor() {
    super();
    this.setDataBase(this.getClient().db(DATABASE_NAME_HSR));
  }
}

export default ConnectionHSR;
