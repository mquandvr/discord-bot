import { getFilePaths } from "../utils/path.js";

export const eventHandle = async (client) => {
    client.handleEvents = async (eventsPath) => {
        const eventFiles = getFilePaths(eventsPath)
                            .filter(file => file.endsWith('.js'))
                            .map(file => file.replace('src', '..'));
        for (const filePath of eventFiles) {
            // const filePath = path.join(pathFile, file);
            // const filePath = `../events/${file}`;
            const eventFile = await import(filePath);
            const event = eventFile.default;
            if (event.once) {
                client.once(event.name, (...args) => event.execute(...args, client));
            } else {
                client.on(event.name, (...args) => event.execute(...args, client));
            }
        }
    };
};