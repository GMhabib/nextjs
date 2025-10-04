'use client'; 

import React, { useState, useEffect, useCallback } from 'react';
import Script from 'next/script';
// --- PERBAIKAN: Hapus impor Bootstrap yang bermasalah. ---
// Kita akan mengakses objek 'bootstrap' langsung dari window karena dimuat via CDN Script tag.


// --- FUNGSI UTAMA CLIENT-SIDE ---

// Fungsi untuk mendapatkan file yang dipilih dari tabel
const getSelectedFiles = () => {
    // Pastikan DOM sudah dimuat sebelum query
    if (typeof document === 'undefined') return [];
    
    const selected = [];
    document.querySelectorAll('#fileListBody input[type="checkbox"]:checked').forEach(checkbox => {
        if (checkbox.value !== '..') {
            selected.push(checkbox.value); 
        }
    });
    return selected;
};

// --- KOMPONEN UTAMA ---
export default function VPSPanelPage() {
    const [command, setCommand] = useState('');
    const [output, setOutput] = useState('Hasil akan muncul di sini.');
    const [currentDir, setCurrentDir] = useState('/uploaded_files');
    const [files, setFiles] = useState([]);
    const [editingFileName, setEditingFileName] = useState('');
    const [fileContent, setFileContent] = useState('');

    // ... (loadFileList, changeDirectory, runCommand, uploadFile, deleteSelectedFiles, archiveSelectedFiles, extractArchive, viewArchive - TIDAK BERUBAH) ...

    // --- 1. FILE LISTING (LOADER) ---
    const loadFileList = useCallback(async () => {
        setCurrentDir('Memuat...');
        setFiles([{ name: 'Memuat file...', size: '', isDir: false, isPlaceholder: true }]);
        
        try {
            const response = await fetch('/files');
            
            if (response.status === 401) {
                alert('Sesi kadaluarsa. Anda akan diarahkan ke halaman login.');
                window.location.href = '/login'; // Next.js route
                return;
            }
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `${response.status} ${response.statusText}`);
            }
            
            const responseData = await response.json();
            setCurrentDir(responseData.currentDir);
            setFiles(responseData.files);

        } catch (error) {
            setFiles([{ name: `Error: ${error.message}`, size: '', isDir: false, isError: true }]);
        }
    }, []);

    useEffect(() => {
        loadFileList();
    }, [loadFileList]);
    
    // --- 2. COMMAND EXECUTION & NAVIGATION ---
    const changeDirectory = async (dirName) => {
        const command = `cd ${dirName}`;
        setOutput(`Mengubah direktori: ${dirName}...`);

        try {
            const response = await fetch(`/shell?cmd=${encodeURIComponent(command)}`);
            const text = await response.text();
            
            if (!response.ok) {
                setOutput(`[ERROR] CD Gagal: ${text}`);
            } else {
                setOutput(`[INFO] ${text}`);
                loadFileList(); 
            }
        } catch (error) {
            setOutput(`[ERROR] Koneksi CD: ${error.message}`);
        }
    };

    const runCommand = async () => {
        if (!command.trim()) return;
        
        // Tangani 'cd' secara lokal di client (memanggil changeDirectory)
        if (command.toLowerCase().startsWith('cd ')) {
            const targetDir = command.substring(3).trim();
            await changeDirectory(targetDir);
            setCommand('');
            return;
        }

        setOutput(`Menjalankan: ${command}...\n`);
        
        try {
            const response = await fetch(`/shell?cmd=${encodeURIComponent(command)}`);
            const text = await response.text();
            
            if (!response.ok) {
                setOutput(`[ERROR] Server: ${text}`);
            } else {
                setOutput(text);
            }
            setCommand('');
            
            // Muat ulang daftar file jika perintah mungkin mengubah konten direktori
            if (command.toLowerCase().match(/^(ls|mkdir|rm|mv|cp|touch)\s/)) {
                loadFileList();
            }
        } catch (error) {
            setOutput(`[ERROR] Koneksi: ${error.message}.`);
        }
    };
    
    // --- 3. FILE MANAGER ACTIONS (Dilewati untuk keringkasan, diasumsikan sama) ---

    const uploadFile = async (e) => {
        const file = e.target.files[0];

        if (!file) return;

        const formData = new FormData();
        formData.append('uploaded_file', file); 
        
        setOutput(`Mengunggah file ${file.name}...`);

        try {
            const response = await fetch('/upload', {
                method: 'POST',
                body: formData
            });
            const data = await response.json();
            
            if (response.ok) {
                setOutput(`✅ Sukses mengunggah ${data.filename}!`);
                loadFileList(); 
            } else {
                setOutput(`❌ Gagal mengunggah file: ${data.error || 'Cek konsol server.'}`);
            }
            e.target.value = ''; // Reset input file
        } catch (error) {
            setOutput(`❌ Terjadi kesalahan koneksi saat mengunggah file: ${error.message}`);
            e.target.value = '';
        }
    };

    const deleteSelectedFiles = async (initialFiles = null) => {
        const selectedFiles = initialFiles || getSelectedFiles();
        
        if (selectedFiles.length === 0) {
            alert('Pilih setidaknya satu file atau folder untuk dihapus.');
            return;
        }
        if (!initialFiles && !window.confirm(`Yakin ingin menghapus ${selectedFiles.length} item?`)) return;
        
        setOutput(`Menghapus ${selectedFiles.length} item...`);

        try {
            const response = await fetch('/delete-files', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ files: selectedFiles })
            });
            const data = await response.json();
            
            if (response.ok) {
                setOutput(`✅ Sukses! ${data.message}`);
                loadFileList();
            } else {
                setOutput(`❌ Gagal menghapus: ${data.error || data.message}`);
            }
        } catch (error) {
            setOutput(`❌ Error koneksi saat menghapus: ${error.message}`);
        }
    };
    
    const archiveSelectedFiles = async () => {
        const selectedFiles = getSelectedFiles();
        const archiveName = document.getElementById('archiveName').value.trim();

        if (selectedFiles.length === 0 || !archiveName) {
            alert('Pilih file dan masukkan nama arsip.');
            return;
        }
        
        setOutput(`Membuat arsip ${archiveName}.zip...`);

        try {
            const response = await fetch('/archive', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ files: selectedFiles, archiveName: archiveName })
            });
            const data = await response.json();
            
            if (response.ok) {
                setOutput(`✅ Sukses! ${data.message}`);
                loadFileList();
            } else {
                setOutput(`❌ Gagal membuat arsip: ${data.error || data.message}`);
            }
        } catch (error) {
            setOutput(`❌ Error koneksi saat membuat arsip: ${error.message}`);
        }
    };
    
    const extractArchive = async (fileName) => {
        if (!window.confirm(`Yakin ingin mengekstrak ${fileName} di direktori saat ini?`)) return;

        setOutput(`Mengekstrak ${fileName}...`);

        try {
            const response = await fetch('/extract', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fileName: fileName })
            });
            const data = await response.json();
            
            if (response.ok) {
                setOutput(`✅ Sukses! ${data.message}`);
                loadFileList();
            } else {
                setOutput(`❌ Gagal mengekstrak: ${data.error || data.message}`);
            }
        } catch (error) {
            setOutput(`❌ Error koneksi saat mengekstrak: ${error.message}`);
        }
    };

    const viewArchive = async (fileName) => {
        setOutput(`Melihat isi ${fileName}...`);

        try {
            const response = await fetch(`/view-archive?name=${fileName}`);
            const text = await response.text();
            
            if (response.ok) {
                setOutput(`--- ISI ARSIP ${fileName} ---\n${text}`);
            } else {
                setOutput(`❌ Gagal melihat isi: ${text}`);
            }
        } catch (error) {
            setOutput(`❌ Error koneksi saat melihat isi arsip: ${error.message}`);
        }
    };

    
    // --- 4. FILE EDITOR ACTIONS (Diperbaiki untuk mengakses window.bootstrap) ---
    const editFile = async (fileName) => { 
        setEditingFileName(fileName);
        setFileContent('Memuat konten...');
        
        try {
            const response = await fetch(`/loadfile?name=${encodeURIComponent(fileName)}`);
            const data = await response.json();
            
            if (response.ok) {
                setFileContent(data.content);
                
                // PERBAIKAN: Akses Bootstrap dari global window
                if (typeof window !== 'undefined' && window.bootstrap) {
                    const modalElement = document.getElementById('editModal');
                    const modal = new window.bootstrap.Modal(modalElement);
                    modal.show();
                } else {
                    console.error("Bootstrap JS belum dimuat sepenuhnya.");
                }

            } else {
                alert(`Gagal memuat file: ${data.error || response.statusText}`);
                setFileContent('');
            }
        } catch (error) {
            alert(`Error koneksi saat memuat file: ${error.message}`);
            setFileContent('');
        }
    };
    
    const saveFile = async () => { 
        if (!editingFileName) return;

        setOutput(`Menyimpan ${editingFileName}...`);
        
        try {
            const response = await fetch('/savefile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fileName: editingFileName, content: fileContent })
            });
            const data = await response.json();
            
            if (response.ok) {
                setOutput(`✅ Sukses! ${data.message}`);
                
                // PERBAIKAN: Akses Bootstrap dari global window
                if (typeof window !== 'undefined' && window.bootstrap) {
                    const modalElement = document.getElementById('editModal');
                    const modal = window.bootstrap.Modal.getInstance(modalElement);
                    modal.hide();
                }

            } else {
                setOutput(`❌ Gagal menyimpan: ${data.error || data.message}`);
                alert(`Gagal menyimpan file: ${data.error || data.message}`);
            }
        } catch (error) {
            setOutput(`❌ Error koneksi saat menyimpan: ${error.message}`);
        }
    };

    // --- RENDER JSX ---
    return (
        <React.Fragment>
            {/* INJEKSI STYLING GLOBAL (Diasumsikan ini sudah dipindahkan ke app/globals.css) */}
            <style jsx global>{`
                /* ... [Semua CSS Anda ada di sini] ... */
                /* Perlu diingat, tag <style jsx global> di Client Component hanya diperlukan jika CSS tidak bisa diletakkan di globals.css */
                /* Jika Anda sudah memindahkannya ke globals.css, Anda bisa menghapus tag <style> ini untuk kebersihan kode. */
                /* Karena ini Client Component, saya pertahankan sesuai permintaan Anda, tetapi idealnya ini hanya di globals.css. */

                /* GLASSMORPHISM STYLES */
                .glass-card {
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 16px;
                    box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);
                    backdrop-filter: blur(5px);
                    -webkit-backdrop-filter: blur(5px);
                    border: 1px solid rgba(255, 255, 255, 0.3);
                    padding: 20px;
                    margin-bottom: 20px;
                    color: #fff;
                }
                /* GENERAL STYLES */
                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    background: linear-gradient(135deg, #2a00ff, #50c4ff);
                    color: #fff;
                    min-height: 100vh;
                    padding-top: 20px;
                    padding-bottom: 20px;
                    overflow-x: hidden;
                }
                /* COMMAND INPUT & OUTPUT */
                #commandInput, #fileUpload, #fileContent, #archiveName {
                    background-color: rgba(255, 255, 255, 0.2);
                    color: #fff;
                    border: 1px solid rgba(255, 255, 255, 0.4);
                }
                #output {
                    background-color: rgba(0, 0, 0, 0.5);
                    padding: 15px;
                    margin-top: 20px;
                    white-space: pre-wrap;
                    word-wrap: break-word;
                    border-radius: 8px;
                    max-height: 300px;
                    overflow-y: auto;
                }
                .table-glass {
                    color: #fff;
                }
                .table-glass th, .table-glass td {
                     border-color: rgba(255, 255, 255, 0.4);
                     vertical-align: middle;
                }
                .table-glass tbody tr:hover {
                     background-color: rgba(255, 255, 255, 0.1);
                }
                /* DRAGGABLE BUTTON STYLES (Floating Action Button) */
                #draggableButton {
                    width: 60px;
                    height: 60px;
                    border-radius: 50%;
                    background-color: #ff4500;
                    color: #fff;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    font-size: 1.5rem;
                    cursor: pointer;
                    position: fixed;
                    bottom: 20px;
                    right: 20px;
                    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.4);
                    transition: transform 0.3s ease;
                    touch-action: none;
                    z-index: 1050;
                }
                #draggableButton:active {
                    transform: scale(1.1);
                }
                .btn-float {
                    background: none;
                    border: none;
                    color: inherit;
                    font-size: inherit;
                    cursor: inherit;
                    padding: 0;
                    margin: 0;
                    line-height: 1;
                    pointer-events: none; 
                }
                #draggableButton button {
                     pointer-events: all;
                }
                @media (pointer: coarse) {
                    #draggableButton {
                        cursor: default;
                    }
                } 
                #draggableButton1 {
                    width: 60px;
                    height: 60px;
                    border-radius: 50%;
                    background-color: #ff4500;
                    color: #fff;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    font-size: 1.5rem;
                    cursor: pointer;
                    position: fixed;
                    bottom: 20px;
                    left: 20px;
                    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.4);
                    transition: transform 0.3s ease;
                    touch-action: none;
                    z-index: 1050;
                }
                #draggableButton1:active {
                    transform: scale(1.1);
                }
                /* Admin Badge Neon */
                .admin-badge {
                    padding: 2px 8px;
                    border-radius: 20px; 
                    font-size: 0.9em;
                    font-weight: bold;
                    color: #fff; 
                    text-shadow: 0 0 10px rgba(255, 255, 255, 0.8); 
                    border: 3px solid transparent;
                    box-shadow: 
                        0 0 10px #00ffff, 
                        0 0 20px #ff00ff, 
                        0 0 30px #00ffff, 
                        inset 0 0 10px #ff00ff; 
                    animation: neon-flicker 1.5s infinite alternate;
                }
                @keyframes neon-flicker {
                    0%, 100% {
                        box-shadow: 0 0 10px #00ffff, 0 0 20px #ff00ff, 0 0 30px #00ffff, inset 0 0 10px #ff00ff;
                    }
                    50% {
                        box-shadow: 0 0 5px #00ffff, 0 0 10px #ff00ff, 0 0 20px #00ffff, inset 0 0 5px #ff00ff;
                    }
                }
                .text-glow {
                    animation: text-flicker 2s infinite alternate;
                    letter-spacing: 1px;
                }
                @keyframes text-flicker {
                    0%, 100% {
                        text-shadow: 0 0 5px #fff, 0 0 15px #ff00ff; 
                        opacity: 1;
                    }
                    30% {
                        opacity: 0.9;
                    }
                    50% {
                        text-shadow: 0 0 3px #fff, 0 0 10px #00ffff;
                    }
                    70% {
                        opacity: 0.95;
                    }
                }
                .crown-icon, .sparkle-icon {
                  margin: 0 6px;
                    font-size: 1.2em; /* Dikurangi agar proporsional */
                    animation: icon-flicker 1s infinite steps(1) alternate;
                }
                @keyframes icon-flicker {
                    0% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.7; transform: scale(1.1); }
                    100% { opacity: 1; transform: scale(1); }
                }

            `}</style>
            
            {/* INJEKSI BOOTSTRAP CSS (Seharusnya sudah di app/globals.css) */}
            <link 
                href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" 
                rel="stylesheet"
            />
            
            <div className="container">
                <h1 className="text-center mb-4">Termux Web Shell 🐚</h1>
                
                <div className="text-end mb-3">
                    <div className="admin-badge d-flex justify-content-between align-items-center text-center">
                        <span className="crown-icon">👑</span>
                        <span className="text-glow">P R E M I U M</span>
                        <span className="sparkle-icon">✨</span>
                    </div>
                </div>

                {/* --- FILE MANAGER CARD --- */}
                <div className="glass-card">
                    <h2>File Manager</h2>
                    <p id="currentDirDisplay" className="text-warning">CWD: {currentDir}</p> 
                    
                    <div className="mb-3">
                        <label htmlFor="fileUpload" className="form-label">Upload File (Ke CWD Saat Ini)</label>
                        <input 
                            className="form-control" 
                            type="file" 
                            id="fileUpload" 
                            onChange={uploadFile}
                        />
                    </div>
                    
                    <h5 className="mt-4">Daftar File</h5>
                    <div className="table-responsive">
                        <table className="table table-borderless table-glass">
                            <thead>
                                <tr>
                                    <th style={{ width: '10px' }}>
                                        {/* Select All Checkbox */}
                                        <input 
                                            type="checkbox" 
                                            id="selectAllFiles" 
                                            onChange={(e) => {
                                                document.querySelectorAll('#fileListBody input[type="checkbox"]').forEach(checkbox => {
                                                    if (checkbox.value !== '..') {
                                                       checkbox.checked = e.target.checked;
                                                    }
                                                });
                                            }}
                                        />
                                    </th>
                                    <th>Nama File</th>
                                    <th>Ukuran</th>
                                    <th>Aksi</th>
                                </tr>
                            </thead>
                            <tbody id="fileListBody">
                                {files.length === 0 ? (
                                    <tr><td colSpan="4">Direktori ini kosong.</td></tr>
                                ) : (
                                    files.map((file, index) => {
                                        const isArchive = file.name.match(/\.(zip|rar|tar|gz|tgz|tar\.gz)$/i);
                                        const isParentDir = file.name === '..';

                                        return (
                                            <tr key={file.name + index} className="text-nowrap">
                                                <td>
                                                    <input 
                                                        type="checkbox" 
                                                        value={file.name} 
                                                        disabled={isParentDir}
                                                    />
                                                </td>
                                                <td>{file.name}</td>
                                                <td>{file.size}</td>
                                                <td>
                                                    {file.isDir && !isParentDir && (
                                                        <button 
                                                            className="btn btn-sm btn-primary" 
                                                            onClick={() => changeDirectory(file.name)}
                                                        >Buka</button>
                                                    )}
                                                    {isParentDir && (
                                                        <button 
                                                            className="btn btn-sm btn-secondary" 
                                                            onClick={() => changeDirectory(file.name)}
                                                        >.. Naik</button>
                                                    )}
                                                    {!file.isDir && isArchive && (
                                                        <>
                                                            <button className="btn btn-sm btn-success" onClick={() => extractArchive(file.name)}>Ekstrak</button>
                                                            <button className="btn btn-sm btn-info ms-1" onClick={() => viewArchive(file.name)}>Lihat Isi</button>
                                                        </>
                                                    )}
                                                    {!file.isDir && !isArchive && !file.isPlaceholder && !file.isError && (
                                                        <>
                                                            <button className="btn btn-sm btn-warning" onClick={() => editFile(file.name)}>Edit</button>
                                                            <button className="btn btn-sm btn-danger ms-1" onClick={() => deleteSelectedFiles([file.name])}>Hapus</button>
                                                        </>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="d-flex flex-wrap justify-content-between align-items-center mt-3 gap-2">
                        <button className="btn btn-danger btn-sm" onClick={() => deleteSelectedFiles()}>Hapus Terpilih</button>
                        
                        <div className="input-group" style={{ maxWidth: '250px' }}>
                            <input type="text" id="archiveName" className="form-control form-control-sm" placeholder="Nama Arsip" />
                            <button className="btn btn-info btn-sm" onClick={archiveSelectedFiles}>ZIP</button>
                        </div>
                    </div>
                </div>

                {/* --- COMMAND EXECUTION CARD --- */}
                <div className="glass-card">
                    <h2>Eksekusi Perintah</h2>
                    <div className="input-group">
                        <input 
                            type="text" 
                            id="commandInput" 
                            className="form-control" 
                            placeholder="Contoh: ls -l atau cd .." 
                            aria-label="Perintah Termux"
                            value={command}
                            onChange={(e) => setCommand(e.target.value)}
                            onKeyPress={(e) => { if (e.key === 'Enter') runCommand(); }}
                        />
                    </div>
                    <pre id="output" className="mt-3">{output}</pre>
                </div>
            </div>

            {/* --- FLOATING BUTTONS --- */}
            <div id="draggableButton">
                <button className="btn-float" onClick={runCommand}>Run</button>
            </div>
            <div id="draggableButton1">
               <a href="/logout" className="btn btn-sm btn-danger">Logout</a>
            </div>

            {/* --- EDIT MODAL --- */}
            <div className="modal fade" id="editModal" tabIndex="-1" aria-labelledby="editModalLabel" aria-hidden="true">
              <div className="modal-dialog modal-lg">
                <div className="modal-content glass-card">
                  <div className="modal-header border-bottom-0">
                    <h5 className="modal-title" id="editModalLabel">Edit File: <span id="editingFileName">{editingFileName}</span></h5>
                    <button type="button" className="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                  </div>
                  <div className="modal-body">
                    <textarea 
                        id="fileContent" 
                        className="form-control" 
                        rows="15" 
                        style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)', color: 'white' }}
                        value={fileContent}
                        onChange={(e) => setFileContent(e.target.value)}
                    ></textarea>
                  </div>
                  <div className="modal-footer border-top-0">
                    <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Tutup</button>
                    <button type="button" className="btn btn-success" onClick={saveFile}>Simpan Perubahan</button>
                  </div>
                </div>
              </div>
            </div>

            {/* INJEKSI BOOTSTRAP JS - Harus di sini di Next.js */}
            {/* Kami menggunakan 'Script' Next.js untuk memuat skrip eksternal */}
            <Script 
                src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js" 
                strategy="afterInteractive" 
            />
        </React.Fragment>
    );
}
