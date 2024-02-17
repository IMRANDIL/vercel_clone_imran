const { exec } = require("child_process");
const path = require("path");
const fs = require("fs");
const mime = require("mime-types");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");

const Redis = require('ioredis');
const PROJECT_ID = process.env.PROJECT_ID;

const publisher = new Redis(process.env.redisURI)

const publishLog = (log) => {
  publisher.publish(`logs:${PROJECT_ID}`, JSON.stringify({log}))
}


const s3Client = new S3Client({
  region: process.env.region,
  credentials: {
    accessKeyId: process.env.accessKeyId,
    secretAccessKey: process.env.secretAccessKey,
  },
});



(async () => {
    console.log("Executing script.js");
  publishLog('Build started...')
    const outDirPath = path.join(__dirname, "output");
  
    try {
      await new Promise((resolve, reject) => {
        const process = exec(`cd ${outDirPath} && npm install && npm run build`);
  
        process.stdout.on("data", (data) => {
          console.log(data.toString());
          publishLog(data.toString())
        });
  
        process.stderr.on("data", (data) => {
          console.error(data.toString());
          publishLog(`error:${data.toString()}`)
        });
  
        process.on("close", async (code) => {
          publishLog('Build Completed...')
            const distFolderPath = path.join(__dirname, "output", "dist");
            const distFolderContents = fs.readdirSync(distFolderPath, {
              recursive: true,
            });
            
            publishLog('Starting to upload...')
            for (const file of distFolderContents) {
              const filePath = path.join(distFolderPath, file);
              if (fs.lstatSync(filePath).isDirectory()) {
                continue;
              }
              console.log("Uploading", filePath);
              publishLog(`Uploading ${file}`)
              const putCommandForS3 = new PutObjectCommand({
                Bucket: "vercel-clone-imran",
                Key: `__outputs/${PROJECT_ID}/${file}`,
                Body: fs.createReadStream(filePath),
                ContentType: mime.lookup(filePath),
              });
  
              try {
                await s3Client.send(putCommandForS3);
                console.log(`Uploaded ${filePath} to S3`);
                publishLog(`Uploaded ${filePath}`)
              } catch (error) {
                console.error(`Error uploading ${filePath} to S3:`, error);
                publishLog(`error uploading: ${filePath}`)
                reject(error);
              }
            }
            publishLog(`Done`)
            console.log('Done...');
            resolve();
            process.exit(0)
        });

      });
    } catch (error) {
      console.error("Error:", error.message);
    }
  })();
  