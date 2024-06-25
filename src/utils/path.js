import path from "path";

function getFileName(url) {
    const fileName = path.basename(url);
    const relativePath = path.relative(url, fileName);
    return relativePath || fileName;
}

export { getFileName };