const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const mime = require('mime-types')
const {S3Client, PutObjectCommand} = require('@aws-sdk/client-s3')


const s3Client = new S3Client({
    region: '',
    credentials: {
        accessKeyId: '',
        secretAccessKey: ''
    }
})

const PROJECT_ID = process.env.PROJECT_ID;


(async () => {
    console.log('Executing script.js');
    
    const outDirPath = path.join(__dirname, 'output');
    
    try {
        await new Promise((resolve, reject) => {
            const process = exec(`cd ${outDirPath} && npm install && npm run build`);
            
            process.stdout.on('data', (data) => {
                console.log(data.toString());
            });
            
            process.stderr.on('data', (data) => {
                console.error(data.toString());
            });
            
            process.on('close', (code) => {
                if (code === 0) {
                    console.log('Code build done!');
                    resolve();
                } else {
                    reject(new Error(`Build process exited with code ${code}`));
                }
            });
        });
        
        const distFolderPath = path.join(__dirname, 'output', 'dist');
        const distFolderContents = fs.readdirSync(distFolderPath, { recursive: true });

        for(const filePath of distFolderContents) {
            if(fs.lstatSync(filePath).isDirectory) {
                continue;
            }
            const putCommandForS3 = new PutObjectCommand({
                Bucket: '',
                Key: `__outputs/${PROJECT_ID}/${filePath}`,
                Body: fs.createReadStream(filePath),
                ContentType:mime.lookup(filePath)
            });

            try {
                await s3Client.send(putCommandForS3);
                console.log(`Uploaded ${filePath} to S3`);
            } catch (error) {
                console.error(`Error uploading ${filePath} to S3:`, error);
            }
        }
    } catch (error) {
        console.error('Error:', error.message);
    }
})();
