import path from "path";

function getFileName(url) {
    const fileName = path.basename(url);
    const relativePath = path.relative(path.resolve("src"), url);
    return relativePath || fileName;
}

export { getFileName };