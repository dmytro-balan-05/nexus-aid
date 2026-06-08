'use client';

import { useRef, useState, forwardRef, useImperativeHandle } from 'react';

interface Badge {
    key: string;
    name: string;
    icon: string;
    category: string;
    unlocksBackground: string | null;
    unlocksFrame: string | null;
    unlocksFont: string | null;
    description: string;
}

interface DonorProfile {
    level: 'bronze' | 'silver' | 'gold' | 'platinum';
    totalAmount: number;
    donationCount: number;
    selectedFrame: string | null;
    selectedBackground: string | null;
    selectedFont: string | null;
    quote: string | null;
}

interface Props {
    userName: string;
    avatarUrl: string;
    profile: DonorProfile | null;
    badges: Badge[];
}

export interface DonorCardRef {
    generate: () => Promise<void>;
}

const LEVEL_CONFIG = {
    bronze:   { label: 'Bronze',   accent: '#cd7f32', bg: '#1a1207', slogan: 'Кожна гривня — це крок до перемоги' },
    silver:   { label: 'Silver',   accent: '#a8b2c1', bg: '#0f1318', slogan: 'Твоя підтримка змінює долі' },
    gold:     { label: 'Gold',     accent: '#ffd700', bg: '#12100a', slogan: 'Золоте серце — золота країна' },
    platinum: { label: 'Platinum', accent: '#e2e8f0', bg: '#0a0a0f', slogan: 'Легенда, що творить історію' },
};

const FONT_MAP: Record<string, string> = {
    font_default:  'Arial, sans-serif',
    font_bold:     'Georgia, serif',
    font_elegant:  'Palatino Linotype, Palatino, serif',
    font_military: 'Courier New, monospace',
};

