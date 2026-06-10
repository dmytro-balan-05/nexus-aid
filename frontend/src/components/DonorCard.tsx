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
    selectedBadgeId: string | null;
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

type FrameRenderer = (ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, accent: string) => void;

const circle: FrameRenderer = (ctx, cx, cy, r, accent) => {
    ctx.strokeStyle = accent; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(cx, cy, r + 3, 0, Math.PI * 2); ctx.stroke();
};

const FRAME_RENDERERS: Record<string, FrameRenderer> = {
    frame_simple: circle,
    frame_double: (ctx, cx, cy, r, accent) => {
        ctx.strokeStyle = accent; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(cx, cy, r + 3, 0, Math.PI * 2); ctx.stroke();
        ctx.lineWidth = 1; ctx.strokeStyle = accent + '55';
        ctx.beginPath(); ctx.arc(cx, cy, r + 8, 0, Math.PI * 2); ctx.stroke();
    },
    frame_square: (ctx, cx, cy, r, accent) => {
        const s = r + 5; ctx.strokeStyle = accent; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.roundRect(cx - s, cy - s, s * 2, s * 2, 4); ctx.stroke();
    },
    frame_star: (ctx, cx, cy, r, accent) => {
        ctx.strokeStyle = accent; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(cx, cy, r + 3, 0, Math.PI * 2); ctx.stroke();
        ctx.strokeStyle = accent + '99'; ctx.lineWidth = 1.5;
        for (let i = 0; i < 8; i++) {
            const a = (i / 8) * Math.PI * 2 - Math.PI / 2;
            ctx.beginPath();
            ctx.moveTo(cx + Math.cos(a) * (r + 5), cy + Math.sin(a) * (r + 5));
            ctx.lineTo(cx + Math.cos(a) * (r + 13), cy + Math.sin(a) * (r + 13));
            ctx.stroke();
        }
    },
    frame_drone: (ctx, cx, cy, r, accent) => {
        const s = r + 5, cut = 8; ctx.strokeStyle = accent; ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cx - s + cut, cy - s); ctx.lineTo(cx + s - cut, cy - s);
        ctx.lineTo(cx + s, cy - s + cut); ctx.lineTo(cx + s, cy + s - cut);
        ctx.lineTo(cx + s - cut, cy + s); ctx.lineTo(cx - s + cut, cy + s);
        ctx.lineTo(cx - s, cy + s - cut); ctx.lineTo(cx - s, cy - s + cut);
        ctx.closePath(); ctx.stroke();
    },
    frame_wings: (ctx, cx, cy, r, accent) => {
        ctx.strokeStyle = accent; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(cx, cy, r + 3, 0, Math.PI * 2); ctx.stroke();
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(cx - r - 15, cy - 5); ctx.lineTo(cx - r - 3, cy - 5);
        ctx.moveTo(cx - r - 15, cy + 5); ctx.lineTo(cx - r - 3, cy + 5);
        ctx.moveTo(cx + r + 3, cy - 5); ctx.lineTo(cx + r + 15, cy - 5);
        ctx.moveTo(cx + r + 3, cy + 5); ctx.lineTo(cx + r + 15, cy + 5);
        ctx.stroke();
    },
    frame_shield: (ctx, cx, cy, r, accent) => {
        const s = r + 6; ctx.strokeStyle = accent; ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cx - s, cy - s); ctx.lineTo(cx + s, cy - s);
        ctx.lineTo(cx + s, cy + s * 0.3);
        ctx.quadraticCurveTo(cx + s, cy + s * 1.2, cx, cy + s * 1.4);
        ctx.quadraticCurveTo(cx - s, cy + s * 1.2, cx - s, cy + s * 0.3);
        ctx.closePath(); ctx.stroke();
    },
    frame_cross: (ctx, cx, cy, r, accent) => {
        ctx.strokeStyle = accent; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(cx, cy, r + 3, 0, Math.PI * 2); ctx.stroke();
        const d = r + 10, tick = 5;
        ctx.beginPath();
        ctx.moveTo(cx, cy - d); ctx.lineTo(cx, cy - d - tick);
        ctx.moveTo(cx, cy + d); ctx.lineTo(cx, cy + d + tick);
        ctx.moveTo(cx - d, cy); ctx.lineTo(cx - d - tick, cy);
        ctx.moveTo(cx + d, cy); ctx.lineTo(cx + d + tick, cy);
        ctx.stroke();
    },
    frame_medic: (ctx, cx, cy, r, accent) => {
        ctx.strokeStyle = accent; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(cx, cy, r + 3, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = accent;
        for (let i = 0; i < 8; i++) {
            const a = (i / 8) * Math.PI * 2;
            ctx.beginPath(); ctx.arc(cx + Math.cos(a) * (r + 9), cy + Math.sin(a) * (r + 9), 2, 0, Math.PI * 2); ctx.fill();
        }
    },
    frame_ambulance: (ctx, cx, cy, r, accent) => {
        const s = r + 4; ctx.strokeStyle = accent; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.roundRect(cx - s, cy - s, s * 2, s * 2, 8); ctx.stroke();
        ctx.lineWidth = 1; ctx.strokeStyle = accent + '44';
        ctx.beginPath(); ctx.roundRect(cx - s - 4, cy - s - 4, s * 2 + 8, s * 2 + 8, 10); ctx.stroke();
    },
    frame_hands: (ctx, cx, cy, r, accent) => {
        ctx.strokeStyle = accent; ctx.lineWidth = 2; ctx.setLineDash([4, 4]);
        ctx.beginPath(); ctx.arc(cx, cy, r + 5, 0, Math.PI * 2); ctx.stroke();
        ctx.setLineDash([]); ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(cx, cy, r + 2, 0, Math.PI * 2); ctx.stroke();
    },
    frame_heart: (ctx, cx, cy, r, accent) => {
        ctx.strokeStyle = accent; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(cx, cy, r + 3, 0, Math.PI * 2); ctx.stroke();
        const d = r + 11, ds = 4;
        [[0, -1], [1, 0], [0, 1], [-1, 0]].forEach(([dx, dy]) => {
            ctx.beginPath();
            ctx.moveTo(cx + dx * (d - ds), cy + dy * (d - ds));
            ctx.lineTo(cx + dx * d + dy * ds, cy + dy * d + dx * ds);
            ctx.lineTo(cx + dx * (d + ds), cy + dy * (d + ds));
            ctx.lineTo(cx + dx * d - dy * ds, cy + dy * d - dx * ds);
            ctx.closePath(); ctx.fillStyle = accent + '99'; ctx.fill();
        });
    },
    frame_pillar: (ctx, cx, cy, r, accent) => {
        const s = r + 5, corner = 10;
        ctx.strokeStyle = accent + '44'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.roundRect(cx - s, cy - s, s * 2, s * 2, 3); ctx.stroke();
        ctx.strokeStyle = accent; ctx.lineWidth = 3;
        [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(([sx, sy]) => {
            const x = cx + sx * s, y = cy + sy * s;
            ctx.beginPath();
            ctx.moveTo(x, y + sy * (-corner)); ctx.lineTo(x, y); ctx.lineTo(x + sx * (-corner), y);
            ctx.stroke();
        });
    },
    frame_diamond: (ctx, cx, cy, r, accent) => {
        const d = r + 8; ctx.strokeStyle = accent; ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cx, cy - d); ctx.lineTo(cx + d, cy);
        ctx.lineTo(cx, cy + d); ctx.lineTo(cx - d, cy);
        ctx.closePath(); ctx.stroke();
        ctx.strokeStyle = accent + '44'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(cx, cy, r + 2, 0, Math.PI * 2); ctx.stroke();
    },
    frame_crown: (ctx, cx, cy, r, accent) => {
        ctx.strokeStyle = accent; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(cx, cy, r + 3, 0, Math.PI * 2); ctx.stroke();
        const top = cy - r - 3;
        ctx.beginPath();
        ctx.moveTo(cx - r - 3, top + 8); ctx.lineTo(cx - r + 2, top);
        ctx.lineTo(cx - 6, top + 6); ctx.lineTo(cx, top - 4);
        ctx.lineTo(cx + 6, top + 6); ctx.lineTo(cx + r - 2, top);
        ctx.lineTo(cx + r + 3, top + 8); ctx.stroke();
    },
    frame_coin: (ctx, cx, cy, r, accent) => {
        ctx.strokeStyle = accent; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.arc(cx, cy, r + 4, 0, Math.PI * 2); ctx.stroke();
        ctx.strokeStyle = accent + '55'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(cx, cy, r + 8, 0, Math.PI * 2); ctx.stroke();
    },
    frame_fire: (ctx, cx, cy, r, accent) => {
        ctx.strokeStyle = accent; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(cx, cy, r + 3, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = accent + '88';
        for (let i = 0; i < 6; i++) {
            const a = (i / 6) * Math.PI * 2 - Math.PI / 2;
            const x1 = cx + Math.cos(a) * (r + 6), y1 = cy + Math.sin(a) * (r + 6);
            const x2 = cx + Math.cos(a + 0.3) * (r + 14), y2 = cy + Math.sin(a + 0.3) * (r + 14);
            const x3 = cx + Math.cos(a - 0.3) * (r + 14), y3 = cy + Math.sin(a - 0.3) * (r + 14);
            ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.lineTo(x3, y3); ctx.closePath(); ctx.fill();
        }
    },
    frame_explosion: (ctx, cx, cy, r, accent) => {
        ctx.strokeStyle = accent; ctx.lineWidth = 2;
        for (let i = 0; i < 12; i++) {
            const a = (i / 12) * Math.PI * 2;
            const r1 = i % 2 === 0 ? r + 4 : r + 10;
            const r2 = i % 2 === 0 ? r + 10 : r + 16;
            ctx.beginPath();
            ctx.moveTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1);
            ctx.lineTo(cx + Math.cos(a) * r2, cy + Math.sin(a) * r2);
            ctx.stroke();
        }
    },
    frame_stars: (ctx, cx, cy, r, accent) => {
        ctx.strokeStyle = accent; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(cx, cy, r + 3, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = accent;
        for (let i = 0; i < 5; i++) {
            const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
            ctx.beginPath(); ctx.arc(cx + Math.cos(a) * (r + 11), cy + Math.sin(a) * (r + 11), 3, 0, Math.PI * 2); ctx.fill();
        }
    },
    frame_medal: (ctx, cx, cy, r, accent) => {
        ctx.strokeStyle = accent; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(cx, cy, r + 4, 0, Math.PI * 2); ctx.stroke();
        ctx.strokeStyle = accent + '66'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(cx, cy, r + 9, 0, Math.PI * 2); ctx.stroke();
    },
    frame_hero: (ctx, cx, cy, r, accent) => {
        const s = r + 6;
        ctx.strokeStyle = accent; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.roundRect(cx - s, cy - s, s * 2, s * 2, 12); ctx.stroke();
        ctx.strokeStyle = accent + '55'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.roundRect(cx - s - 4, cy - s - 4, s * 2 + 8, s * 2 + 8, 14); ctx.stroke();
    },
    frame_gold: (ctx, cx, cy, r, accent) => {
        ctx.strokeStyle = accent; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.arc(cx, cy, r + 4, 0, Math.PI * 2); ctx.stroke();
        ctx.strokeStyle = '#ffffff44'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(cx, cy, r + 1, 0, Math.PI * 2); ctx.stroke();
    },
    frame_clover: (ctx, cx, cy, r, accent) => {
        ctx.strokeStyle = accent; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(cx, cy, r + 3, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = accent + '66';
        [[0, -1], [1, 0], [0, 1], [-1, 0]].forEach(([dx, dy]) => {
            ctx.beginPath(); ctx.arc(cx + dx * (r + 9), cy + dy * (r + 9), 4, 0, Math.PI * 2); ctx.fill();
        });
    },
    frame_mirror: (ctx, cx, cy, r, accent) => {
        ctx.strokeStyle = accent; ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
        ctx.beginPath(); ctx.arc(cx, cy, r + 6, 0, Math.PI * 2); ctx.stroke();
        ctx.setLineDash([]);
        ctx.strokeStyle = accent; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(cx, cy, r + 2, 0, Math.PI * 2); ctx.stroke();
    },
    frame_week: (ctx, cx, cy, r, accent) => {
        ctx.strokeStyle = accent; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(cx, cy, r + 3, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = accent;
        for (let i = 0; i < 7; i++) {
            const a = (i / 7) * Math.PI * 2 - Math.PI / 2;
            ctx.beginPath(); ctx.arc(cx + Math.cos(a) * (r + 10), cy + Math.sin(a) * (r + 10), 2.5, 0, Math.PI * 2); ctx.fill();
        }
    },
    frame_podium: (ctx, cx, cy, r, accent) => {
        ctx.strokeStyle = accent; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(cx, cy, r + 4, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = accent + '44';
        ctx.beginPath(); ctx.arc(cx, cy, r + 4, -Math.PI / 2, Math.PI / 6); ctx.lineTo(cx, cy); ctx.closePath(); ctx.fill();
    },
    frame_secret: (ctx, cx, cy, r, accent) => {
        ctx.strokeStyle = accent + '88'; ctx.lineWidth = 1; ctx.setLineDash([2, 4]);
        ctx.beginPath(); ctx.arc(cx, cy, r + 8, 0, Math.PI * 2); ctx.stroke();
        ctx.setLineDash([]); ctx.strokeStyle = accent; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(cx, cy, r + 3, 0, Math.PI * 2); ctx.stroke();
    },
    frame_emergency: (ctx, cx, cy, r, accent) => {
        const s = r + 5, cut = 6; ctx.strokeStyle = accent; ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(cx - s + cut, cy - s); ctx.lineTo(cx + s - cut, cy - s);
        ctx.lineTo(cx + s, cy - s + cut); ctx.lineTo(cx + s, cy + s - cut);
        ctx.lineTo(cx + s - cut, cy + s); ctx.lineTo(cx - s + cut, cy + s);
        ctx.lineTo(cx - s, cy + s - cut); ctx.lineTo(cx - s, cy - s + cut);
        ctx.closePath(); ctx.stroke();
        ctx.strokeStyle = accent + '44'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(cx, cy, r + 2, 0, Math.PI * 2); ctx.stroke();
    },
    frame_hourglass: (ctx, cx, cy, r, accent) => {
        const s = r + 5; ctx.strokeStyle = accent; ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cx - s, cy - s); ctx.lineTo(cx + s, cy - s);
        ctx.lineTo(cx, cy); ctx.lineTo(cx + s, cy + s);
        ctx.lineTo(cx - s, cy + s); ctx.lineTo(cx, cy);
        ctx.closePath(); ctx.stroke();
    },
    frame_seed: (ctx, cx, cy, r, accent) => {
        ctx.strokeStyle = accent; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(cx, cy, r + 3, 0, Math.PI * 2); ctx.stroke();
        ctx.strokeStyle = accent + '88'; ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(cx, cy - r - 3);
        ctx.bezierCurveTo(cx + 15, cy - r - 10, cx + 15, cy - r + 5, cx, cy - r + 10);
        ctx.stroke();
    },
    frame_megaphone: (ctx, cx, cy, r, accent) => {
        const s = r + 5; ctx.strokeStyle = accent; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.roundRect(cx - s, cy - s, s * 2, s * 2, 6); ctx.stroke();
        ctx.strokeStyle = accent + '55'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.roundRect(cx - s - 3, cy - s - 3, s * 2 + 6, s * 2 + 6, 8); ctx.stroke();
    },
    frame_funded: (ctx, cx, cy, r, accent) => {
        ctx.strokeStyle = accent; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(cx, cy, r + 3, 0, Math.PI * 2); ctx.stroke();
        ctx.strokeStyle = accent; ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cx - 8, cy + r + 8); ctx.lineTo(cx, cy + r + 4); ctx.lineTo(cx + 8, cy + r + 8);
        ctx.moveTo(cx - 8, cy - r - 4); ctx.lineTo(cx, cy - r - 8); ctx.lineTo(cx + 8, cy - r - 4);
        ctx.stroke();
    },
    frame_loyal: (ctx, cx, cy, r, accent) => {
        ctx.strokeStyle = accent; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(cx, cy, r + 4, 0, Math.PI * 2); ctx.stroke();
        ctx.strokeStyle = accent + '44'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(cx, cy, r + 8, 0, Math.PI * 2); ctx.stroke();
        ctx.beginPath(); ctx.arc(cx, cy, r + 1, 0, Math.PI * 2); ctx.stroke();
    },
    frame_marathon: (ctx, cx, cy, r, accent) => {
        ctx.strokeStyle = accent; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(cx, cy, r + 3, 0, Math.PI * 2); ctx.stroke();
        const dashLen = (2 * Math.PI * (r + 9)) / 16;
        ctx.strokeStyle = accent + '88'; ctx.lineWidth = 2;
        ctx.setLineDash([dashLen * 0.6, dashLen * 0.4]);
        ctx.beginPath(); ctx.arc(cx, cy, r + 9, 0, Math.PI * 2); ctx.stroke();
        ctx.setLineDash([]);
    },
    frame_phantom: (ctx, cx, cy, r, accent) => {
        ctx.strokeStyle = '#ffffff22'; ctx.lineWidth = 1; ctx.setLineDash([4, 4]);
        ctx.beginPath(); ctx.arc(cx, cy, r + 8, 0, Math.PI * 2); ctx.stroke();
        ctx.setLineDash([]); ctx.strokeStyle = '#ffffff55'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(cx, cy, r + 3, 0, Math.PI * 2); ctx.stroke();
    },
    frame_ukraine: (ctx, cx, cy, r, accent) => {
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#005BBB';
        ctx.beginPath(); ctx.arc(cx, cy, r + 4, Math.PI, Math.PI * 2); ctx.stroke();
        ctx.strokeStyle = '#FFD500';
        ctx.beginPath(); ctx.arc(cx, cy, r + 4, 0, Math.PI); ctx.stroke();
    },
    frame_sunflower: (ctx, cx, cy, r, accent) => {
        ctx.fillStyle = '#FFD500';
        for (let i = 0; i < 12; i++) {
            const a = (i / 12) * Math.PI * 2;
            ctx.beginPath();
            ctx.ellipse(cx + Math.cos(a) * (r + 9), cy + Math.sin(a) * (r + 9), 4, 7, a, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.strokeStyle = '#92400e'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(cx, cy, r + 3, 0, Math.PI * 2); ctx.stroke();
    },
    frame_moon: (ctx, cx, cy, r, accent) => {
        ctx.strokeStyle = accent; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(cx, cy, r + 3, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = accent + '33';
        ctx.beginPath(); ctx.arc(cx - r - 8, cy - r - 8, 5, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(cx + r + 6, cy - r - 4, 3, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(cx + r + 4, cy + r + 6, 4, 0, Math.PI * 2); ctx.fill();
    },
    frame_rainbow: (ctx, cx, cy, r, accent) => {
        const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6'];
        colors.forEach((c, i) => {
            ctx.strokeStyle = c; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.arc(cx, cy, r + 3 + i * 2.5, 0, Math.PI * 2); ctx.stroke();
        });
    },
    frame_butterfly: (ctx, cx, cy, r, accent) => {
        ctx.strokeStyle = accent; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(cx, cy, r + 3, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = accent + '55';
        ctx.beginPath(); ctx.ellipse(cx - r - 8, cy - 5, 8, 5, -0.3, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(cx + r + 8, cy - 5, 8, 5, 0.3, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(cx - r - 6, cy + 7, 6, 4, 0.3, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(cx + r + 6, cy + 7, 6, 4, -0.3, 0, Math.PI * 2); ctx.fill();
    },
    frame_sparkle: (ctx, cx, cy, r, accent) => {
        ctx.strokeStyle = accent; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(cx, cy, r + 3, 0, Math.PI * 2); ctx.stroke();
        ctx.strokeStyle = accent + '99'; ctx.lineWidth = 1.5;
        for (let i = 0; i < 4; i++) {
            const a = (i / 4) * Math.PI * 2;
            ctx.beginPath();
            ctx.moveTo(cx + Math.cos(a) * (r + 6), cy + Math.sin(a) * (r + 6));
            ctx.lineTo(cx + Math.cos(a) * (r + 16), cy + Math.sin(a) * (r + 16));
            ctx.stroke();
            const a2 = a + Math.PI / 4;
            ctx.beginPath();
            ctx.moveTo(cx + Math.cos(a2) * (r + 6), cy + Math.sin(a2) * (r + 6));
            ctx.lineTo(cx + Math.cos(a2) * (r + 11), cy + Math.sin(a2) * (r + 11));
            ctx.stroke();
        }
    },
    frame_perfect: (ctx, cx, cy, r, accent) => {
        const colors = [accent, accent + 'aa', accent + '55'];
        colors.forEach((c, i) => {
            ctx.strokeStyle = c; ctx.lineWidth = i === 0 ? 2 : 1;
            ctx.beginPath(); ctx.arc(cx, cy, r + 3 + i * 5, 0, Math.PI * 2); ctx.stroke();
        });
    },
    frame_elite: (ctx, cx, cy, r, accent) => {
        const s = r + 5;
        ctx.strokeStyle = accent; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.roundRect(cx - s, cy - s, s * 2, s * 2, 3); ctx.stroke();
        ctx.strokeStyle = accent + '88'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(cx, cy, r + 2, 0, Math.PI * 2); ctx.stroke();
        ctx.strokeStyle = accent + '44'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.roundRect(cx - s - 4, cy - s - 4, s * 2 + 8, s * 2 + 8, 5); ctx.stroke();
    },
    frame_trophy: (ctx, cx, cy, r, accent) => {
        ctx.strokeStyle = accent; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(cx, cy, r + 3, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = accent + '66';
        ctx.beginPath();
        ctx.moveTo(cx - 8, cy - r - 4); ctx.lineTo(cx + 8, cy - r - 4);
        ctx.lineTo(cx + 5, cy - r - 12); ctx.lineTo(cx, cy - r - 14);
        ctx.lineTo(cx - 5, cy - r - 12); ctx.closePath(); ctx.fill();
    },
    frame_champion: (ctx, cx, cy, r, accent) => {
        ctx.strokeStyle = accent; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(cx, cy, r + 4, 0, Math.PI * 2); ctx.stroke();
        ctx.strokeStyle = '#ffffff88'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(cx, cy, r + 7, -Math.PI * 0.8, -Math.PI * 0.2); ctx.stroke();
    },
    frame_paint:    circle,
    frame_check:    circle,
    frame_leaf:     (ctx, cx, cy, r, accent) => {
        ctx.strokeStyle = accent; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(cx, cy, r + 3, 0, Math.PI * 2); ctx.stroke();
        ctx.strokeStyle = accent + '88'; ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(cx, cy - r - 3);
        ctx.bezierCurveTo(cx + 12, cy - r - 12, cx + 12, cy - r + 4, cx, cy - r + 8);
        ctx.bezierCurveTo(cx - 12, cy - r + 4, cx - 12, cy - r - 12, cx, cy - r - 3);
        ctx.stroke();
    },
    frame_fashion:  (ctx, cx, cy, r, accent) => {
        const s = r + 5; ctx.strokeStyle = accent; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.roundRect(cx - s, cy - s, s * 2, s * 2, 16); ctx.stroke();
        ctx.strokeStyle = accent + '44'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.roundRect(cx - s - 3, cy - s - 3, s * 2 + 6, s * 2 + 6, 18); ctx.stroke();
    },
    frame_build:    (ctx, cx, cy, r, accent) => {
        const s = r + 5; ctx.strokeStyle = accent; ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cx - s, cy + s); ctx.lineTo(cx - s, cy - s);
        ctx.lineTo(cx, cy - s - 8); ctx.lineTo(cx + s, cy - s);
        ctx.lineTo(cx + s, cy + s); ctx.closePath(); ctx.stroke();
    },
};

async function applyBackground(ctx: CanvasRenderingContext2D, w: number, h: number, bg: string): Promise<void> {
    if (bg.startsWith('http') || bg.startsWith('/')) {
        await new Promise<void>((resolve) => {
            const img = new Image(); img.crossOrigin = 'anonymous';
            img.onload = () => { ctx.drawImage(img, 0, 0, w, h); resolve(); };
            img.onerror = () => { ctx.fillStyle = '#1a1207'; ctx.fillRect(0, 0, w, h); resolve(); };
            img.src = bg;
        });
    } else {
        if (bg.startsWith('linear-gradient')) {
            const match = bg.match(/#[0-9a-fA-F]{3,8}/g);
            if (match && match.length >= 2) {
                const grad = ctx.createLinearGradient(0, 0, w, h);
                grad.addColorStop(0, match[0]); grad.addColorStop(1, match[1]);
                ctx.fillStyle = grad;
            } else { ctx.fillStyle = '#111827'; }
        } else { ctx.fillStyle = bg; }
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
        grad.addColorStop(0, accent + '22'); grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.strokeStyle = accent + '18'; ctx.lineWidth = 0.5;
    for (let i = 0; i < 6; i++) {
        ctx.beginPath(); ctx.moveTo(w * 0.6 + i * 25, 0); ctx.lineTo(w * 0.3 + i * 15, h); ctx.stroke();
    }
    const topLine = ctx.createLinearGradient(0, 0, w, 0);
    topLine.addColorStop(0, 'transparent'); topLine.addColorStop(0.3, accent);
    topLine.addColorStop(0.7, accent); topLine.addColorStop(1, 'transparent');
    ctx.strokeStyle = topLine; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, 3); ctx.lineTo(w, 3); ctx.stroke();
    ctx.save();
    ctx.font = `bold ${h * 0.85}px Arial`;
    ctx.fillStyle = accent + '09'; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    ctx.fillText('NA', w + 30, h * 0.52); ctx.restore();
}

const DonorCard = forwardRef<DonorCardRef, Props>(({ userName, avatarUrl, profile, badges }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isGenerated, setIsGenerated] = useState(false);

    const level = profile?.level || 'bronze';
    const cfg = LEVEL_CONFIG[level];
    const W = 600, H = 340;

    const generate = async () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        setIsGenerating(true);
        const ctx = canvas.getContext('2d')!;
        canvas.width = W; canvas.height = H;

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

        const avatarSize = 64, ax = 40, ay = 36;
        const cx = ax + avatarSize / 2, cy = ay + avatarSize / 2;
        let avatarLoaded = false;

        if (avatarUrl) {
            try {
                const img = new Image(); img.crossOrigin = 'anonymous';
                await new Promise<void>((resolve) => {
                    img.onload = () => { avatarLoaded = true; resolve(); };
                    img.onerror = () => resolve();
                    setTimeout(resolve, 3000);
                    img.src = avatarUrl;
                });
                if (avatarLoaded) {
                    ctx.save();
                    ctx.beginPath(); ctx.arc(cx, cy, avatarSize / 2, 0, Math.PI * 2); ctx.clip();
                    ctx.drawImage(img, ax, ay, avatarSize, avatarSize); ctx.restore();
                }
            } catch {}
        }

        if (!avatarLoaded) {
            ctx.fillStyle = accentColor + '44';
            ctx.beginPath(); ctx.arc(cx, cy, avatarSize / 2, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = accentColor; ctx.font = `bold 28px ${fontFamily}`;
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText((userName[0] || '?').toUpperCase(), cx, cy);
            ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
        }

        const frameRenderer = FRAME_RENDERERS[selectedFrame] || FRAME_RENDERERS.frame_simple;
        frameRenderer(ctx, cx, cy, avatarSize / 2, accentColor);

        const selectedBadge = profile?.selectedBadgeId
            ? badges.find((b) => b.key === profile.selectedBadgeId || (b as any).id === profile.selectedBadgeId)
            : null;

        if (selectedBadge) {
            ctx.font = '28px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText(selectedBadge.icon, W - 50, 55);
            ctx.font = `bold 10px ${fontFamily}`; ctx.fillStyle = textMuted;
            ctx.textAlign = 'center';
            ctx.fillText(selectedBadge.name, W - 50, 76);
            ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
        }

        ctx.fillStyle = textColor; ctx.font = `bold 22px ${fontFamily}`;
        ctx.fillText(userName, 120, 62);

        ctx.font = `bold 11px ${fontFamily}`;
        const levelW = ctx.measureText(cfg.label).width + 20;
        ctx.fillStyle = accentColor + '33';
        ctx.beginPath(); ctx.roundRect(120, 70, levelW, 20, 10); ctx.fill();
        ctx.fillStyle = accentColor; ctx.fillText(cfg.label, 130, 84);

        const quote = profile?.quote || cfg.slogan;
        ctx.fillStyle = textMuted; ctx.font = `italic 13px ${fontFamily}`;
        ctx.fillText(`"${quote}"`, 40, 138);

        ctx.strokeStyle = dividerColor; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(40, 152); ctx.lineTo(W - 40, 152); ctx.stroke();

        ctx.fillStyle = accentColor; ctx.font = `bold 26px ${fontFamily}`;
        ctx.fillText(`${(profile?.totalAmount || 0).toLocaleString()} ₴`, 40, 196);
        ctx.fillStyle = textMuted; ctx.font = `11px ${fontFamily}`;
        ctx.fillText('задоначено', 40, 214);

        ctx.fillStyle = accentColor; ctx.font = `bold 26px ${fontFamily}`;
        ctx.fillText(String(profile?.donationCount || 0), 240, 196);
        ctx.fillStyle = textMuted; ctx.font = `11px ${fontFamily}`;
        ctx.fillText('донатів', 240, 214);

        if (badges.length > 0) {
            ctx.fillStyle = textMuted; ctx.font = `bold 10px ${fontFamily}`;
            ctx.fillText('ДОСЯГНЕННЯ', 40, 244);
            ctx.font = '22px Arial';
            badges.slice(0, 9).forEach((badge, i) => { ctx.fillText(badge.icon, 40 + i * 30, 272); });
            if (badges.length > 9) {
                ctx.fillStyle = textMuted; ctx.font = `11px ${fontFamily}`;
                ctx.fillText(`+${badges.length - 9}`, 40 + 9 * 30, 272);
            }
        }

        ctx.fillStyle = accentColor; ctx.font = `bold 13px ${fontFamily}`;
        ctx.fillText('NEXUS', 40, H - 18);
        ctx.fillStyle = textMuted;
        ctx.fillText('AID', 40 + ctx.measureText('NEXUS').width, H - 18);
        ctx.fillStyle = isLight ? '#00000025' : '#ffffff25'; ctx.font = `11px ${fontFamily}`;
        ctx.fillText('nexusaid.com', W - 115, H - 18);

        setIsGenerating(false); setIsGenerated(true);
    };

    useImperativeHandle(ref, () => ({ generate }));

    const download = () => {
        const canvas = canvasRef.current; if (!canvas) return;
        const link = document.createElement('a');
        link.download = `nexusaid-${userName}.png`;
        link.href = canvas.toDataURL('image/png'); link.click();
    };

    return (
        <div className="space-y-4">
            <canvas
                ref={canvasRef}
                className={`w-full rounded-2xl border border-gray-200 ${!isGenerated ? 'hidden' : ''}`}
                style={{ aspectRatio: `${W}/${H}` }}
            />
            {!isGenerated && (
                <div className="w-full bg-gray-900 rounded-2xl border border-gray-200 flex items-center justify-center" style={{ aspectRatio: `${W}/${H}` }}>
                    <p className="text-gray-500 text-sm">Натисни кнопку щоб згенерувати картку</p>
                </div>
            )}
            <div className="flex gap-2">
                <button onClick={generate} disabled={isGenerating} className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-xl text-sm font-bold hover:border-black hover:text-black transition disabled:opacity-50">
                    {isGenerating ? 'Генерація...' : '🔄 Згенерувати'}
                </button>
                {isGenerated && (
                    <button onClick={download} className="flex-1 bg-black text-white py-2 rounded-xl text-sm font-bold hover:bg-gray-800 transition">
                        ⬇ Завантажити
                    </button>
                )}
            </div>
        </div>
    );
});

DonorCard.displayName = 'DonorCard';
export default DonorCard;