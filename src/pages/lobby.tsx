import { useEffect, useRef, useState } from 'react';
import { Users } from 'lucide-react';
import { getLobbyMembers, getProfileIconUrl, lcuRequest } from '@/lib/lcu-api';
import {
    getKnownChallengeDescription,
    getKnownChallengeName,
    getPlayerChallenges,
    getPlayerChallengesByRiotId,
    GLOBETROTTER_CHALLENGE_IDS,
    HARMONY_REGION_CHALLENGE_IDS,
} from '@/lib/superleague-api';

const TIER_C: Record<string, string> = {
    NONE: '#5B5A56', IRON: '#72767E', BRONZE: '#A0522D', SILVER: '#A8B2BC',
    GOLD: '#C89B3C', PLATINUM: '#1A9E8F', EMERALD: '#10D48A', DIAMOND: '#576BCE',
    MASTER: '#9D48E0', GRANDMASTER: '#E84057', CHALLENGER: '#F4C874',
};

const TIER_ORDER = ['NONE', 'IRON', 'BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'EMERALD', 'DIAMOND', 'MASTER', 'GRANDMASTER', 'CHALLENGER'];
const DEFAULT_PLATFORM = 'EUW1';

const REGION_TO_PLATFORM: Record<string, string> = {
    BR: 'BR1',
    EUN: 'EUN1',
    EUNE: 'EUN1',
    EUW: 'EUW1',
    JP: 'JP1',
    KR: 'KR',
    LAN: 'LA1',
    LAS: 'LA2',
    NA: 'NA1',
    OCE: 'OC1',
    OC: 'OC1',
    RU: 'RU',
    TR: 'TR1',
};

interface RankData {
    tier: string;
    division: string;
    lp: number;
}

interface ChallengeToken {
    id: number;
    name: string;
    description?: string;
    currentLevel: string;
    currentValue: number;
    thresholds?: Record<string, { value: number }>;
}

interface LobbyPlayer {
    summonerId?: number;
    puuid?: string;
    summonerName?: string;
    gameName?: string;
    tagLine?: string;
    profileIconId?: number;
    isLeader?: boolean;
    summonerLevel?: number;
    soloRank?: RankData;
    flexRank?: RankData;
    globetrotterChallenges?: ChallengeToken[];
    harmonyChallenges?: ChallengeToken[];
}

interface RawChallengeLike {
    challengeId?: number;
    id?: number;
    name?: string;
    description?: string;
    currentLevel?: string;
    level?: string;
    currentValue?: number;
    value?: number;
    thresholds?: Record<string, { value: number }>;
}

type ChallengeThresholdMap = Record<number, Record<string, { value: number }>>;
type ChallengeDescriptionMap = Record<number, string>;

function isValidRiotPuuid(value?: string): value is string {
    return Boolean(value && /^[a-zA-Z0-9_-]{70,80}$/.test(value));
}

function buildOrderedTokens(
    sourceChallenges: RawChallengeLike[],
    orderedIds: number[],
    sharedThresholds: ChallengeThresholdMap,
    sharedDescriptions: ChallengeDescriptionMap
): ChallengeToken[] {
    const byId = new Map<number, RawChallengeLike>();

    sourceChallenges.forEach((c) => {
        const challengeId = c.challengeId ?? c.id;
        if (typeof challengeId === 'number' && !Number.isNaN(challengeId)) {
            byId.set(challengeId, c);
        }
    });

    return orderedIds.map((id) => {
        const c = byId.get(id);
        const mergedThresholds = {
            ...(sharedThresholds[id] ?? {}),
            ...(c?.thresholds ?? {}),
        };

        return {
            id,
            name: c?.name ?? getKnownChallengeName(id),
            description: c?.description ?? sharedDescriptions[id] ?? getKnownChallengeDescription(id),
            currentLevel: c?.currentLevel ?? c?.level ?? 'NONE',
            currentValue: c?.currentValue ?? c?.value ?? 0,
            thresholds: Object.keys(mergedThresholds).length > 0 ? mergedThresholds : undefined,
        };
    });
}

function mapRegionToPlatform(region?: string): string | null {
    if (!region) return null;
    const normalized = region.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (!normalized) return null;
    if (/^[A-Z]{2,4}1$/.test(normalized)) return normalized;
    return REGION_TO_PLATFORM[normalized] ?? null;
}

function extractPlatformFromAuth(payload: any): string | null {
    const candidates = [
        payload?.currentPlatformId,
        payload?.platformId,
        payload?.lol?.platformId,
        payload?.lol?.rsoPlatformId,
        payload?.lol?.rso_platform_id,
    ];

    for (const raw of candidates) {
        if (!raw) continue;
        const platform = String(raw).toUpperCase();
        if (/^[A-Z]{2,4}1$/.test(platform) || platform === 'KR' || platform === 'RU') {
            return platform;
        }
    }

    return null;
}

function RankLine({ rank, queue }: { rank: RankData | undefined; queue: string }) {
    if (!rank || rank.tier === 'NONE') return null;

    const color = TIER_C[rank.tier] ?? TIER_C.NONE;
    const tierLetter = rank.tier.charAt(0);
    const isMasterPlus = ['MASTER', 'GRANDMASTER', 'CHALLENGER'].includes(rank.tier);

    return (
        <div className="text-xs">
            <span className="text-ink-ghost">{queue}</span>
            <span className="ml-1.5 font-bold" style={{ color }}>{tierLetter}</span>
            <span className="ml-1" style={{ color }}>
                {isMasterPlus ? `${rank.lp} LP` : `${rank.division}`}
            </span>
        </div>
    );
}

function TokenIcon({ challenge, size = 20 }: { challenge: ChallengeToken; size?: number }) {
    const [showTip, setShowTip] = useState(false);
    const [imgError, setImgError] = useState(false);
    const [placeBelow, setPlaceBelow] = useState(false);
    const tokenRef = useRef<HTMLDivElement>(null);
    const tier = (challenge.currentLevel ?? 'NONE').toUpperCase();
    const color = TIER_C[tier] ?? TIER_C.NONE;
    const isUnranked = tier === 'NONE';

    const masterThreshold = challenge.thresholds?.MASTER?.value ?? challenge.currentValue ?? 0;
    const current = challenge.currentValue ?? 0;
    const pctToMaster = masterThreshold > 0 ? Math.min((current / masterThreshold) * 100, 100) : 100;

    const handleMouseEnter = () => {
        const el = tokenRef.current;
        const rect = el?.getBoundingClientRect();
        if (!el || !rect) {
            setPlaceBelow(false);
            setShowTip(true);
            return;
        }

        // Determine available space inside the nearest scrollable viewport.
        const scrollViewport = el.closest('.overflow-y-auto') as HTMLElement | null;
        if (scrollViewport) {
            const viewportRect = scrollViewport.getBoundingClientRect();
            const spaceAbove = rect.top - viewportRect.top;
            const spaceBelow = viewportRect.bottom - rect.bottom;

            // Prefer opening below when top space is tight inside the scroll area.
            if (spaceAbove < 140 && spaceBelow > 70) {
                setPlaceBelow(true);
            } else if (spaceBelow < 70 && spaceAbove > 70) {
                setPlaceBelow(false);
            } else {
                setPlaceBelow(spaceBelow > spaceAbove);
            }
        } else {
            // Fallback to viewport-based heuristic.
            setPlaceBelow(rect.top < 150);
        }

        setShowTip(true);
    };

    return (
        <div
            ref={tokenRef}
            className="relative"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={() => setShowTip(false)}
        >
            {!imgError ? (
                <img
                    src={`https://raw.communitydragon.org/latest/game/assets/challenges/config/${challenge.id}/tokens/${tier.toLowerCase()}.png`}
                    alt=""
                    style={{ width: size, height: size, opacity: isUnranked ? 0.35 : 1 }}
                    className="object-contain"
                    onError={() => setImgError(true)}
                />
            ) : (
                <div
                    className="rounded-full flex items-center justify-center text-[8px] font-bold"
                    style={{
                        width: size, height: size,
                        background: isUnranked ? '#333' : `${color}30`,
                        border: `1.5px solid ${isUnranked ? '#555' : color}`,
                        color: isUnranked ? '#666' : color,
                    }}
                >
                    {isUnranked ? 'U' : tier.charAt(0)}
                </div>
            )}

            {showTip && (
                <div className={`absolute left-1/2 -translate-x-1/2 z-[120] p-2 rounded bg-raised border border-white/[0.1] shadow-xl min-w-[140px] pointer-events-none ${placeBelow ? 'top-full mt-1.5' : 'bottom-full mb-1.5'}`}>
                    <div className="text-[10px] font-semibold text-ink-bright mb-0.5">{challenge.name}</div>
                    {challenge.description && (
                        <div className="text-[9px] text-ink-bright mb-1 leading-snug max-w-[220px] bg-white/[0.04] border border-white/[0.08] rounded px-1.5 py-1">
                            {challenge.description}
                        </div>
                    )}
                    <div className="flex items-center justify-between text-[9px] mb-0.5">
                        <span className="text-ink-ghost">To Master</span>
                        <span className="tabular-nums" style={{ color }}>{current} / {masterThreshold}</span>
                    </div>
                    <div className="h-0.5 rounded-full bg-white/[0.06] overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${pctToMaster}%`, background: color }} />
                    </div>
                </div>
            )}
        </div>
    );
}

function TokenGrid({ title, challenges }: { title: string; challenges: ChallengeToken[] }) {
    return (
        <div className="w-full">
            <h3 className="text-xs font-semibold text-ink-bright mb-1">
                {title}
            </h3>
            {challenges.length === 0 ? (
                <div className="text-[10px] text-ink-ghost">-</div>
            ) : (
                <div className="flex flex-wrap gap-0.5">
                    {challenges.map(c => (
                        <TokenIcon key={c.id} challenge={c} size={20} />
                    ))}
                </div>
            )}
        </div>
    );
}

function PlayerRow({ player }: { player: LobbyPlayer }) {
    const displayName = player.gameName || player.summonerName || '???';
    const tagLine = player.tagLine || '';
    const hasRank = player.soloRank || player.flexRank;
    
    // Calculate if username is long (including tag)
    const fullName = `${displayName}${tagLine ? `#${tagLine}` : ''}`;
    const isLongUsername = fullName.length > 20;
    
    return (
        <div className="flex items-center gap-4 py-2.5 border-b border-white/[0.04] last:border-b-0">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
                <img
                    src={getProfileIconUrl(player.profileIconId ?? 29)}
                    alt=""
                    className="w-12 h-12 rounded-lg object-cover bg-dark"
                    onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0.3'; }}
                />
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-1 py-0.5 rounded bg-dark border border-white/[0.1] text-[9px] text-ink-ghost">
                    {player.summonerLevel ?? '?'}
                </div>
            </div>

            {/* Name + Ranks - flexible width based on username length */}
            <div className={`flex-shrink-0 ${isLongUsername ? 'min-w-[180px]' : 'min-w-[140px]'}`}>
                <div className="text-xs font-bold text-ink-bright truncate">
                    {displayName}
                    {tagLine && <span className="text-gold">#{tagLine}</span>}
                </div>
                {hasRank ? (
                    <div className="mt-0.5">
                        <RankLine rank={player.soloRank} queue="SQ" />
                        <RankLine rank={player.flexRank} queue="FQ" />
                    </div>
                ) : (
                    <div className="text-[10px] text-ink-ghost mt-0.5">Unranked</div>
                )}
            </div>

            {/* Harmony Tokens - flexible width */}
            <div className="flex-1 min-w-[100px]">
                <TokenGrid title="Harmony" challenges={player.harmonyChallenges ?? []} />
            </div>

            {/* Globetrotter Tokens - flexible width */}
            <div className="flex-1 min-w-[100px]">
                <TokenGrid title="Globetrotter" challenges={player.globetrotterChallenges ?? []} />
            </div>
        </div>
    );
}

export default function Lobby() {
    const [members, setMembers] = useState<LobbyPlayer[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getLobbyMembers().then(async (data) => {
            console.log('[Lobby] Raw members:', data);

            if (!Array.isArray(data) || data.length === 0) {
                setLoading(false);
                return;
            }

            // Identify local player once so we can keep local challenge fetch on LCU.
            let currentPuuid: string | null = null;
            let currentPlatform = DEFAULT_PLATFORM;
            try {
                const meRes = await lcuRequest({ method: 'GET', endpoint: '/lol-summoner/v1/current-summoner' });
                if (meRes.status === 200 && meRes.body) {
                    const me = JSON.parse(meRes.body);
                    currentPuuid = me.puuid;
                    const summonerPlatform = mapRegionToPlatform(me?.unnamedRegion ?? me?.region);
                    if (summonerPlatform) currentPlatform = summonerPlatform;
                }
            } catch {
                /* ignore */
            }

            try {
                const authRes = await lcuRequest({ method: 'GET', endpoint: '/lol-rso-auth/v1/authorization' });
                if (authRes.status === 200 && authRes.body) {
                    const auth = JSON.parse(authRes.body);
                    const authPlatform = extractPlatformFromAuth(auth);
                    if (authPlatform) currentPlatform = authPlatform;
                }
            } catch {
                /* ignore */
            }

            if (currentPlatform === DEFAULT_PLATFORM) {
                try {
                    const regionRes = await lcuRequest({ method: 'POST', endpoint: '/riotclient/get_region_locale', body: '{}' });
                    if (regionRes.status === 200 && regionRes.body) {
                        const regionData = JSON.parse(regionRes.body);
                        const regionPlatform = mapRegionToPlatform(regionData?.region);
                        if (regionPlatform) currentPlatform = regionPlatform;
                    }
                } catch {
                    /* ignore */
                }
            }

            console.log('[Lobby] Resolved platform for SuperLeague:', currentPlatform);

            // Pull local challenge thresholds once and reuse them for all players.
            let sharedThresholds: ChallengeThresholdMap = {};
            let sharedDescriptions: ChallengeDescriptionMap = {};
            let localChallengesSnapshot: RawChallengeLike[] | null = null;
            try {
                const localRes = await lcuRequest({
                    method: 'GET',
                    endpoint: '/lol-challenges/v1/challenges/local-player',
                });

                if (localRes.status === 200 && localRes.body) {
                    const localData = JSON.parse(localRes.body);
                    const localChallenges = (Array.isArray(localData) ? localData : Object.values(localData ?? {})) as RawChallengeLike[];
                    localChallengesSnapshot = localChallenges;

                    localChallenges.forEach((c) => {
                        const challengeId = c.challengeId ?? c.id;
                        if (typeof challengeId === 'number') {
                            if (c.thresholds) {
                                sharedThresholds[challengeId] = c.thresholds;
                            }
                            if (typeof c.description === 'string' && c.description.trim().length > 0) {
                                sharedDescriptions[challengeId] = c.description;
                            }
                        }
                    });
                }
            } catch {
                /* ignore */
            }

            const enriched: LobbyPlayer[] = [];
            for (const m of data.slice(0, 5)) {
                console.log('[Lobby] Processing member:', m);

                // Extract all possible name/icon fields from lobby member
                const player: LobbyPlayer = {
                    summonerId: m.summonerId,
                    puuid: m.puuid,
                    summonerName: m.summonerName ?? m.summonerInternalName ?? m.displayName,
                    gameName: m.gameName,
                    tagLine: m.gameTag ?? m.tagLine,
                    profileIconId: m.summonerIconId ?? m.profileIconId ?? m.iconId,
                    isLeader: m.isLeader ?? m.isOwner,
                    summonerLevel: m.summonerLevel ?? m.level,
                };

                // Fetch summoner data to get proper name and icon
                if (m.puuid) {
                    try {
                        const sumRes = await lcuRequest({
                            method: 'GET',
                            endpoint: `/lol-summoner/v2/summoners/puuid/${m.puuid}`,
                        });
                        console.log('[Lobby] Summoner data:', sumRes.body?.slice(0, 200));
                        if (sumRes.status === 200 && sumRes.body) {
                            const sum = JSON.parse(sumRes.body);
                            player.gameName = sum.gameName ?? sum.displayName ?? player.gameName;
                            player.tagLine = sum.tagLine ?? sum.gameTag ?? player.tagLine;
                            player.puuid = sum.puuid ?? player.puuid;
                            player.summonerName = sum.internalName ?? sum.displayName ?? player.summonerName;
                            player.summonerLevel = sum.summonerLevel ?? player.summonerLevel;
                            player.profileIconId = sum.profileIconId ?? player.profileIconId;
                        }
                    } catch (e) { console.log('[Lobby] Summoner fetch error:', e); }
                }

                // Fetch ranked stats
                if (m.puuid) {
                    try {
                        const res = await lcuRequest({
                            method: 'GET',
                            endpoint: `/lol-ranked/v1/ranked-stats/${m.puuid}`,
                        });
                        if (res.status === 200 && res.body) {
                            const ranked = JSON.parse(res.body);
                            const queues = ranked?.queues ?? [];
                            if (Array.isArray(queues)) {
                                const sq = queues.find((q: any) => q.queueType === 'RANKED_SOLO_5x5');
                                const fq = queues.find((q: any) => q.queueType === 'RANKED_FLEX_SR');
                                if (sq?.tier && sq.tier !== 'NONE') {
                                    player.soloRank = { tier: sq.tier, division: sq.division ?? '', lp: sq.leaguePoints ?? 0 };
                                }
                                if (fq?.tier && fq.tier !== 'NONE') {
                                    player.flexRank = { tier: fq.tier, division: fq.division ?? '', lp: fq.leaguePoints ?? 0 };
                                }
                            }
                        }
                    } catch { /* ignore */ }
                }

                // Keep local player on LCU to avoid external rate-limit pressure.
                const isCurrentPlayer = Boolean(m.puuid && currentPuuid && m.puuid === currentPuuid);

                if (isCurrentPlayer) {
                    try {
                        const challenges = localChallengesSnapshot ?? [];

                        player.harmonyChallenges = buildOrderedTokens(challenges, HARMONY_REGION_CHALLENGE_IDS, sharedThresholds, sharedDescriptions);
                        player.globetrotterChallenges = buildOrderedTokens(challenges, GLOBETROTTER_CHALLENGE_IDS, sharedThresholds, sharedDescriptions);
                        console.log('[Lobby] Local LCU challenges found:', {
                            player: player.gameName,
                            harmony: player.harmonyChallenges.length,
                            globetrotter: player.globetrotterChallenges.length,
                        });
                    } catch (e) {
                        console.log('[Lobby] Local LCU challenge fetch error:', e);
                    }
                } else if (m.puuid || (player.gameName && player.tagLine)) {
                    try {
                        const puuid = player.puuid;
                        const canUsePuuid = isValidRiotPuuid(puuid);
                        const canUseRiotId = Boolean(player.gameName && player.tagLine);

                        const challengeData = canUsePuuid
                            ? await getPlayerChallenges(puuid, currentPlatform)
                            : (canUseRiotId
                                ? await getPlayerChallengesByRiotId(player.gameName!, player.tagLine!, currentPlatform)
                                : null);

                        const challenges = challengeData?.challenges ?? [];

                        player.harmonyChallenges = buildOrderedTokens(challenges, HARMONY_REGION_CHALLENGE_IDS, sharedThresholds, sharedDescriptions);
                        player.globetrotterChallenges = buildOrderedTokens(challenges, GLOBETROTTER_CHALLENGE_IDS, sharedThresholds, sharedDescriptions);
                        console.log('[Lobby] SuperLeague challenges found:', {
                            player: player.gameName,
                            platform: currentPlatform,
                            source: canUsePuuid ? 'puuid' : (canUseRiotId ? 'riot-id' : 'none'),
                            total: challenges.length,
                            harmony: player.harmonyChallenges.length,
                            globetrotter: player.globetrotterChallenges.length,
                        });
                    } catch (e) {
                        console.log('[Lobby] SuperLeague challenge fetch error:', e);
                    }
                } else {
                    console.log('[Lobby] No puuid for player, cannot fetch challenges:', player.gameName);
                }

                enriched.push(player);
            }

            console.log('[Lobby] Enriched members:', enriched);
            setMembers(enriched);
            setLoading(false);
        });
    }, []);

    // Convert tier+division to numeric score (0-43: Iron IV=0, Iron III=1, ..., Challenger=43)
    const DIV_MAP: Record<string, number> = { IV: 0, III: 1, II: 2, I: 3 };
    const DIV_REVERSE = ['IV', 'III', 'II', 'I'];
    const rankToScore = (rank: RankData): number => {
        const tierIdx = TIER_ORDER.indexOf(rank.tier);
        if (tierIdx < 0) return 0;
        // Master+ have no divisions, treat as top of their tier
        if (['MASTER', 'GRANDMASTER', 'CHALLENGER'].includes(rank.tier)) {
            return tierIdx * 4;
        }
        const divScore = DIV_MAP[rank.division] ?? 0;
        return tierIdx * 4 + divScore;
    };
    const scoreToRank = (score: number): { tier: string; division: string } => {
        const tierIdx = Math.floor(score / 4);
        const divIdx = Math.round(score % 4);
        const tier = TIER_ORDER[Math.min(tierIdx, TIER_ORDER.length - 1)] ?? 'NONE';
        // Master+ don't display division
        const division = ['MASTER', 'GRANDMASTER', 'CHALLENGER'].includes(tier) ? '' : DIV_REVERSE[divIdx] ?? 'IV';
        return { tier, division };
    };

    const avgRank = (() => {
        // Average is intentionally computed from Solo Queue only.
        const soloRanked = members.filter(m => m.soloRank && m.soloRank.tier !== 'NONE');
        if (soloRanked.length === 0) return null;
        const scores = soloRanked.map(m => rankToScore(m.soloRank!));
        const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
        const result = scoreToRank(avgScore);

        // Calculate average LP for Master+ tiers
        let avgLP: number | null = null;
        if (['MASTER', 'GRANDMASTER', 'CHALLENGER'].includes(result.tier)) {
            const masterPlusMembers = soloRanked.filter(m =>
                ['MASTER', 'GRANDMASTER', 'CHALLENGER'].includes(m.soloRank!.tier)
            );
            if (masterPlusMembers.length > 0) {
                const totalLP = masterPlusMembers.reduce((sum, m) => sum + (m.soloRank!.lp ?? 0), 0);
                avgLP = Math.round(totalLP / masterPlusMembers.length);
            }
        }

        return { ...result, avgLP };
    })();

    return (
        <div className="p-6 space-y-3 animate-slide-up">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className={`status-dot ${members.length > 0 ? 'online' : 'offline'}`} />
                    <span className="text-xs text-ink-dim">
                        {loading ? 'Loading…' : `${members.length} player${members.length !== 1 ? 's' : ''} in lobby`}
                    </span>
                </div>
                {avgRank && avgRank.tier !== 'NONE' && (
                    <div className="flex items-center gap-1.5 text-xs">
                        <span className="text-ink-ghost">Avg SoloQ:</span>
                        <span className="font-bold" style={{ color: TIER_C[avgRank.tier] }}>
                            {avgRank.tier.charAt(0) + avgRank.tier.slice(1).toLowerCase()}
                            {avgRank.division && ` ${avgRank.division}`}
                            {avgRank.avgLP !== null && ` ${avgRank.avgLP} LP`}
                        </span>
                    </div>
                )}
            </div>

            {/* Empty state */}
            {!loading && members.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-ink-ghost">
                    <Users size={32} className="mb-2 opacity-20" />
                    <p className="text-xs font-medium text-ink-dim">No lobby detected</p>
                    <p className="text-[10px] mt-0.5">Join or create a lobby in the League client</p>
                </div>
            )}

            {/* Player rows */}
            {(loading || members.length > 0) && (
                <div className="card p-3">
                    {loading
                        ? Array(2).fill(0).map((_, i) => (
                            <div key={i} className="flex items-center gap-4 py-2.5 border-b border-white/[0.04] last:border-b-0">
                                <div className="skeleton w-12 h-12 rounded-lg" />
                                <div className="space-y-1.5 min-w-[140px]">
                                    <div className="skeleton w-28 h-3 rounded" />
                                    <div className="skeleton w-20 h-2 rounded" />
                                </div>
                                <div className="space-y-1 min-w-[120px]">
                                    <div className="skeleton w-16 h-3 rounded" />
                                    <div className="skeleton w-24 h-5 rounded" />
                                </div>
                                <div className="space-y-1 min-w-[120px]">
                                    <div className="skeleton w-20 h-3 rounded" />
                                    <div className="skeleton w-24 h-5 rounded" />
                                </div>
                            </div>
                        ))
                        : members.map((m, i) => (
                            <PlayerRow key={m.summonerId ?? i} player={m} />
                        ))
                    }
                </div>
            )}
        </div>
    );
}
