
'use client';
// Komponen ini mereplikasi file register.html Anda
export default function RegisterPage() {
    return (
        <html lang="id">
        <head>
            {/* Title, Meta, dan Bootstrap CSS */}
            <title>Register Web Shell</title>
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <link 
                href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" 
                rel="stylesheet"
            />
            
            {/* Styling CSS asli Anda */}
            <style jsx global>{`
                /* BASE STYLES */
                body {
                    height: 100vh;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    background: linear-gradient(135deg, #2a00ff, #50c4ff);
                    color: #fff; /* Warna teks dasar putih */
                }
                
                /* GLASSMORHPISM CARD */
                .register-card {
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 16px;
                    box-shadow: 0 4px 30px rgba(0, 0, 0, 0.3);
                    backdrop-filter: blur(10px);
                    -webkit-backdrop-filter: blur(10px);
                    border: 1px solid rgba(255, 255, 255, 0.4);
                    padding: 40px;
                    max-width: 400px;
                    width: 90%;
                    transition: all 0.3s ease;
                }

                /* GLASSMORHPISM FORM INPUT & SELECT */
                .form-control, .form-select {
                    background-color: rgba(255, 255, 255, 0.15);
                    color: #fff;
                    border: 1px solid rgba(255, 255, 255, 0.5);
                    transition: border-color 0.3s ease, box-shadow 0.3s ease;
                }
                
                .form-control:focus, .form-select:focus {
                    background-color: rgba(255, 255, 255, 0.25);
                    color: #fff;
                    border-color: #50c4ff; 
                    box-shadow: 0 0 0 0.25rem rgba(80, 196, 255, 0.4); 
                }

                .form-control::placeholder {
                    color: rgba(255, 255, 255, 0.7);
                }

                /* Khusus untuk Select */
                .form-select {
                    color: #fff;
                    background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3e%3cpath fill='none' stroke='%23ffffff' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='m2 5 6 6 6-6'/%3e%3c/svg%3e");
                }
                
                .form-select option {
                    background-color: #1a0038;
                    color: #fff; 
                }

                /* GLASSMORHPISM BUTTON */
                .btn-success {
                    background: linear-gradient(135deg, #198754, #28a745);
                    border: none;
                    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
                    transition: all 0.2s ease;
                }

                .btn-success:hover {
                    opacity: 0.9;
                    transform: translateY(-1px);
                    box-shadow: 0 6px 15px rgba(0, 0, 0, 0.3);
                }
                
                .text-warning {
                     text-decoration: none;
                     font-weight: bold;
                }
            `}</style>
        </head>
        <body>
            <div className="register-card">
                <h2 className="text-center mb-4">Daftar Akun 📝</h2>
                {/* Aksi form menunjuk ke rute Express /register */}
                <form action="/register" method="POST">
                    <div className="mb-3">
                        <label htmlFor="email" className="form-label">Email</label>
                        <input 
                            type="email" 
                            className="form-control" 
                            id="email" 
                            name="email" 
                            required 
                        />
                    </div>
                    <div className="mb-3">
                        <label htmlFor="password" className="form-label">Kata Sandi</label>
                        <input 
                            type="password" 
                            className="form-control" 
                            id="password" 
                            name="password" 
                            required 
                        />
                    </div>
                    <div className="mb-3">
                        <label htmlFor="role" className="form-label">Peran (Role)</label>
                        <select className="form-select" id="role" name="role" required>
                            {/* Opsi harus di-return sebagai elemen React */}
                            <option value="user" defaultValue>User (Akses Terbatas)</option>
                            <option value="admin">Admin (Akses Penuh)</option>
                        </select>
                    </div>
                    
                    <button type="submit" className="btn btn-success w-100 mb-3">Daftar</button>
                    
                    <p className="text-center mt-3">
                        Sudah punya akun? 
                        {/* Next.js routing: /login.html menjadi /login */}
                        <a href="/login" className="text-warning">Login di sini</a>
                    </p>
                </form>
            </div>
            
            {/* Script Bootstrap */}
            <script 
                src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"
                strategy="beforeInteractive"
            ></script>
        </body>
        </html>
    );
}