const FRAME_RENDERERS: Record<string, (ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, accent: string) => void> = {
    frame_simple: (ctx, cx, cy, r, accent) => {
        ctx.strokeStyle = accent;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(cx, cy, r + 3, 0, Math.PI * 2);
        ctx.stroke();
    },
    frame_double: (ctx, cx, cy, r, accent) => {
        ctx.strokeStyle = accent;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cx, cy, r + 3, 0, Math.PI * 2);
        ctx.stroke();
        ctx.lineWidth = 1;
        ctx.strokeStyle = accent + '55';
        ctx.beginPath();
        ctx.arc(cx, cy, r + 8, 0, Math.PI * 2);
        ctx.stroke();
    },
    frame_square: (ctx, cx, cy, r, accent) => {
        const s = r + 5;
        ctx.strokeStyle = accent;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(cx - s, cy - s, s * 2, s * 2, 4);
        ctx.stroke();
    },
    frame_star: (ctx, cx, cy, r, accent) => {
        ctx.strokeStyle = accent;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cx, cy, r + 3, 0, Math.PI * 2);
        ctx.stroke();
        ctx.strokeStyle = accent + '99';
        ctx.lineWidth = 1.5;
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2 - Math.PI / 2;
            ctx.beginPath();
            ctx.moveTo(cx + Math.cos(angle) * (r + 5), cy + Math.sin(angle) * (r + 5));
            ctx.lineTo(cx + Math.cos(angle) * (r + 13), cy + Math.sin(angle) * (r + 13));
            ctx.stroke();
        }
    },
    frame_drone: (ctx, cx, cy, r, accent) => {
        // Квадрат з зрізаними кутами (тактичний стиль)
        const s = r + 5;
        const cut = 8;
        ctx.strokeStyle = accent;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cx - s + cut, cy - s);
        ctx.lineTo(cx + s - cut, cy - s);
        ctx.lineTo(cx + s, cy - s + cut);
        ctx.lineTo(cx + s, cy + s - cut);
        ctx.lineTo(cx + s - cut, cy + s);
        ctx.lineTo(cx - s + cut, cy + s);
        ctx.lineTo(cx - s, cy + s - cut);
        ctx.lineTo(cx - s, cy - s + cut);
        ctx.closePath();
        ctx.stroke();
    },
    frame_wings: (ctx, cx, cy, r, accent) => {
        // Коло + горизонтальні лінії по боках
        ctx.strokeStyle = accent;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cx, cy, r + 3, 0, Math.PI * 2);
        ctx.stroke();
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(cx - r - 15, cy - 5);
        ctx.lineTo(cx - r - 3, cy - 5);
        ctx.moveTo(cx - r - 15, cy + 5);
        ctx.lineTo(cx - r - 3, cy + 5);
        ctx.moveTo(cx + r + 3, cy - 5);
        ctx.lineTo(cx + r + 15, cy - 5);
        ctx.moveTo(cx + r + 3, cy + 5);
        ctx.lineTo(cx + r + 15, cy + 5);
        ctx.stroke();
    },
    frame_shield: (ctx, cx, cy, r, accent) => {
        // Форма щита
        const s = r + 6;
        ctx.strokeStyle = accent;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cx - s, cy - s);
        ctx.lineTo(cx + s, cy - s);
        ctx.lineTo(cx + s, cy + s * 0.3);
        ctx.quadraticCurveTo(cx + s, cy + s * 1.2, cx, cy + s * 1.4);
        ctx.quadraticCurveTo(cx - s, cy + s * 1.2, cx - s, cy + s * 0.3);
        ctx.closePath();
        ctx.stroke();
    },
    frame_cross: (ctx, cx, cy, r, accent) => {
        // Коло з хрестом зовні
        ctx.strokeStyle = accent;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cx, cy, r + 3, 0, Math.PI * 2);
        ctx.stroke();
        ctx.lineWidth = 2;
        const d = r + 10;
        const tick = 5;
        ctx.beginPath();
        ctx.moveTo(cx, cy - d); ctx.lineTo(cx, cy - d - tick);
        ctx.moveTo(cx, cy + d); ctx.lineTo(cx, cy + d + tick);
        ctx.moveTo(cx - d, cy); ctx.lineTo(cx - d - tick, cy);
        ctx.moveTo(cx + d, cy); ctx.lineTo(cx + d + tick, cy);
        ctx.stroke();
    },
    frame_medic: (ctx, cx, cy, r, accent) => {
        // Подвійне коло з крапками
        ctx.strokeStyle = accent;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cx, cy, r + 3, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = accent;
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            ctx.beginPath();
            ctx.arc(cx + Math.cos(angle) * (r + 9), cy + Math.sin(angle) * (r + 9), 2, 0, Math.PI * 2);
            ctx.fill();
        }
    },
    frame_ambulance: (ctx, cx, cy, r, accent) => {
        const s = r + 4;
        ctx.strokeStyle = accent;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.roundRect(cx - s, cy - s, s * 2, s * 2, 8);
        ctx.stroke();
        ctx.lineWidth = 1;
        ctx.strokeStyle = accent + '44';
        ctx.beginPath();
        ctx.roundRect(cx - s - 4, cy - s - 4, s * 2 + 8, s * 2 + 8, 10);
        ctx.stroke();
    },
    frame_hands: (ctx, cx, cy, r, accent) => {
        ctx.strokeStyle = accent;
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.arc(cx, cy, r + 5, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(cx, cy, r + 2, 0, Math.PI * 2);
        ctx.stroke();
    },
    frame_heart: (ctx, cx, cy, r, accent) => {
        ctx.strokeStyle = accent;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cx, cy, r + 3, 0, Math.PI * 2);
        ctx.stroke();
        const d = r + 11;
        const ds = 4;
        [[0, -1], [1, 0], [0, 1], [-1, 0]].forEach(([dx, dy]) => {
            ctx.beginPath();
            ctx.moveTo(cx + dx * (d - ds), cy + dy * (d - ds));
            ctx.lineTo(cx + dx * d + dy * ds, cy + dy * d + dx * ds);
            ctx.lineTo(cx + dx * (d + ds), cy + dy * (d + ds));
            ctx.lineTo(cx + dx * d - dy * ds, cy + dy * d - dx * ds);
            ctx.closePath();
            ctx.fillStyle = accent + '99';
            ctx.fill();
        });
    },
    frame_pillar: (ctx, cx, cy, r, accent) => {
        const s = r + 5;
        const corner = 10;
        ctx.strokeStyle = accent + '44';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(cx - s, cy - s, s * 2, s * 2, 3);
        ctx.stroke();
        ctx.strokeStyle = accent;
        ctx.lineWidth = 3;
        [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(([sx, sy]) => {
            const x = cx + sx * s;
            const y = cy + sy * s;
            ctx.beginPath();
            ctx.moveTo(x, y + sy * (-corner));
            ctx.lineTo(x, y);
            ctx.lineTo(x + sx * (-corner), y);
            ctx.stroke();
        });
    },
    frame_diamond: (ctx, cx, cy, r, accent) => {
        const d = r + 8;
        ctx.strokeStyle = accent;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cx, cy - d);
        ctx.lineTo(cx + d, cy);
        ctx.lineTo(cx, cy + d);
        ctx.lineTo(cx - d, cy);
        ctx.closePath();
        ctx.stroke();
        ctx.strokeStyle = accent + '44';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(cx, cy, r + 2, 0, Math.PI * 2);
        ctx.stroke();
    },
    frame_crown: (ctx, cx, cy, r, accent) => {
        ctx.strokeStyle = accent;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cx, cy, r + 3, 0, Math.PI * 2);
        ctx.stroke();
        const top = cy - r - 3;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cx - r - 3, top + 8);
        ctx.lineTo(cx - r + 2, top);
        ctx.lineTo(cx - 6, top + 6);
        ctx.lineTo(cx, top - 4);
        ctx.lineTo(cx + 6, top + 6);
        ctx.lineTo(cx + r - 2, top);
        ctx.lineTo(cx + r + 3, top + 8);
        ctx.stroke();
    },
};
async function applyBackground(ctx: CanvasRenderingContext2D, w: number, h: number, bg: string): Promise<void> {
    if (bg.startsWith('http') || bg.startsWith('/')) {
        await new Promise<void>((resolve) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => { ctx.drawImage(img, 0, 0, w, h); resolve(); };
            img.onerror = () => { ctx.fillStyle = '#1a1207'; ctx.fillRect(0, 0, w, h); resolve(); };
            img.src = bg;
        });
    } else {
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, w, h);
    }
}

