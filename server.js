const express = require('express');
const next = require('next');
const path = require('path');
const { setupExpressApp } = require('./express_app');

const port = 3000;
const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
    const server = express();

    const { webshellApp, serveoProcess } = setupExpressApp(server);

    webshellApp.get('/', (req, res) => {
    return handle(req, res);
    });
    webshellApp.all('*', (req, res) => {
        return handle(req, res);
    });

    webshellApp.listen(port, (err) => {
        if (err) throw err;
        console.log(`> Ready on http://localhost:${port}`);
        console.log(`> Next.js Hybrid Server Running.`);
    });
}).catch((ex) => {
    console.error(ex.stack);
    process.exit(1);
});
