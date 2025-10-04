
'use client';
// Komponen ini mereplikasi file login.html Anda
export default function LoginPage() {
    return (
        <html lang="id">
        <head>
            {/* Next.js akan menangani <head> secara struktural,
                tetapi kita harus menempatkan tag di sini untuk sementara
                jika kita tidak menggunakan file CSS eksternal. 
                Dalam proyek Next.js yang sebenarnya, ini akan dipindahkan ke layout.jsx atau file CSS global. */}
            <title>Login Web Shell</title>
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            
            {/* Link Bootstrap dan Styling CSS di sini */}
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
                .login-card {
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

                /* GLASSMORHPISM FORM INPUT */
                .form-control {
                    background-color: rgba(255, 255, 255, 0.15);
                    color: #fff;
                    border: 1px solid rgba(255, 255, 255, 0.5);
                    transition: border-color 0.3s ease, box-shadow 0.3s ease;
                }
                
                .form-control:focus {
                    background-color: rgba(255, 255, 255, 0.25);
                    color: #fff;
                    border-color: #50c4ff; 
                    box-shadow: 0 0 0 0.25rem rgba(80, 196, 255, 0.4); 
                }

                .form-control::placeholder {
                    color: rgba(255, 255, 255, 0.7);
                }

                /* GLASSMORHPISM BUTTON */
                .btn-primary {
                    background: linear-gradient(135deg, #007bff, #00a0ff);
                    border: none;
                    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
                    transition: all 0.2s ease;
                }

                .btn-primary:hover {
                    opacity: 0.9;
                    transform: translateY(-1px);
                    box-shadow: 0 6px 15px rgba(0, 0, 0, 0.3);
                }
            `}</style>
        </head>
        <body>
            <div className="login-card">
                <h2 className="text-center mb-4">Login Web Shell 🔒</h2>
                {/* Aksi form harus menunjuk ke rute Express Anda */}
                <form action="/login" method="POST">
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
                    
                    <button type="submit" className="btn btn-primary w-100 mb-3">Login</button>
                    
                    <p className="text-center mt-3">
                        Belum punya akun? 
                        {/* Next.js menggunakan routing berbasis file. /register.html menjadi /register */}
                        <a href="/register" className="text-warning text-decoration-none fw-bold">Daftar di sini</a>
                    </p>
                </form>
            </div>
            
            {/* Script Bootstrap */}
            <script 
                src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"
                strategy="beforeInteractive" // Gunakan untuk memastikan skrip di-load
            ></script>
        </body>
        </html>
    );
}
