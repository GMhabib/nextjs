// app/logout/page.jsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LogoutPage() {
    const router = useRouter();
    const [message, setMessage] = useState('Sedang memproses logout...');

    useEffect(() => {
        // Fungsi asinkron untuk menangani proses logout
        async function handleLogout() {
            try {
                // 1. Memanggil endpoint API Express '/logout'
                // Endpoint ini akan menghapus req.session di Express
                const response = await fetch('/logout', {
                    method: 'GET', // Express Anda menggunakan GET untuk logout
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });

                if (response.ok || response.status === 302) {
                    // 2. Jika Express berhasil redirect (302) atau merespons OK
                    setMessage('Logout berhasil! Anda akan dialihkan...');
                    
                    // 3. Redirect ke halaman login setelah 1 detik
                    setTimeout(() => {
                        // Menggunakan replace untuk mencegah pengguna kembali ke halaman logout
                        router.replace('/login'); 
                    }, 1000);
                } else {
                    // 4. Penanganan jika Express gagal
                    setMessage('Logout gagal. Silakan coba lagi atau hapus cache browser.');
                    console.error('Logout failed with status:', response.status);
                }
            } catch (error) {
                // 5. Penanganan error jaringan
                setMessage('Terjadi kesalahan jaringan. Cek koneksi Anda.');
                console.error('Network error during logout:', error);
            }
        }

        handleLogout();
    }, [router]); // Hanya dijalankan saat komponen dimuat

    return (
        <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #2a00ff, #50c4ff)',
            color: 'white',
            textAlign: 'center',
            padding: '20px'
        }}>
            <div style={{ 
                background: 'rgba(255, 255, 255, 0.1)',
                padding: '40px',
                borderRadius: '16px',
                boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
                backdropFilter: 'blur(5px)'
            }}>
                <h2>Proses Logout</h2>
                <p>{message}</p>
                
                {/* Tampilkan spinner loading jika pesan masih default */}
                {message === 'Sedang memproses logout...' && (
                    <div className="spinner-border text-light mt-3" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                )}
            </div>
        </div>
    );
}

