import './globals.css'; // Import CSS global Anda

export const metadata = {
  title: 'Termux Web Shell',
  description: 'Web shell running on Next.js/Express hybrid server.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      {/* Tag <head> diurus oleh metadata dan link di atas */}
      <body>
        {children}
        {/* Bootstrap JS di sini (atau di komponen yang membutuhkannya) */}
        <script 
            src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js" 
            defer 
        ></script>
      </body>
    </html>
  );
}
