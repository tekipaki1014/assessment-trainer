"use client";

import React, { useState, useMemo } from 'react';
import {
    Briefcase,
    CheckCircle2,
    Activity,
    Award,
    RotateCcw,
    LucideIcon,
    ChevronRight,
    Stethoscope,
    Target
} from 'lucide-react';
import {
    Client,
    Session,
    AssessmentItem,
} from '@/types';
import { ASSESSMENT_ITEMS, CATEGORIES, getRecommendedAssessments } from '@/lib/engines';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

// --- Mock Data for Initial Case ---
const MOCK_CASE = {
    client: {
        id: 'c1',
        name: '田中 健一',
        age: 42,
        sex: 'male',
        mainComplaint: 'back',
    } as Client,
    session: {
        availableTime: '30min',
        purpose: 'cause_exploration',
        goal: 'work_comfort',
        painNarrative: '長時間のデスクワーク後に腰の中央が重くなる。朝起き抜けも少し痛むが、動いていると楽になる。',
        impactOnLife: 6,
    } as Partial<Session>
};

// --- Components ---

const Card = ({ children, title, icon: Icon, className, description }: { children: React.ReactNode, title: string, icon: LucideIcon, className?: string, description?: string }) => (
    <div className={cn("bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden transition-all", className)}>
        <div className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100 px-8 py-6">
            <div className="flex items-center gap-3 mb-1">
                <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                    <Icon className="w-5 h-5" />
                </div>
                <h2 className="font-bold text-slate-800 text-lg">{title}</h2>
            </div>
            {description && <p className="text-sm text-slate-500 pl-[3.25rem]">{description}</p>}
        </div>
        <div className="p-8">{children}</div>
    </div>
);

const Button = ({
    children,
    onClick,
    variant = 'primary',
    className,
    disabled
}: {
    children: React.ReactNode,
    onClick?: () => void,
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'success',
    className?: string,
    disabled?: boolean
}) => {
    const variants = {
        primary: "bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200 shadow-lg hover:shadow-xl",
        secondary: "bg-slate-800 text-white hover:bg-slate-900 shadow-slate-200",
        outline: "border-2 border-slate-200 text-slate-600 hover:border-blue-500 hover:text-blue-600",
        ghost: "text-slate-500 hover:text-slate-900 hover:bg-slate-50",
        success: "bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-200 shadow-lg hover:shadow-xl"
    };

    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={cn(
                "px-6 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:active:scale-100 disabled:shadow-none",
                variants[variant],
                className
            )}
        >
            {children}
        </button>
    );
};

// --- Main Flow Component ---

