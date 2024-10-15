const path = require("path");

const IOhandler = require("./IOhandler");
const zipFilePath = path.join(__dirname, "myfile.zip");
const pathUnzipped = path.join(__dirname, "unzipped");
const pathProcessed = path.join(__dirname, "grayscaled");

(async () => {
    try {
      // Unzip the file.
      await IOhandler.unzip(zipFilePath, pathUnzipped);
  
      // Read all PNG files.
      const images = await IOhandler.readDir(pathUnzipped);
  
      // Apply grayscale filter to each image.
      for (const image of images) {
        const outputImagePath = path.join(pathProcessed, path.basename(image));
        await IOhandler.grayScale(image, outputImagePath);
      }
  
      console.log('Grayscale transformation complete for all images.');
    } catch (error) {
      console.error('Error:', error);
    }
  })();