const fs = require("fs");
const PNG = require("pngjs").PNG;
const path = require("path");
const yauzl = require("yauzl-promise");
const { pipeline } = require("stream/promises");

/**
 * Description: decompress file from given pathIn, write to given pathOut
 *
 * @param {string} pathIn
 * @param {string} pathOut
 * @return {promise}
 */
const unzip = async (pathIn, pathOut) => {
  const zip = await yauzl.open(pathIn);
  try {
    for await (const entry of zip) {
      const filePath = path.join(pathOut, entry.filename);
      if (entry.filename.endsWith("/")) {
        await fs.promises.mkdir(filePath, { recursive: true });
      } else {
        const readStream = await entry.openReadStream();
        const writeStream = fs.createWriteStream(filePath);
        await pipeline(readStream, writeStream);
      }
    }
  } finally {
    await zip.close();
    console.log("File extraction done.");
  }
};

/**
 * Description: read all the png files from given directory and return Promise containing array of each png file path
 *
 * @param {string} path
 * @return {promise}
 */
const readDir = (dir) => {
  return fs.promises.readdir(dir).then((files) => {
    return files
      .filter((file) => path.extname(file) === ".png")
      .map((file) => path.join(dir, file));
  });
};

/**
 * Description: Read in png file by given pathIn,
 * convert to grayscale and write to given pathOut
 *
 * @param {string} filePath
 * @param {string} pathProcessed
 * @return {promise}
 */
const grayScale = (pathIn, pathOut) => {
  return new Promise((resolve, reject) => {
    const data = fs.createReadStream(pathIn).pipe(new PNG());
    data.on("parsed", function () {
      for (let i = 0; i < this.data.length; i += 4) {
        const avg = (this.data[i] + this.data[i + 1] + this.data[i + 2]) / 3;
        this.data[i] = this.data[i + 1] = this.data[i + 2] = avg; // Set R, G, B to the average.
      }
      this.pack()
        .pipe(fs.createWriteStream(pathOut))
        .on("finish", resolve)
        .on("error", reject);
    });
    data.on("error", reject);
  });
};

const IOhandler = {
  unzip,
  readDir,
  grayScale,
};

fs.promises
  .mkdir("unzipped", { recursive: true })
  .then(() => IOhandler.unzip("myfile.zip", "unzipped"))
  .then(() => IOhandler.readDir("unzipped"))
  .then((imgs) => {
    const promises = imgs.map((img) => {
      const outputImagePath = path.join("grayscaled", path.basename(img));
      return IOhandler.grayScale(img, outputImagePath);
    });
    return Promise.all(promises);
  })
  .then(() => console.log("Grayscale transformation complete for all images."))
  .catch((err) => console.log("Error:", err));

module.exports = {
  unzip,
  readDir,
  grayScale,
};
