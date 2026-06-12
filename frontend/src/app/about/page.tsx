'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

function useInView(threshold = 0.2) {
    const ref = useRef<HTMLDivElement>(null);
    const [inView, setInView] = useState(false);
    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => { if (entry.isIntersecting) setInView(true); },
            { threshold }
        );
        if (ref.current) observer.observe(ref.current);
        return () => observer.disconnect();
    }, []);
    return { ref, inView };
}

function Counter({ target, suffix = '' }: { target: number; suffix?: string }) {
    const [count, setCount] = useState(0);
    const { ref, inView } = useInView();
    useEffect(() => {
        if (!inView) return;
        let start = 0;
        const duration = 1500;
        const step = Math.ceil(target / (duration / 16));
        const timer = setInterval(() => {
            start += step;
            if (start >= target) { setCount(target); clearInterval(timer); }
            else setCount(start);
        }, 16);
        return () => clearInterval(timer);
    }, [inView, target]);
    return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

function FadeIn({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
    const { ref, inView } = useInView();
    return (
        <div ref={ref} style={{
            opacity: inView ? 1 : 0,
            transform: inView ? 'translateY(0)' : 'translateY(32px)',
            transition: `opacity 0.6s ease ${delay}ms, transform 0.6s ease ${delay}ms`,
        }}>
            {children}
        </div>
    );
}

const STATS = [
    { label: 'Зборів створено', value: 120, suffix: '+' },
    { label: 'Донатів здійснено', value: 3400, suffix: '+' },
    { label: 'Волонтерів верифіковано', value: 48, suffix: '' },
];

const HOW_IT_WORKS = [
    { step: '01', title: 'Створи збір', desc: 'Верифікований волонтер створює кампанію з описом, метою та фото.' },
    { step: '02', title: 'Задонать', desc: 'Будь-хто може підтримати збір — авторизований або анонімно через WayForPay.' },
    { step: '03', title: 'Отримуй бейджі', desc: 'Донори отримують бейджі, рівні та кастомні картки за свій внесок.' },
];

const VALUES = [
    { icon: '🔍', title: 'Прозорість', desc: 'Кожен донат відстежується. Прогрес зборів видно в реальному часі.' },
    { icon: '🎮', title: 'Гейміфікація', desc: '62 бейджі, рівні Bronze→Platinum, стріки та лідерборд донорів.' },
    { icon: '🤝', title: 'Спільнота', desc: 'Волонтери, донори та адміністратори в одній екосистемі.' },
];

const TECH = [
    { name: 'NestJS', color: '#e0234e' },
    { name: 'Next.js', color: '#000000' },
    { name: 'PostgreSQL', color: '#336791' },
    { name: 'Prisma', color: '#2D3748' },
    { name: 'Tailwind CSS', color: '#06b6d4' },
    { name: 'WayForPay', color: '#ff6b00' },
    { name: 'Railway', color: '#7c3aed' },
    { name: 'JWT', color: '#d97706' },
];

export default function AboutPage() {
    return (
        <div style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>

            {/* HERO */}
            <section className="relative min-h-[90vh] flex flex-col items-center justify-center text-center px-4 overflow-hidden">
                <div className="absolute inset-0 pointer-events-none select-none flex items-center justify-center">
                    <span className="text-[22vw] font-black tracking-tighter whitespace-nowrap"
                          style={{ color: 'var(--text-primary)', opacity: 0.03 }}>
                        NEXUSAID
                    </span>
                </div>
                <div className="relative z-10 max-w-3xl">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold mb-6 border"
                         style={{ borderColor: 'var(--accent)', color: 'var(--accent)', background: 'transparent' }}>
                        🇺🇦 Благодійна платформа
                    </div>
                    <h1 className="text-5xl sm:text-7xl font-black mb-6 leading-none">
                        Разом{' '}
                        <span style={{
                            background: 'linear-gradient(135deg, var(--accent), #f97316)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                        }}>
                            до перемоги
                        </span>
                    </h1>
                    <p className="text-xl mb-8 max-w-xl mx-auto" style={{ color: 'var(--text-secondary)' }}>
                        NexusAid — платформа що об'єднує донорів і волонтерів. Прозорі збори, гейміфікація та реальний вплив.
                    </p>
                    <Link href="/campaigns"
                          className="inline-block px-8 py-4 rounded-2xl font-bold text-lg text-white transition hover:opacity-90 active:scale-95"
                          style={{ background: 'var(--accent)' }}>
                        Переглянути збори →
                    </Link>
                </div>
                <div className="absolute bottom-8 animate-bounce" style={{ color: 'var(--text-secondary)' }}>↓</div>
            </section>

            {/* STATS */}
            <section className="py-20 px-4" style={{ background: 'var(--bg-secondary)' }}>
                <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-8">
                    {STATS.map((s) => (
                        <div key={s.label} className="text-center p-8 rounded-2xl border"
                             style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
                            <div className="text-5xl font-black mb-2" style={{ color: 'var(--accent)' }}>
                                <Counter target={s.value} suffix={s.suffix} />
                            </div>
                            <div className="text-sm font-bold" style={{ color: 'var(--text-secondary)' }}>{s.label}</div>
                        </div>
                    ))}
                </div>
            </section>

            {/* ЦІННОСТІ */}
            <section className="py-24 px-4">
                <div className="max-w-5xl mx-auto">
                    <FadeIn>
                        <h2 className="text-3xl sm:text-4xl font-black text-center mb-4">Наші цінності</h2>
                        <p className="text-center mb-16" style={{ color: 'var(--text-secondary)' }}>
                            Що робить NexusAid особливим
                        </p>
                    </FadeIn>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                        {VALUES.map((v, i) => (
                            <FadeIn key={v.title} delay={i * 100}>
                                <div className="p-8 rounded-2xl border h-full transition hover:scale-105"
                                     style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
                                    <div className="text-4xl mb-4">{v.icon}</div>
                                    <h3 className="text-xl font-black mb-2">{v.title}</h3>
                                    <p style={{ color: 'var(--text-secondary)' }}>{v.desc}</p>
                                </div>
                            </FadeIn>
                        ))}
                    </div>
                </div>
            </section>

            {/* ЯК ЦЕ ПРАЦЮЄ */}
            <section className="py-24 px-4" style={{ background: 'var(--bg-secondary)' }}>
                <div className="max-w-4xl mx-auto">
                    <FadeIn>
                        <h2 className="text-3xl sm:text-4xl font-black text-center mb-4">Як це працює</h2>
                        <p className="text-center mb-16" style={{ color: 'var(--text-secondary)' }}>
                            Три кроки від ідеї до результату
                        </p>
                    </FadeIn>
                    <div className="flex flex-col gap-6">
                        {HOW_IT_WORKS.map((h, i) => (
                            <FadeIn key={h.step} delay={i * 150}>
                                <div className="flex items-start gap-6 p-8 rounded-2xl border"
                                     style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
                                    <div className="text-4xl font-black flex-shrink-0" style={{ color: 'var(--accent)', opacity: 0.3 }}>
                                        {h.step}
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black mb-1">{h.title}</h3>
                                        <p style={{ color: 'var(--text-secondary)' }}>{h.desc}</p>
                                    </div>
                                </div>
                            </FadeIn>
                        ))}
                    </div>
                </div>
            </section>

            {/* ТЕХНОЛОГІЇ */}
            <section className="py-24 px-4">
                <div className="max-w-4xl mx-auto">
                    <FadeIn>
                        <h2 className="text-3xl sm:text-4xl font-black text-center mb-4">Технічний стек</h2>
                        <p className="text-center mb-16" style={{ color: 'var(--text-secondary)' }}>
                            Сучасні технології для надійної платформи
                        </p>
                    </FadeIn>
                    <FadeIn delay={100}>
                        <div className="flex flex-wrap gap-3 justify-center">
                            {TECH.map((t) => (
                                <span key={t.name}
                                      className="px-5 py-2.5 rounded-xl font-bold text-sm text-white"
                                      style={{ background: t.color }}>
                                    {t.name}
                                </span>
                            ))}
                        </div>
                    </FadeIn>
                </div>
            </section>

            {/* CTA */}
            <section className="py-24 px-4" style={{ background: 'var(--bg-secondary)' }}>
                <FadeIn>
                    <div className="max-w-2xl mx-auto text-center p-12 rounded-3xl border"
                         style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
                        <div className="text-5xl mb-4">🇺🇦</div>
                        <h2 className="text-3xl font-black mb-4">Долучайся до змін</h2>
                        <p className="mb-8" style={{ color: 'var(--text-secondary)' }}>
                            Кожен донат — це крок до перемоги. Разом ми сильніші.
                        </p>
                        <div className="flex gap-4 justify-center flex-wrap">
                            <Link href="/campaigns"
                                  className="px-8 py-3 rounded-xl font-bold text-white transition hover:opacity-90"
                                  style={{ background: 'var(--accent)' }}>
                                Підтримати збір
                            </Link>
                            <Link href="/register"
                                  className="px-8 py-3 rounded-xl font-bold transition hover:opacity-80 border"
                                  style={{ borderColor: 'var(--border)', color: 'var(--text-primary)' }}>
                                Зареєструватись
                            </Link>
                        </div>
                    </div>
                </FadeIn>
            </section>

        </div>
    );
}