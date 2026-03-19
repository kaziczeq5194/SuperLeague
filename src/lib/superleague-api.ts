// SuperLeague API client for fetching challenge data from Riot API
// This is used for other players' challenge data (current player uses LCU)

const API_BASE_URL = import.meta.env.VITE_SUPERLEAGUE_API_URL || 'https://superleague.kcorporation.org';

// Platform for the player (EUW1 is default, can be made configurable)
const PLATFORM = 'EUW1';

export interface ChallengeInfo {
    challengeId: number;
    percentile: number;
    level: 'NONE' | 'IRON' | 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM' | 'DIAMOND' | 'MASTER' | 'GRANDMASTER' | 'CHALLENGER';
    value: number;
    achievedTime: number;
}

export interface PlayerChallengesResponse {
    challenges: ChallengeInfo[];
    preferences: {
        bannerAccent: string;
        title: string;
        challengeIds: number[];
        crestBorder: string;
        prestigeCrestBorderLevel: number;
    };
    totalPoints: {
        level: string;
        current: number;
        max: number;
        percentile: number;
    };
    categoryPoints: Record<string, {
        level: string;
        current: number;
        max: number;
        percentile: number;
    }>;
    account?: {
        puuid: string;
        gameName: string;
        tagLine: string;
    };
}

export interface ChallengeConfigInfo {
    id: number;
    localizedNames: Record<string, Record<string, string>>;
    state: string;
    tracking: string;
    startTimestamp: number;
    endTimestamp: number;
    leaderboard: boolean;
    thresholds: Record<string, number>;
}

// Cache for challenge config (fetched once)
let challengeConfigCache: ChallengeConfigInfo[] | null = null;

/**
 * Fetch player challenges by PUUID
 */
export async function getPlayerChallenges(puuid: string, platform = PLATFORM): Promise<PlayerChallengesResponse | null> {
    try {
        const response = await fetch(`${API_BASE_URL}/v1/challenges/${platform}/${puuid}`);
        if (!response.ok) {
            console.warn(`[SuperLeague API] Failed to fetch challenges for ${puuid}: ${response.status}`);
            return null;
        }
        return await response.json();
    } catch (error) {
        console.error('[SuperLeague API] Error fetching challenges:', error);
        return null;
    }
}

/**
 * Fetch player challenges by Riot ID (gameName#tagLine)
 */
export async function getPlayerChallengesByRiotId(
    gameName: string,
    tagLine: string,
    platform = PLATFORM
): Promise<PlayerChallengesResponse | null> {
    try {
        const encodedName = encodeURIComponent(gameName);
        const encodedTag = encodeURIComponent(tagLine);
        const response = await fetch(`${API_BASE_URL}/v1/challenges/${platform}/by-riot-id/${encodedName}/${encodedTag}`);
        if (!response.ok) {
            console.warn(`[SuperLeague API] Failed to fetch challenges for ${gameName}#${tagLine}: ${response.status}`);
            return null;
        }
        return await response.json();
    } catch (error) {
        console.error('[SuperLeague API] Error fetching challenges by Riot ID:', error);
        return null;
    }
}

/**
 * Fetch challenge configuration (includes challenge names, thresholds, etc.)
 */
