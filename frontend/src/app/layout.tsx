import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { NotificationProvider } from '@/context/NotificationContext';
import Header from '@/components/Header';
import Toast from '@/components/Toast';
import Footer from '@/components/Footer';

export const metadata = {
    title: 'Nexus Aid',
    description: 'Charity Platform',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="uk">
        <body>
        <ThemeProvider>
            <NotificationProvider>
                <AuthProvider>
                    <Header />
                    <main className="min-h-screen bg-[var(--bg-secondary)]">
                        {children}
                    </main>
                    <Footer />
                    <Toast />
                </AuthProvider>
            </NotificationProvider>
        </ThemeProvider>
        </body>
        </html>
    );
}