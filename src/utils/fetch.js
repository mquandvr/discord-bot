import axios from 'axios';

const retrieveData = async (url) => {
    try {
        const response = await axios.get(url);
        return response.data;
    } catch (e) {
        console.error(e);
    }
}

export { retrieveData };