import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import Header from '@/components/Header'; // <--- Додано імпорт

export const metadata = {
    title: 'Nexus Aid',
    description: 'Charity Platform',
};

export default function RootLayout({
                                       children,
                                   }: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
        <body>
        <AuthProvider>
            {}
            <Header />

            {}
            <main className="min-h-screen bg-gray-50">
                {children}
            </main>
        </AuthProvider>
        </body>
        </html>
    );
}