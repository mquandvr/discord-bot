const fs = require('fs');

const writeData = (filePath, data) => {
    try {
        fs.writeFileSync(filePath, JSON.stringify(data));
    } catch (e) {
        console.error(e);
    }
};

module.exports = { writeData }