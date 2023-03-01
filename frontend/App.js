require('dotenv').config();
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

app.use('/suggestions', createProxyMiddleware({ target: process.env.PROXY, changeOrigin: false }));
app.use('/', express.static('build'));


app.listen(80, () => {console.log('listening!: 80');})