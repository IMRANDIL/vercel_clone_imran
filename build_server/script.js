const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

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
            
        }
    } catch (error) {
        console.error('Error:', error.message);
    }
})();
