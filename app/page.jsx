// app/page.jsx
'use client';
import Link from 'next/link'; // <--- BARIS KRITIS
import React from 'react'; // Impor React (tidak wajib di Next.js terbaru, tapi bagus)

export default function HomePage() {
    return (
        <>
            {/* Inject Bootstrap CSS */}
            <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet" />

            {/* Container Utama - Menggunakan Flexbox dari CSS yang Anda berikan */}
            <div style={
                {
                    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
                    background: 'linear-gradient(135deg, #2a00ff, #50c4ff)',
                    minHeight: '100vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center',
                    padding: '20px'
                }
            }>
                <div className="glass-card">
                    <h1>VPS Premium 🚀</h1>
                    <p className="mt-4 mb-4">
                        Dapatkan pengalaman terbaik mengelola server Anda dengan **Termux Web Shell VPS Premium**. Kontrol penuh, kecepatan kilat, dan antarmuka yang intuitif kini ada di genggaman Anda.
                    </p>
                    <hr style={{ borderColor: 'rgba(255, 255, 255, 0.3)' }} />
                    <h2 className="mt-4">Fitur Unggulan</h2>
                    <ul className="list-unstyled text-start mt-3 mb-5">
                        <li>✅ **File Manager Lengkap:** Kelola file dan folder dengan mudah, termasuk upload, hapus, kompres, dan ekstrak.</li>
                        <li>✅ **Eksekusi Perintah Instan:** Jalankan perintah Termux langsung dari browser Anda tanpa lag.</li>
                        <li>✅ **Manajemen Sesi Aman:** Jaga keamanan server Anda dengan sistem login dan sesi yang terenkripsi.</li>
                        <li>✅ **Antarmuka Elegan:** Desain Glassmorphism modern yang memanjakan mata dan mudah digunakan.</li>
                    </ul>
                    <div className="d-grid gap-3 d-sm-flex justify-content-sm-center">
                        {/* Menggunakan Link Next.js untuk navigasi */}
                        <Link href="/login" legacyBehavior>
                            <a className="btn btn-custom btn-lg">Masuk</a>
                        </Link>
                        <Link href="/register" legacyBehavior>
                            <a className="btn btn-custom btn-lg">Daftar</a>
                        </Link>
                    </div>
                </div>
            </div>

            {/* Inline Styles */}
            <style jsx global>{`
                body {
                    margin: 0;
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    background: linear-gradient(135deg, #2a00ff, #50c4ff) !important;
                }
                
                .glass-card {
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 16px;
                    box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);
                    backdrop-filter: blur(5px);
                    -webkit-backdrop-filter: blur(5px);
                    border: 1px solid rgba(255, 255, 255, 0.3);
                    padding: 2.5rem;
                    color: #fff;
                    max-width: 600px;
                    margin-top: 50px;
                }

                h1, h2 {
                    font-weight: 700;
                }

                p {
                    font-size: 1.1rem;
                    line-height: 1.6;
                }

                .btn-custom {
                    background-color: rgba(255, 255, 255, 0.2);
                    color: #fff;
                    border: 1px solid rgba(255, 255, 255, 0.4);
                    transition: background-color 0.3s, border-color 0.3s;
                }

                .btn-custom:hover {
                    background-color: rgba(255, 255, 255, 0.3);
                    border-color: rgba(255, 255, 255, 0.6);
                    color: #fff;
                }
            `}</style>
        </>
    );
}
