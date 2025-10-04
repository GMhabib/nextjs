const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const archiver = require('archiver');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const bodyParser = require('body-parser');

exports.setupExpressApp = (app) => {
    const port = 3000;

    const usersInMem = {};
    const UPLOAD_DIR = path.join(process.cwd(), 'uploaded_files');

    if (!fs.existsSync(UPLOAD_DIR)) {
        fs.mkdirSync(UPLOAD_DIR);
        console.log(`Direktori upload dibuat: ${UPLOAD_DIR}`);
    }

    const storage = multer.diskStorage({
        destination: (req, file, cb) => { cb(null, UPLOAD_DIR); },
        filename: (req, file, cb) => { cb(null, file.originalname); }
    });
    const upload = multer({
        storage: storage,
        limits: { fileSize: 1024 * 1024 * 5 }
    });

    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true }));

    app.use(session({
        secret: 'SuperSecretKeyForWebshell',
        resave: false,
        saveUninitialized: true,
        cookie: { maxAge: 24 * 60 * 60 * 1000, secure: process.env.NODE_ENV === 'production' }
    }));

    function requireLogin(req, res, next) {
        if (req.session.isLoggedIn) {
            if (!req.session.cwd) {
                req.session.cwd = UPLOAD_DIR;
            }
            next();
        } else {
            if (req.xhr || req.headers.accept.includes('json')) {
                return res.status(401).json({ error: 'Sesi kadaluarsa. Silakan login kembali.' });
            }
            res.redirect('/login'); 
        }
    }

    function commandRestriction(req, res, next) {
        const role = req.session.role;
        const cmd = req.query.cmd || '';

        let dangerousCommands = [];

        if (role === 'user') {
            dangerousCommands = [
                'rm -rf', 'rm -fr', 'rm -f', 'rm -r', 'format', 'shutdown', 'reboot'
            ];
        } else if (role === 'admin') {
            dangerousCommands = [
                'rm -rf', 'rm -fr', 'rm -f', 'rm -r', 'pkill bash', 'pkill sh','pkill npm', 'kill -9', 'pkill su', 'pkill sudo', 'pkill node', 'pkill com.termux', 'format', 'shutdown', 'reboot'
            ];
        } 
        
        const isDangerous = dangerousCommands.some(dc => cmd.toLowerCase().includes(dc));

        if (isDangerous) {
            return res.status(403).send('Akses ditolak. Jika Kamu Gila Keluar Dari Website saya');
        }
        next();
    }

    app.use((req, res, next) => {
        const publicPaths = ['/login', '/register', '/logout']; 
        const isPublicPath = publicPaths.includes(req.path) || req.path === '/';
        const isStaticAsset = req.path.match(/\.(css|js|png|jpg|ico|gif|svg)$/i);
        
        if (isPublicPath || isStaticAsset) {
            return next();
        }
        
        requireLogin(req, res, next);
    });

    app.post('/register', async (req, res) => {
        const { email, password, role } = req.body;
        if (!email || !password || (role !== 'user' && role !== 'admin')) {
            return res.status(400).send('Data registrasi tidak lengkap atau peran tidak valid.');
        }
        if (usersInMem[email]) {
            return res.status(409).send('Email sudah terdaftar.');
        }
        try {
            const passwordHash = await bcrypt.hash(password, 10);
            usersInMem[email] = { passwordHash, role };
            console.log(`Pengguna baru terdaftar: ${email} (${role})`);
            
            req.session.isLoggedIn = true;
            req.session.user = email;
            req.session.role = role;
            req.session.cwd = UPLOAD_DIR; 
            
            req.session.save(err => {
                if (err) {
                    console.error("Error saving session after register:", err);
                    return res.status(500).send("Registration failed due to session error.");
                }
                res.redirect('/vps_panel'); 
            });

        } catch (error) {
            console.error('Error saat registrasi:', error);
            res.status(500).send('Gagal mendaftarkan pengguna.');
        }
    });

    app.post('/login', async (req, res) => {
        const { email, password } = req.body;
        const user = usersInMem[email];
        if (!user) {
            return res.redirect('/login?error=invalid');
        }
        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (isMatch) {
            req.session.isLoggedIn = true;
            req.session.user = email;
            req.session.role = user.role;
            req.session.cwd = UPLOAD_DIR; 
            
            req.session.save(err => {
                if (err) {
                    console.error("Error saving session after login:", err);
                    return res.status(500).send("Login failed due to session error.");
                }
                res.redirect('/vps_panel'); 
            });

        } else {
            res.redirect('/login?error=invalid');
        }
    });

    app.get('/logout', (req, res) => {
        req.session.destroy(err => {
            if (err) {
                return res.status(500).send('Gagal logout.');
            }
            res.redirect('/login'); 
        });
    });

    app.get('/shell', commandRestriction, (req, res) => {
        const cmd = req.query.cmd ? req.query.cmd.trim() : '';
        if (!cmd) {
            return res.status(400).send('Perintah tidak ditemukan.');
        }
        
        let currentDir = req.session.cwd || UPLOAD_DIR;

        if (cmd.toLowerCase().startsWith('cd ')) {
            const targetDir = cmd.substring(3).trim();
            let absoluteTarget = path.resolve(currentDir, targetDir);
            absoluteTarget = path.normalize(absoluteTarget);

            if (!absoluteTarget.startsWith(UPLOAD_DIR)) {
                req.session.cwd = UPLOAD_DIR;
                return res.status(403).send(`Direktori diubah ke: ${req.session.cwd.replace(path.dirname(UPLOAD_DIR), '')} (Akses root ditolak)\n`);
            }
            
            try {
                const stats = fs.statSync(absoluteTarget);
                if (stats.isDirectory()) {
                    req.session.cwd = absoluteTarget;
                    return res.send(`Direktori diubah ke: ${req.session.cwd.replace(path.dirname(UPLOAD_DIR), '')}\n`);
                } else {
                    return res.status(400).send(`Error: Target bukan direktori: ${targetDir}`);
                }
            } catch (error) {
                return res.status(400).send(`Error: Direktori tidak ditemukan: ${targetDir}`);
            }
        }
        
        exec(cmd, { cwd: currentDir }, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error: ${error.message}`);
                return res.status(500).send(`Error: ${error.message}`);
            }
            if (stderr) {
                return res.send(stderr + stdout); 
            }
            res.send(stdout);
        });
    });

    app.get('/files', async (req, res) => {
        const currentDir = req.session.cwd || UPLOAD_DIR;

        try {
            const files = await fs.promises.readdir(currentDir); 
            
            const fileData = await Promise.all(files.map(async (file) => {
                const filePath = path.join(currentDir, file);
                if (!filePath.startsWith(UPLOAD_DIR)) return null; 

                const stats = await fs.promises.stat(filePath);

                return {
                    name: file,
                    size: stats.isDirectory() ? 'DIR' : (stats.size / 1024).toFixed(2) + ' KB',
                    isDir: stats.isDirectory()
                };
            }));
            
            if (currentDir !== UPLOAD_DIR) {
                fileData.unshift({
                    name: '..',
                    size: 'DIR',
                    isDir: true
                });
            }

            const displayPath = currentDir.replace(path.dirname(UPLOAD_DIR), '');
            res.status(200).json({ currentDir: displayPath, files: fileData.filter(f => f !== null) });
        } catch (error) {
            console.error('Error saat membaca direktori:', error);
            res.status(500).json({ error: 'Gagal memuat daftar file dari server.' });
        }
    });

    app.post('/upload', upload.single('uploaded_file'), (req, res) => {
        if (!req.file) {
            return res.status(400).send('Tidak ada file yang diunggah.');
        }
        
        const currentDir = req.session.cwd || UPLOAD_DIR;
        const oldPath = req.file.path;
        const newPath = path.join(currentDir, req.file.originalname);
        
        if (!newPath.startsWith(UPLOAD_DIR)) {
            fs.promises.unlink(oldPath); 
            return res.status(403).send('Path file tidak valid.');
        }
        
        fs.promises.rename(oldPath, newPath)
            .then(() => {
                console.log(`File berhasil diunggah dan dipindahkan ke: ${newPath}`);
                res.status(200).json({ 
                    message: 'File berhasil diunggah!', 
                    filename: req.file.originalname
                });
            })
            .catch(error => {
                console.error('Error saat memindahkan file:', error);
                res.status(500).send('Gagal memindahkan file ke direktori kerja saat ini.');
            });
    });

    app.post('/delete-files', async (req, res) => { 
        const { files } = req.body;
        if (!files || files.length === 0) {
            return res.status(400).json({ message: 'Tidak ada file yang dipilih.' });
        }
        const currentDir = req.session.cwd || UPLOAD_DIR;

        let deletedCount = 0;
        try {
            await Promise.all(files.map(async (fileName) => {
                const filePath = path.join(currentDir, fileName);
                if (filePath.startsWith(UPLOAD_DIR) && fs.existsSync(filePath)) {
                    const stats = await fs.promises.stat(filePath);
                    if (stats.isDirectory()) {
                        await fs.promises.rm(filePath, { recursive: true, force: true });
                    } else {
                        await fs.promises.unlink(filePath);
                    }
                    deletedCount++;
                }
            }));
            res.status(200).json({ message: `${deletedCount} item berhasil dihapus.`, deleted: deletedCount });
        } catch (error) {
            console.error('Error saat menghapus file:', error);
            res.status(500).json({ error: 'Gagal menghapus file.' });
        }
    });

    app.post('/archive', (req, res) => {
        const { files, archiveName } = req.body;
        if (!files || files.length === 0 || !archiveName) {
            return res.status(400).json({ message: 'Data arsip tidak lengkap.' });
        }
        const currentDir = req.session.cwd || UPLOAD_DIR;

        const outputFilePath = path.join(currentDir, `${archiveName}.zip`);
        const output = fs.createWriteStream(outputFilePath);
        const archive = archiver('zip', {
            zlib: { level: 9 }
        });

        output.on('close', () => {
            console.log(`Arsip dibuat: ${outputFilePath} (${archive.pointer()} total bytes)`);
            res.status(200).json({ message: `Arsip ${archiveName}.zip berhasil dibuat.` });
        });

        archive.on('error', (err) => {
            console.error('Archiver error:', err);
            res.status(500).json({ error: 'Gagal membuat arsip.' });
        });

        archive.pipe(output);

        files.forEach(fileName => {
            const filePath = path.join(currentDir, fileName);
            
            if (fs.existsSync(filePath)) {
                const stats = fs.statSync(filePath);
                
                if (stats.isDirectory()) {
                    archive.directory(filePath, fileName);
                } else if (stats.isFile()) {
                    archive.file(filePath, { name: fileName });
                }
            }
        });

        archive.finalize();
    });

    app.post('/extract', (req, res) => {
        const { fileName } = req.body;
        if (!fileName) {
            return res.status(400).json({ message: 'Nama file arsip tidak ditemukan.' });
        }
        const currentDir = req.session.cwd || UPLOAD_DIR;
        const filePath = path.join(currentDir, fileName);

        if (!filePath.startsWith(UPLOAD_DIR) || !fs.existsSync(filePath)) {
            return res.status(404).json({ error: 'File arsip tidak ditemukan atau tidak valid.' });
        }

        exec(`unzip -o "${filePath}" -d "${currentDir}"`, (error, stdout, stderr) => {
            if (error) {
                console.error(`Exec error: ${error.message}`);
                return res.status(500).json({ error: `Gagal mengekstrak: ${stderr || error.message}` });
            }
            res.status(200).json({ message: `File ${fileName} berhasil diekstrak ke direktori kerja saat ini.` });
        });
    });

    app.get('/view-archive', (req, res) => {
        const fileName = req.query.name;
        if (!fileName) {
            return res.status(400).json({ message: 'Nama file arsip tidak ditemukan.' });
        }
        const currentDir = req.session.cwd || UPLOAD_DIR;
        const filePath = path.join(currentDir, fileName);

        if (!filePath.startsWith(UPLOAD_DIR) || !fs.existsSync(filePath)) {
            return res.status(404).send(`Error: File arsip tidak ditemukan atau tidak valid.`);
        }

        exec(`unzip -l "${filePath}"`, (error, stdout, stderr) => {
            if (error) {
                return res.status(500).json({ error: `Gagal melihat isi: ${stderr || error.message}` });
            }
            res.status(200).send(stdout);
        });
    });

    app.get('/loadfile', async (req, res) => {
        const fileName = req.query.name;
        if (!fileName) {
            return res.status(400).json({ error: 'Nama file tidak ditemukan.' });
        }
        const currentDir = req.session.cwd || UPLOAD_DIR;
        const filePath = path.join(currentDir, fileName);

        if (!filePath.startsWith(UPLOAD_DIR)) {
            return res.status(403).json({ error: 'Akses ditolak.' });
        }

        try {
            const stats = await fs.promises.stat(filePath);
            if (stats.isDirectory()) {
                return res.status(400).json({ error: 'Tidak dapat mengedit direktori.' });
            }
            
            if (stats.size > 1024 * 1024) { 
                return res.status(413).json({ error: 'File terlalu besar untuk diedit (maks. 1MB).' });
            }

            const content = await fs.promises.readFile(filePath, 'utf8');
            res.status(200).json({ content });
        } catch (error) {
            console.error('Error saat memuat file:', error);
            res.status(500).json({ error: 'Gagal memuat konten file.' });
        }
    });

    app.post('/savefile', async (req, res) => {
        const { fileName, content } = req.body;
        if (!fileName || content === undefined) {
            return res.status(400).json({ error: 'Data file atau konten tidak lengkap.' });
        }
        const currentDir = req.session.cwd || UPLOAD_DIR;
        const filePath = path.join(currentDir, fileName);

        if (!filePath.startsWith(UPLOAD_DIR)) {
            return res.status(403).json({ error: 'Akses ditolak.' });
        }

        try {
            await fs.promises.writeFile(filePath, content, 'utf8');
            res.status(200).json({ message: `File ${fileName} berhasil disimpan.` });
        } catch (error) {
            console.error('Error saat menyimpan file:', error);
            res.status(500).json({ error: 'Gagal menyimpan file.' });
        }
    });

    if (!usersInMem['admin@shell.com']) {
        bcrypt.hash('admin123', 10).then(hash => {
            usersInMem['admin@shell.com'] = { passwordHash: hash, role: 'admin' };
            console.log('Admin default dibuat: admin@shell.com / admin123');
        });
    }

    return { webshellApp: app, serveoProcess: null };
};
