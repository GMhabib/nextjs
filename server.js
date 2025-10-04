const express = require('express');
const next = require('next');
const path = require('path');
const { setupExpressApp } = require('./express_app'); // Kita akan buat file ini

const port = 3000;
const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
    const server = express();

    // Panggil fungsi setup dari file express_app.js
    // Fungsi ini mengembalikan instance Express yang sudah dikonfigurasi
    const { webshellApp, serveoProcess } = setupExpressApp(server);

    // --- Routing Next.js ---
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
