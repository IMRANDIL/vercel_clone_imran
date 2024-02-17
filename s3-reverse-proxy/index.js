const express = require('express');
const httpProxy = require('http-proxy')
const app = express();
const path = require('path')


const PORT = process.env.PORT || 8000

const baseURI = `https://vercel-clone-imran.s3.amazonaws.com/__outputs`
const proxy = httpProxy.createProxy()

app.use((req, res)=>{
    const hostName = req.hostname;
    const subDomain = hostName.split('.')[0];

    const resolvesTo = `${baseURI}/${subDomain}`;

    return proxy.web(req,res, {target: resolvesTo, changeOrigin: true})
})



app.listen(PORT, ()=>{
    console.log(`Proxy running on port:${PORT}`)
})