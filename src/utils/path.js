import path from "path";
import fs from "fs";

function getFileName(url) {
  const fileName = path.basename(url);
  const relativePath = path.relative(path.resolve("src"), url);
  return relativePath || fileName;
}

function getFilePaths(directory) {
  let filePaths = [];

  if (!directory) return filePaths;

  const files = fs.readdirSync(directory, { withFileTypes: true });

  for (const file of files) {
    const filePath = path.join(directory, file.name).replace(/\\/g, "/");

    if (file.isFile()) {
      filePaths.push(filePath);
    }

    if (file.isDirectory()) {
      filePaths = [...filePaths, ...getFilePaths(filePath)];
    }
  }

  return filePaths;
}

export { getFileName, getFilePaths };
