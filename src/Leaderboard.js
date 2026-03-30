// ============================================================
// Global Leaderboard - Firebase Realtime Database REST API
// ============================================================
// Firebase 프로젝트의 Realtime Database URL을 아래에 입력하세요.
// 예: 'https://your-project-default-rtdb.firebaseio.com'
// ============================================================
const FIREBASE_DB_URL = 'https://chad-burger-3d-game-default-rtdb.firebaseio.com';

export class Leaderboard {

    /** Firebase가 설정되었는지 확인 */
    static isConfigured() {
        return FIREBASE_DB_URL.length > 0;
    }

    /**
     * 글로벌 리더보드에 점수를 제출합니다.
     * Firebase 미설정 시 로컬 저장만 수행합니다.
     */
    static async submitScore(playerId, score, playTime) {
        // 항상 로컬에도 저장 (오프라인 백업)
        this._saveLocal(playerId, score, playTime);

        if (!this.isConfigured()) {
            console.warn('[Leaderboard] Firebase 미설정 — 로컬 저장만 수행');
            return;
        }

        const entry = {
            id: playerId,
            score: score,
            time: Math.floor(playTime),
            timestamp: Date.now()
        };

        try {
            const res = await fetch(`${FIREBASE_DB_URL}/leaderboard.json`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(entry)
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            console.log('[Leaderboard] 글로벌 점수 제출 완료');
        } catch (e) {
            console.error('[Leaderboard] 글로벌 점수 제출 실패:', e);
        }
    }

    /**
     * 글로벌 리더보드 상위 점수를 가져옵니다.
     * Firebase 미설정 또는 네트워크 실패 시 로컬 데이터를 반환합니다.
     */
    static async getTopScores(limit = 100) {
        if (!this.isConfigured()) {
            return this._getLocal();
        }

        try {
            const res = await fetch(
                `${FIREBASE_DB_URL}/leaderboard.json?orderBy="score"&limitToLast=${limit}`
            );
            if (!res.ok) throw new Error(`HTTP ${res.status}`);

            const data = await res.json();
            if (!data) return this._getLocal();

            const scores = Object.values(data);
            scores.sort((a, b) => b.score - a.score);
            return scores.slice(0, limit);
        } catch (e) {
            console.error('[Leaderboard] 글로벌 데이터 로드 실패, 로컬 사용:', e);
            return this._getLocal();
        }
    }

    /**
     * 리더보드 전체 초기화 (관리자 전용)
     */
    static async clearAll() {
        // 로컬 초기화
        localStorage.removeItem('cherryBlossomLeaderboard');
        localStorage.removeItem('cherryBlossomBest');

        // 글로벌 초기화
        if (this.isConfigured()) {
            try {
                await fetch(`${FIREBASE_DB_URL}/leaderboard.json`, {
                    method: 'DELETE'
                });
                console.log('[Leaderboard] 글로벌 리더보드 초기화 완료');
            } catch (e) {
                console.error('[Leaderboard] 글로벌 초기화 실패:', e);
            }
        }
    }

    // === Private: localStorage 관련 ===

    static _saveLocal(playerId, score, playTime) {
        let lb = JSON.parse(localStorage.getItem('cherryBlossomLeaderboard') || '[]');
        lb.push({ id: playerId, score, time: playTime, timestamp: Date.now() });
        lb.sort((a, b) => b.score - a.score);
        lb = lb.slice(0, 100);
        localStorage.setItem('cherryBlossomLeaderboard', JSON.stringify(lb));
    }

    static _getLocal() {
        return JSON.parse(localStorage.getItem('cherryBlossomLeaderboard') || '[]');
    }
}
