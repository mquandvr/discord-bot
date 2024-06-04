import fs from 'fs';

const writeData = (filePath, data) => {
    try {
        fs.stat(filePath, (err, stat) => {
            if (!err || err.code === 'ENOENT') {
                fs.writeFileSync(filePath, JSON.stringify(data));
            } else {
                console.error("Cant write file");
            }
        });
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
        if (data.attribute) {
            writeData('./src/data/attribute.json', data.attribute);
        }
        if (data.class) {
            writeData('./src/data/class.json', data.class);
        }
        if (data.hero) {
            writeData('./src/data/hero.json', data.hero);
        }
        if (data.tier) {
            writeData('./src/data/tier.json', data.tier);
        }
    } catch (e) {
        console.error(e);
    }
};

export { writeFile };