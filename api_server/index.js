const express = require('express');
const {generateSlug} = require('random-word-slugs')
const app = express();

const PORT = process.env.PORT || 9000;

app.use(express.json());


app.listen(PORT, ()=>{
    console.log(`API Server running on port:${PORT}`);
})