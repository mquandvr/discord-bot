import axios from 'axios';
import logger from "./log.js";
const log = logger(import.meta.filename);

const retrieveData = async (url) => {
    try {
        const response = await axios.get(url);
        return response.data;
    } catch (e) {
        log.error(`error fetch data: ${e}`);
    }
};

export { retrieveData };