const path = require('path');

module.exports = (client) => {
    client.handleEvents = async (eventFiles, pathFile) => {
        for (const file of eventFiles) {
            const filePath = path.join(pathFile, file);
            const event = require(filePath);
            if (event.once) {
                client.once(event.name, (...args) => event.execute(...args, client));
            } else {
                client.on(event.name, (...args) => event.execute(...args, client));
            }
        }
    };
}