function isLightColor(hex: string): boolean {
    const c = hex.replace('#', '');
    if (c.length !== 6) return false;
    const r = parseInt(c.substring(0, 2), 16);
    const g = parseInt(c.substring(2, 4), 16);
    const b = parseInt(c.substring(4, 6), 16);
    return (r * 299 + g * 587 + b * 114) / 1000 > 128;
}

function drawAbstractBg(ctx: CanvasRenderingContext2D, w: number, h: number, accent: string) {
    for (let i = 0; i < 5; i++) {
        const x = (w / 4) * i + Math.sin(i * 1.3) * 40;
        const y = h * 0.3 + Math.cos(i * 0.9) * 60;
        const r = 60 + i * 30;
        const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
        grad.addColorStop(0, accent + '22');
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.strokeStyle = accent + '18';
    ctx.lineWidth = 0.5;
    for (let i = 0; i < 6; i++) {
        ctx.beginPath();
        ctx.moveTo(w * 0.6 + i * 25, 0);
        ctx.lineTo(w * 0.3 + i * 15, h);
        ctx.stroke();
    }

    const topLine = ctx.createLinearGradient(0, 0, w, 0);
    topLine.addColorStop(0, 'transparent');
    topLine.addColorStop(0.3, accent);
    topLine.addColorStop(0.7, accent);
    topLine.addColorStop(1, 'transparent');
    ctx.strokeStyle = topLine;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 3);
    ctx.lineTo(w, 3);
    ctx.stroke();

    ctx.save();
    ctx.font = `bold ${h * 0.85}px Arial`;
    ctx.fillStyle = accent + '09';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText('NA', w + 30, h * 0.52);
    ctx.restore();
}