export default function TrainerFlow() {
    const [step, setStep] = useState<'case' | 'selection' | 'result'>('case');
    const [selectedItems, setSelectedItems] = useState<string[]>([]);

    // Calculate Correct Logic
    const correctLogic = useMemo(() => {
        return getRecommendedAssessments(
            MOCK_CASE.session.availableTime as any,
            MOCK_CASE.client.mainComplaint,
            MOCK_CASE.session.purpose as any,
            MOCK_CASE.session.painNarrative || '',
            MOCK_CASE.session.goal as any
        );
    }, []);

    const mustItems = correctLogic.filter(r => r.priority === 'must').map(r => r.item.id);
    const recommendedItems = correctLogic.filter(r => r.priority === 'recommended').map(r => r.item.id);

    const handleToggleItem = (id: string) => {
        setSelectedItems(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const calculateScore = () => {
        let score = 0;
        let maxScore = 0;

        // Scoring Rules:
        // MUST: +10 pts
        // Recommended: +5 pts
        // Optional: +1 pt
        // Wrong choice (not in recommendation): -2 pts (mild penalty)

        // Calculate Max Possible Score
        mustItems.forEach(() => maxScore += 10);
        recommendedItems.forEach(() => maxScore += 5);

        // Calculate User Score
        selectedItems.forEach(id => {
            const recommendation = correctLogic.find(r => r.item.id === id);
            if (recommendation) {
                if (recommendation.priority === 'must') score += 10;
                else if (recommendation.priority === 'recommended') score += 5;
                else score += 1;
            } else {
                score -= 2;
            }
        });

        // Normalize to 100
        const normalized = Math.max(0, Math.min(100, Math.round((score / maxScore) * 100)));
        return normalized;
    };

    const score = calculateScore();

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
            {/* Header */}
            <div className="flex justify-between items-end pb-6 border-b border-slate-200">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <Stethoscope className="w-8 h-8 text-blue-600" />
                        Assessment Trainer
                    </h1>
                    <p className="text-slate-500 font-bold mt-1">臨床推論トレーニング - 評価項目の選定 -</p>
                </div>
                <div className="flex gap-2">
                    {['case', 'selection', 'result'].map((s, i) => (
                        <div key={s} className={cn(
                            "h-2 w-12 rounded-full transition-all",
                            s === step ? "bg-blue-600" : ["case", "selection", "result"].indexOf(step) > i ? "bg-blue-200" : "bg-slate-100"
                        )} />
                    ))}
                </div>
            </div>

            {/* CASE STUDY PHASE */}
            {step === 'case' && (
                <div className="space-y-6">
                    <Card title="症例データ" icon={Briefcase} description="以下のクライアント情報から、限られた時間内で優先して行うべき身体評価を選定してください。">
                        <div className="grid md:grid-cols-2 gap-8">
                            {/* Basic Info */}
                            <div className="p-5 bg-slate-50 rounded-2xl space-y-4">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Client</span>
                                        <p className="text-xl font-bold text-slate-900">{MOCK_CASE.client.name}</p>
                                        <p className="text-slate-500 font-medium">{MOCK_CASE.client.age}歳 / {MOCK_CASE.client.sex === 'male' ? '男性' : '女性'}</p>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Complaint</span>
                                        <p className="text-lg font-bold text-blue-600">{MOCK_CASE.client.mainComplaint === 'back' ? '腰痛' : '肩こり'}</p>
                                    </div>
                                </div>
                                <div className="pt-4 border-t border-slate-200">
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Setting</span>
                                    <div className="flex gap-2 mt-2">
                                        <span className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-600">
                                            ⏱ {MOCK_CASE.session.availableTime}
                                        </span>
                                        <span className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-600">
                                            🎯 {MOCK_CASE.session.purpose === 'cause_exploration' ? '原因探索' : 'スクリーニング'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Narrative & Goal */}
                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
                                        <Activity className="w-4 h-4 text-slate-400" />
                                        主訴・現病歴
                                    </h3>
                                    <div className="p-4 bg-white border-l-4 border-blue-500 shadow-sm rounded-r-xl">
                                        <p className="text-slate-700 font-medium leading-relaxed">
                                            "{MOCK_CASE.session.painNarrative}"
                                        </p>
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
                                        <Target className="w-4 h-4 text-slate-400" />
                                        目標 (Goal)
                                    </h3>
                                    <div className="flex flex-wrap gap-2">
                                        <span className="px-4 py-2 bg-emerald-50 text-emerald-700 rounded-full text-sm font-bold border border-emerald-100">
                                            仕事を快適に
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>

                    <div className="flex justify-end">
                        <Button onClick={() => setStep('selection')} className="w-full md:w-auto shadow-xl">
                            評価選定へ進む <ChevronRight className="w-5 h-5" />
                        </Button>
                    </div>
                </div>
            )}

            {/* SELECTION PHASE */}
            {step === 'selection' && (
                <div className="space-y-6">
                    <Card title="評価項目を選択" icon={Stethoscope} description="このケースで重要度が高いと判断される評価項目を選択してください（複数選択可）。">
                        <div className="space-y-8">
                            {CATEGORIES.map(category => {
                                const items = Object.values(ASSESSMENT_ITEMS).filter(i => i.category === category);
                                if (items.length === 0) return null;

                                return (
                                    <div key={category} className="space-y-3">
                                        <h3 className="text-sm font-black text-slate-400 uppercase tracking-wider pl-2">{category}</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            {items.map(item => {
                                                const isSelected = selectedItems.includes(item.id);
                                                return (
                                                    <button
                                                        key={item.id}
                                                        onClick={() => handleToggleItem(item.id)}
                                                        className={cn(
                                                            "flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-200 text-left group",
                                                            isSelected
                                                                ? "border-blue-500 bg-blue-50/50 shadow-md ring-2 ring-blue-500/20"
                                                                : "border-slate-100 bg-white hover:border-blue-300 hover:shadow-sm"
                                                        )}
                                                    >
                                                        <span className={cn("font-bold transition-colors", isSelected ? "text-blue-700" : "text-slate-700")}>
                                                            {item.name}
                                                        </span>
                                                        <div className={cn(
                                                            "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                                                            isSelected ? "bg-blue-500 border-blue-500" : "border-slate-200 bg-slate-50 group-hover:border-blue-300"
                                                        )}>
                                                            {isSelected && <CheckCircle2 className="w-4 h-4 text-white" />}
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </Card>

                    <div className="flex justify-between gap-4 pt-4">
                        <Button variant="ghost" onClick={() => setStep('case')}>
                            症例確認に戻る
                        </Button>
                        <div className="flex items-center gap-4">
                            <span className="text-sm font-bold text-slate-400">
                                {selectedItems.length} 項目選択中
                            </span>
                            <Button onClick={() => setStep('result')} variant="success" disabled={selectedItems.length === 0}>
                                回答を決定する <Award className="w-5 h-5" />
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* RESULT PHASE */}
            {step === 'result' && (
                <div className="space-y-8">
                    {/* Score Header */}
                    <div className="bg-slate-900 text-white rounded-3xl p-8 shadow-2xl relative overflow-hidden text-center">
                        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-blue-500/20 to-transparent pointer-events-none" />
                        <p className="text-blue-300 font-bold uppercase tracking-widest text-sm mb-2">Total Score</p>
                        <div className="flex items-baseline justify-center gap-2 mb-4">
                            <span className="text-7xl font-black tracking-tighter">{score}</span>
                            <span className="text-2xl text-slate-400 font-medium">/ 100</span>
                        </div>
                        <p className="font-medium text-slate-300">
                            {score >= 80 ? '素晴らしい臨床推論です！' : score >= 60 ? '概ね正しい判断ですが、優先順位を見直しましょう。' : '基礎的な評価項目の見落としがあります。'}
                        </p>
                    </div>

                    <Card title="推論プロセスフィードバック" icon={Award}>
                        <div className="space-y-8">
                            {/* MUST ITEMS */}
                            <div className="space-y-4">
                                <h3 className="flex items-center gap-2 font-black text-red-500 uppercase tracking-widest text-sm">
                                    <div className="w-2 h-2 rounded-full bg-red-500" />
                                    Must Items (必須)
                                </h3>
                                <div className="grid gap-3">
                                    {correctLogic.filter(r => r.priority === 'must').map(rec => {
                                        const isSelected = selectedItems.includes(rec.item.id);
                                        return (
                                            <div key={rec.item.id} className={cn(
                                                "p-4 rounded-xl border-l-4 flex justify-between items-start gap-4",
                                                isSelected ? "bg-emerald-50/50 border-emerald-500" : "bg-red-50/50 border-red-500"
                                            )}>
                                                <div>
                                                    <p className="font-bold text-slate-900">{rec.item.name}</p>
                                                    <p className="text-sm text-slate-600 mt-1">{rec.reason}</p>
                                                </div>
                                                <div className="flex-shrink-0">
                                                    {isSelected ? (
                                                        <span className="flex items-center gap-1 text-xs font-black text-emerald-600 bg-emerald-100 px-2 py-1 rounded-md uppercase">
                                                            <CheckCircle2 className="w-3 h-3" /> Selected
                                                        </span>
                                                    ) : (
                                                        <span className="flex items-center gap-1 text-xs font-black text-red-600 bg-red-100 px-2 py-1 rounded-md uppercase">
                                                            Missed
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* RECOMMENDED ITEMS */}
                            <div className="space-y-4">
                                <h3 className="flex items-center gap-2 font-black text-blue-500 uppercase tracking-widest text-sm">
                                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                                    Recommended (推奨)
                                </h3>
                                <div className="grid gap-3">
                                    {correctLogic.filter(r => r.priority === 'recommended').map(rec => {
                                        const isSelected = selectedItems.includes(rec.item.id);
                                        return (
                                            <div key={rec.item.id} className={cn(
                                                "p-4 rounded-xl border-l-4 flex justify-between items-start gap-4 bg-slate-50",
                                                isSelected ? "border-blue-500" : "border-slate-200 opacity-60"
                                            )}>
                                                <div>
                                                    <p className="font-bold text-slate-900">{rec.item.name}</p>
                                                    <p className="text-sm text-slate-600 mt-1">{rec.reason}</p>
                                                </div>
                                                {isSelected && (
                                                    <span className="flex items-center gap-1 text-xs font-black text-blue-600 bg-blue-100 px-2 py-1 rounded-md uppercase">
                                                        <CheckCircle2 className="w-3 h-3" /> Selected
                                                    </span>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </Card>

                    <div className="flex justify-center pt-8">
                        <Button onClick={() => {
                            setStep('case');
                            setSelectedItems([]);
                        }} variant="outline" className="px-8">
                            <RotateCcw className="w-4 h-4" /> 最初からやり直す
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