export async function getChallengeConfig(platform = PLATFORM): Promise<ChallengeConfigInfo[] | null> {
    if (challengeConfigCache) {
        return challengeConfigCache;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/v1/challenges/${platform}/config`);
        if (!response.ok) {
            console.warn(`[SuperLeague API] Failed to fetch challenge config: ${response.status}`);
            return null;
        }
        challengeConfigCache = await response.json();
        return challengeConfigCache;
    } catch (error) {
        console.error('[SuperLeague API] Error fetching challenge config:', error);
        return null;
    }
}

/**
 * Get challenge name from config by ID
 */
export function getChallengeName(config: ChallengeConfigInfo[], challengeId: number, locale = 'en_US'): string {
    const challenge = config.find(c => c.id === challengeId);
    if (!challenge) return `Challenge #${challengeId}`;
    return challenge.localizedNames?.[locale]?.name ?? challenge.localizedNames?.['en_US']?.name ?? `Challenge #${challengeId}`;
}

/**
 * Get challenge thresholds from config by ID
 */
export function getChallengeThresholds(config: ChallengeConfigInfo[], challengeId: number): Record<string, number> {
    const challenge = config.find(c => c.id === challengeId);
    return challenge?.thresholds ?? {};
}

const KNOWN_CHALLENGE_NAMES: Record<number, string> = {
    303401: 'Nowhere to Hide',
    303402: 'It Has "ULTIMATE" In The Name',
    303403: 'We Protec',
    303404: "They Just... Don't... DIE!",
    303405: "Where'd They Go?",
    303406: "We're Good Over Here",
    303407: 'Summoners on the Rift',
    303408: "Variety's Overrated",
    303409: 'Get Over Here',
    303410: "It's a Trap!",
    303411: "I'm Helping",
    303412: 'Hold That Pose',

    303501: "5 Under 5'",
    303502: 'All Hands on Deck',
    303503: 'FOR DEMACIA',
    303504: 'Ice, Ice, Baby',
    303505: 'Everybody was Wuju Fighting',
    303506: 'Elemental, My Dear Watson',
    303507: 'Strength Above All',
    303508: 'Calculated',
    303509: 'Spooky Scary Skeletons',
    303510: 'The Sun Disc Never Sets',
    303511: 'Peak Performance',
    303512: '(Inhuman Screeching Sounds)',
    303513: 'Chemtech Comrades',

    // Legacy compatibility aliases
    401101: "5 Under 5'",
    401102: 'All Hands on Deck',
    401103: 'FOR DEMACIA',
    401104: 'Ice, Ice, Baby',
    401105: 'Everybody was Wuju Fighting',
    401106: 'Elemental, My Dear Watson',
    401107: 'Strength Above All',
    401108: 'Calculated',
    401109: 'Spooky Scary Skeletons',
    401110: 'The Sun Disc Never Sets',
    401111: 'Peak Performance',
    401112: '(Inhuman Screeching Sounds)',
    401113: 'Chemtech Comrades',
};

export function getKnownChallengeName(challengeId: number): string {
    return KNOWN_CHALLENGE_NAMES[challengeId] ?? `Challenge #${challengeId}`;
}

const KNOWN_CHALLENGE_DESCRIPTIONS: Record<number, string> = {
    303401: 'Reveal enemies by catching hidden or stealthed targets with your team.',
    303402: 'Win fights by coordinating ultimates across your squad.',
    303403: 'Protect teammates from lethal damage through peel and saves.',
    303404: 'Keep allies alive through heavy sustained teamfight pressure.',
    303405: 'Punish enemies that escape vision and reappear out of position.',
    303406: 'Stabilize bad situations with strong defensive team play.',
    303407: 'Execute coordinated actions with your full group on Summoner\'s Rift.',
    303408: 'Commit to repeatable team patterns and clean macro execution.',
    303409: 'Start and finish engages with tight follow-up timing.',
    303410: 'Convert setup plays and baits into successful picks.',
    303411: 'Enable teammates with utility and assist-focused play.',
    303412: 'Chain control effects to lock targets in place for your team.',

    303501: 'Win with a coordinated Bandle City-style team composition.',
    303502: 'Win with a coordinated Bilgewater-style team composition.',
    303503: 'Win with a coordinated Demacia-style team composition.',
    303504: 'Win with a coordinated Freljord-style team composition.',
    303505: 'Win with a coordinated Ionia-style team composition.',
    303506: 'Win with a coordinated Ixtal-style team composition.',
    303507: 'Win with a coordinated Noxus-style team composition.',
    303508: 'Win with a coordinated Piltover-style team composition.',
    303509: 'Win with a coordinated Shadow Isles-style team composition.',
    303510: 'Win with a coordinated Shurima-style team composition.',
    303511: 'Win with a coordinated Targon-style team composition.',
    303512: 'Win with a coordinated Void-style team composition.',
    303513: 'Win with a coordinated Zaun-style team composition.',
};

export function getKnownChallengeDescription(challengeId: number): string | undefined {
    return KNOWN_CHALLENGE_DESCRIPTIONS[challengeId];
}

export const HARMONY_REGION_CHALLENGE_IDS = [
    303401,
    303402,
    303403,
    303404,
    303405,
    303406,
    303407,
    303408,
    303409,
    303410,
    303411,
    303412,
];

// Globetrotter challenge IDs (play champions from different regions)
export const GLOBETROTTER_CHALLENGE_IDS = [
    303501,
    303502,
    303503,
    303504,
    303505,
    303506,
    303507,
    303508,
    303509,
    303510,
    303511,
    303512,
    303513,
];
