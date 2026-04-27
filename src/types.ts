export interface ThetaScores {
  TF: number;
  GM: number;
  AU: number;
  SS: number;
  EC: number;
  S: number;
  PC: number;
  LS: number;
}

export interface CATState {
  theta_scores: ThetaScores;
  T_io_constant: number | null;
  mu_T: number | null;
  sigma_T: number | null;
  entangled_pairs: string[];
  questions_completed: number;
  analysis_tag: string;
}

export interface CATResponse {
  question_id: string;
  question_text: string;
  current_state: CATState;
  is_finished: boolean;
  final_analysis?: string;
}

export const ANCHOR_MAP: Record<keyof ThetaScores, { name: string, desc: string }> = {
  TF: { name: "專業/功能型 (Technical/Functional)", desc: "追求專業卓越，不願離開實務第一線。" },
  GM: { name: "管理型 (General Manager)", desc: "尋求組織影響力，享受決策與協調全局。" },
  AU: { name: "獨立/自主型 (Autonomy/Independence)", desc: "極度重視工作步調與方式的完全掌控權。" },
  SS: { name: "安全/穩定型 (Security/Stability)", desc: "優先考量長期保障、福利制度與升遷路徑。" },
  EC: { name: "創業/創造型 (Entrepreneurial Creativity)", desc: "熱衷於從零到一創造新事業，擁有創辦人情結。" },
  S: { name: "服務/貢獻型 (Service/Dedication to a Cause)", desc: "在意工作是否對社會、他人具有正面利他影響。" },
  PC: { name: "純粹挑戰型 (Pure Challenge)", desc: "由極限任務與克服障礙所驅動，需持續挑戰高難度。" },
  LS: { name: "生活型 (Lifestyle)", desc: "追求工作與生活的完美平衡，不輕易妥協私領域。" }
};
