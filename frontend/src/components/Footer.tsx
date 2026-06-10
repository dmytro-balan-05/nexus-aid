import Link from 'next/link';

export default function Footer() {
    return (
        <footer className="border-t border-[var(--border)] bg-[var(--bg-card)] mt-auto">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                    <div>
                        <div className="text-xl font-black text-[var(--text-primary)] tracking-tighter mb-3">
                            NEXUS<span style={{ color: 'var(--accent)' }}>AID</span>
                        </div>
                        <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                            Платформа для прозорих благодійних зборів з верифікацією волонтерів та системою досягнень.
                        </p>
                    </div>

                    <div>
                        <p className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-3">Навігація</p>
                        <div className="space-y-2">
                            <Link href="/campaigns" className="block text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition">Всі збори</Link>
                            <Link href="/about" className="block text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition">Про нас</Link>
                            <Link href="/register" className="block text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition">Стати волонтером</Link>
                        </div>
                    </div>

                    <div>
                        <p className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-3">Підтримка</p>
                        <div className="space-y-2">
                            <p className="text-sm text-[var(--text-secondary)]">Платіжна система: WayForPay</p>
                            <p className="text-sm text-[var(--text-secondary)]">Всі платежі захищені</p>
                            <p className="text-sm text-[var(--text-secondary)]">Верифіковані волонтери</p>
                        </div>
                    </div>
                </div>

                <div className="border-t border-[var(--border)] pt-6 flex flex-col sm:flex-row justify-between items-center gap-3">
                    <p className="text-xs text-[var(--text-secondary)]">
                        © 2026 NexusAid.
                    </p>
                    <div className="flex items-center gap-4">
                        <span className="text-xs text-[var(--text-secondary)]">🇺🇦 Зроблено в Україні</span>
                        <span className="text-xs text-[var(--text-secondary)]">Слава Україні!</span>
                    </div>
                </div>
            </div>
        </footer>
    );
}