const {exec} = require('child_process')
const path = require('path');

(initTheAction = async ()=>{

console.log('Executing script.js')

const outDirPath = path.join(__dirname, 'output')
const process = exec(`cd ${outDirPath} && npm install && npm run build`)

process.stdout.on('data', (data)=>{
    console.log(data.toString())
});


process.stdout.on('error', (data)=>{
    console.log('Error ->', data.toString())
});

process.on('close', ()=>{
    console.log('Code build done!')
})

})()