import {
    AvailableTime,
    MainComplaint,
    SessionPurpose,
    Goal,
    RecommendedAssessment,
    AssessmentItem
} from "@/types";

export const ASSESSMENT_ITEMS: Record<string, AssessmentItem> = {
    PAIN_NRS: { id: 'pain_nrs', name: '痛みNRS', category: '痛み・自覚症状' },
    LUMBAR_ROM: { id: 'lumbar_rom', name: '腰椎屈曲/伸展ROM', category: '可動域(ROM)' },
    CERVICAL_ROM: { id: 'cervical_rom', name: '頸椎屈曲/伸展ROM', category: '可動域(ROM)' },
    THORACIC_ROM: { id: 'thoracic_rom', name: '胸椎可動性', category: '可動域(ROM)' },
    HIP_EXTENSION_ROM: { id: 'hip_ext_rom', name: '股関節伸展ROM', category: '可動域(ROM)' },
    SCAPULA_MOBILITY: { id: 'scapula_mobility', name: '肩甲骨可動性', category: '可動域(ROM)' },
    SORENSEN: { id: 'sorensen', name: 'Sorensen test (体幹伸展持久力)', category: '筋機能' },
    SLS: { id: 'sls', name: '片脚立位 (静的バランス)', category: 'バランス・制御' },
    Y_BALANCE: { id: 'y_balance', name: 'Y-Balance Test (動的バランス)', category: 'バランス・制御' },
    STEPS: { id: 'steps', name: '1日の歩数 (活動量)', category: '生活習慣・環境' },
    SIT_TO_STAND: { id: 'sit_to_stand', name: '立ち上がり動作観察', category: '動作分析' },
    DESK_POSTURE: { id: 'desk_posture', name: 'デスクワーク姿勢評価', category: '動作分析' },
    MUSCLE_HARDNESS: { id: 'muscle_hardness', name: '筋硬度 (僧帽筋/腰方形筋)', category: '筋・軟部組織' },
    SLEEP_QUALITY: { id: 'sleep_quality', name: '睡眠の質 (質問)', category: '生活習慣・環境' },
    CORE_STABILITY: { id: 'core_stability', name: '体幹安定性 (Prone instability test)', category: '筋機能' },
    FHP: { id: 'fhp', name: '頭部前方位 (FHP)', category: '姿勢アライメント' },
};

export const CATEGORIES = Array.from(new Set(Object.values(ASSESSMENT_ITEMS).map(i => i.category)));

export function getRecommendedAssessments(
    time: AvailableTime,
    complaint: MainComplaint,
    purpose: SessionPurpose,
    narrative: string,
    goal: Goal
): RecommendedAssessment[] {
    const recommendations: RecommendedAssessment[] = [];

    // Helper to add recommendation
    const addRec = (itemId: string, reason: string, priority: 'must' | 'recommended' | 'optional') => {
        const item = ASSESSMENT_ITEMS[itemId];
        if (item) {
            recommendations.push({ item, reason, priority });
        }
    };

    // 1. Core Minimum Dataset (Level 1 - 15min)
    addRec('PAIN_NRS', '基本評価（痛み強さ）', 'must');
    addRec('SLS', '静的バランス指標', 'must');
    addRec('STEPS', '日常活動量の把握', 'must');

    if (complaint === 'back' || complaint === 'both') {
        addRec('LUMBAR_ROM', '腰痛の基本可動域評価', 'must');
        addRec('SORENSEN', '腰痛再発リスクとの関連（持久力）', 'must');
    }
    if (complaint === 'shoulder' || complaint === 'both') {
        addRec('CERVICAL_ROM', '頸椎・肩こりの基本可動域評価', 'must');
    }

    // 2. Standard Dataset (Level 2 - 30min+)
    if (time !== '15min') {
        addRec('SIT_TO_STAND', '機能的動作のスクリーニング', 'recommended');
        if (complaint === 'shoulder') addRec('SCAPULA_MOBILITY', '肩甲帯機能の評価', 'recommended');
        if (complaint === 'back') addRec('HIP_EXTENSION_ROM', '腰椎・骨盤連動性の評価', 'recommended');
    }

    // 3. Intensive Dataset (Level 3 - 45-60min+)
    if (time === '45min' || time === '60min+') {
        addRec('MUSCLE_HARDNESS', '軟部組織の定量的評価', 'recommended');
        addRec('FHP', '姿勢アライメントの精査', 'recommended');
        addRec('SLEEP_QUALITY', '回復環境の評価', 'optional');
    }

    // 4. Logic based on Narrative
    const lowNarrative = narrative.toLowerCase();
    if (lowNarrative.includes('座る') || lowNarrative.includes('デスク') || lowNarrative.includes('仕事')) {
        addRec('DESK_POSTURE', '作業環境への依存性が疑われるため', 'recommended');
        addRec('HIP_EXTENSION_ROM', '長時間座位による短縮の可能性', 'recommended');
    }
    if (lowNarrative.includes('朝') || lowNarrative.includes('起きる')) {
        addRec('THORACIC_ROM', '睡眠中の姿勢や胸椎の硬さが影響している可能性', 'recommended');
    }
    if (lowNarrative.includes('動く') && (lowNarrative.includes('楽') || lowNarrative.includes('改善'))) {
        addRec('SORENSEN', '運動による改善が見られるため、持久力のベースラインを評価', 'must');
    }

    // 5. Logic based on Goal
    if (goal === 'sports_return') {
        addRec('Y_BALANCE', 'スポーツ動作に必要な動的バランス評価', 'must');
        addRec('CORE_STABILITY', 'パフォーマンス向上のための安定性評価', 'recommended');
    }
    if (goal === 'prevention') {
        addRec('SORENSEN', '再発防止には体幹持久力が最重要指標となるため', 'must');
    }

    // Deduplicate and prioritize 'must'
    const seen = new Map<string, RecommendedAssessment>();
    recommendations.forEach(rec => {
        const existing = seen.get(rec.item.id);
        if (!existing || (rec.priority === 'must' && existing.priority !== 'must')) {
            seen.set(rec.item.id, rec);
        }
    });

    return Array.from(seen.values()).sort((a, b) => {
        const order = { must: 0, recommended: 1, optional: 2 };
        return order[a.priority] - order[b.priority];
    });
}