const DonorCard = forwardRef<DonorCardRef, Props>(({ userName, avatarUrl, profile, badges }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isGenerated, setIsGenerated] = useState(false);

    const level = profile?.level || 'bronze';
    const cfg = LEVEL_CONFIG[level];
    const W = 600;
    const H = 340;

    const generate = async () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        setIsGenerating(true);

        const ctx = canvas.getContext('2d')!;
        canvas.width = W;
        canvas.height = H;

        const bgValue = profile?.selectedBackground || cfg.bg;
        const fontFamily = FONT_MAP[profile?.selectedFont || 'font_default'];
        const selectedFrame = profile?.selectedFrame || 'frame_simple';

        const bgForCheck = bgValue.startsWith('#') ? bgValue : cfg.bg;
        const isLight = isLightColor(bgForCheck);
        const accentColor = isLight ? '#1a1a1a' : cfg.accent;
        const textColor = isLight ? '#111111' : '#ffffff';
        const textMuted = isLight ? '#555555' : '#ffffff99';
        const dividerColor = isLight ? '#00000015' : '#ffffff15';

        await applyBackground(ctx, W, H, bgValue);
        drawAbstractBg(ctx, W, H, accentColor);

        const avatarSize = 64;
        const ax = 40;
        const ay = 36;
        const cx = ax + avatarSize / 2;
        const cy = ay + avatarSize / 2;
        let avatarLoaded = false;

        if (avatarUrl && !avatarUrl.includes('ui-avatars.com')) {
            try {
                const img = new Image();
                img.crossOrigin = 'anonymous';
                await new Promise<void>((resolve) => {
                    img.onload = () => { avatarLoaded = true; resolve(); };
                    img.onerror = () => resolve();
                    setTimeout(resolve, 3000);
                    img.src = avatarUrl;
                });
                if (avatarLoaded) {
                    ctx.save();
                    ctx.beginPath();
                    ctx.arc(cx, cy, avatarSize / 2, 0, Math.PI * 2);
                    ctx.clip();
                    ctx.drawImage(img, ax, ay, avatarSize, avatarSize);
                    ctx.restore();
                }
            } catch {}
        }

        if (!avatarLoaded) {
            ctx.fillStyle = accentColor + '44';
            ctx.beginPath();
            ctx.arc(cx, cy, avatarSize / 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = accentColor;
            ctx.font = `bold 28px ${fontFamily}`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText((userName[0] || '?').toUpperCase(), cx, cy);
            ctx.textAlign = 'left';
            ctx.textBaseline = 'alphabetic';
        }

        const frameRenderer = FRAME_RENDERERS[selectedFrame] || FRAME_RENDERERS.frame_simple;
        frameRenderer(ctx, cx, cy, avatarSize / 2, accentColor);

        ctx.fillStyle = textColor;
        ctx.font = `bold 22px ${fontFamily}`;
        ctx.fillText(userName, 120, 62);

        ctx.font = `bold 11px ${fontFamily}`;
        const levelW = ctx.measureText(cfg.label).width + 20;
        ctx.fillStyle = accentColor + '33';
        ctx.beginPath();
        ctx.roundRect(120, 70, levelW, 20, 10);
        ctx.fill();
        ctx.fillStyle = accentColor;
        ctx.fillText(cfg.label, 130, 84);

        const quote = profile?.quote || cfg.slogan;
        ctx.fillStyle = textMuted;
        ctx.font = `italic 13px ${fontFamily}`;
        ctx.fillText(`"${quote}"`, 40, 138);

        ctx.strokeStyle = dividerColor;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(40, 152);
        ctx.lineTo(W - 40, 152);
        ctx.stroke();

        ctx.fillStyle = accentColor;
        ctx.font = `bold 26px ${fontFamily}`;
        ctx.fillText(`${(profile?.totalAmount || 0).toLocaleString()} ₴`, 40, 196);
        ctx.fillStyle = textMuted;
        ctx.font = `11px ${fontFamily}`;
        ctx.fillText('задоначено', 40, 214);

        ctx.fillStyle = accentColor;
        ctx.font = `bold 26px ${fontFamily}`;
        ctx.fillText(String(profile?.donationCount || 0), 240, 196);
        ctx.fillStyle = textMuted;
        ctx.font = `11px ${fontFamily}`;
        ctx.fillText('донатів', 240, 214);

        if (badges.length > 0) {
            ctx.fillStyle = textMuted;
            ctx.font = `bold 10px ${fontFamily}`;
            ctx.fillText('ДОСЯГНЕННЯ', 40, 244);
            ctx.font = '22px Arial';
            badges.slice(0, 9).forEach((badge, i) => {
                ctx.fillText(badge.icon, 40 + i * 30, 272);
            });
            if (badges.length > 9) {
                ctx.fillStyle = textMuted;
                ctx.font = `11px ${fontFamily}`;
                ctx.fillText(`+${badges.length - 9}`, 40 + 9 * 30, 272);
            }
        }

        ctx.fillStyle = accentColor;
        ctx.font = `bold 13px ${fontFamily}`;
        ctx.fillText('NEXUS', 40, H - 18);
        ctx.fillStyle = textMuted;
        ctx.fillText('AID', 40 + ctx.measureText('NEXUS').width, H - 18);
        ctx.fillStyle = isLight ? '#00000025' : '#ffffff25';
        ctx.font = `11px ${fontFamily}`;
        ctx.fillText('nexusaid.com', W - 115, H - 18);

        setIsGenerating(false);
        setIsGenerated(true);
    };

    useImperativeHandle(ref, () => ({ generate }));

    const download = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const link = document.createElement('a');
        link.download = `nexusaid-${userName}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    };

    return (
        <div className="space-y-4">
            <canvas
                ref={canvasRef}
                className={`w-full rounded-2xl border border-gray-200 ${!isGenerated ? 'hidden' : ''}`}
                style={{ aspectRatio: `${W}/${H}` }}
            />
            {!isGenerated && (
                <div
                    className="w-full bg-gray-900 rounded-2xl border border-gray-200 flex items-center justify-center"
                    style={{ aspectRatio: `${W}/${H}` }}
                >
                    <p className="text-gray-500 text-sm">Натисни кнопку щоб згенерувати картку</p>
                </div>
            )}
            <div className="flex gap-2">
                <button
                    onClick={generate}
                    disabled={isGenerating}
                    className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-xl text-sm font-bold hover:border-black hover:text-black transition disabled:opacity-50"
                >
                    {isGenerating ? 'Генерація...' : '🔄 Згенерувати'}
                </button>
                {isGenerated && (
                    <button
                        onClick={download}
                        className="flex-1 bg-black text-white py-2 rounded-xl text-sm font-bold hover:bg-gray-800 transition"
                    >
                        ⬇ Завантажити
                    </button>
                )}
            </div>
        </div>
    );
});

DonorCard.displayName = 'DonorCard';
export default DonorCard;