export type Sex = 'male' | 'female' | 'other';
export type MainComplaint = 'shoulder' | 'back' | 'both';

export interface Client {
    id: string;
    age: number;
    sex: Sex;
    mainComplaint: MainComplaint;
    name: string;
}

export type AvailableTime = '15min' | '30min' | '45min' | '60min+';

export type SessionPurpose =
    | 'screening'
    | 'cause_exploration'
    | 're-evaluation'
    | 'prevention'
    | 'performance';

export type Goal =
    | 'zero_pain'
    | 'work_comfort'
    | 'sports_return'
    | 'prevention'
    | 'posture';

export interface Session {
    id: string;
    clientId: string;
    date: string;
    availableTime: AvailableTime;
    purpose: SessionPurpose;
    painNarrative: string;
    goal: Goal;
    impactOnLife: number; // 0-10
}

export interface AssessmentItem {
    id: string;
    name: string;
    category: string;
    description?: string;
}

export interface RecommendedAssessment {
    item: AssessmentItem;
    reason: string;
    priority: 'must' | 'recommended' | 'optional';
}

// Training Logic Types
export interface QuizCase {
    id: string;
    client: Client;
    session: Omit<Session, 'id' | 'clientId' | 'date'>;
    difficulty: 'easy' | 'medium' | 'hard';
}

export interface QuizResult {
    correctCount: number;
    missedMustCount: number; // MUSTの見逃し
    unnecessaryCount: number; // 不要な項目の選択
    score: number; // 100点満点
    feedback: string;
}
