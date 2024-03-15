const fs = require('fs');

const writeData = (filePath, data) => {
    try {
        fs.writeFileSync(filePath, JSON.stringify(data));
    } catch (e) {
        console.error(e);
    }
};

const writeFile = (data) => {
    try {
        console.log("data write", data);
        if (data.meta) {
            writeData('./src/data/meta.json', data.meta);
        }
        if (data.data.attribute) {
            writeData('./src/data/attribute.json', data.attribute);
        }
        if (data.data.class) {
            writeData('./src/data/class.json', data.class);
        }
    } catch (e) {
        console.error(e);
    }
};

module.exports = { writeFile }