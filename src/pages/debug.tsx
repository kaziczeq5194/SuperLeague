import { useState } from 'react';
import { Bug, Send, Copy, ChevronDown, Loader2 } from 'lucide-react';
import { lcuRequest } from '@/lib/lcu-api';
import type { LcuRequest, LcuResponse } from '@/lib/types';
import { cn } from '@/lib/utils';

const METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'] as const;

const QUICK_ENDPOINTS = [
  '/lol-summoner/v1/current-summoner',
  '/lol-challenges/v1/challenges/local-player/',
  '/lol-lobby/v2/lobby',
  '/lol-lobby/v2/lobby/members',
  '/lol-champion-mastery/v1/champion-mastery/top?count=10',
  '/lol-match-history/v1/products/lol/current-summoner/matches',
  '/lol-ranked/v1/current-ranked-stats',
  '/lol-collections/v1/inventories/local-player/champion-mastery-score',
  '/lol-eternals/v1/stats-summaries/puuid',
  '/riotclient/system-info/v1/root-folder',
];

function JsonViewer({ json }: { json: string }) {
  let parsed: unknown;
  let formatted = json;
  try {
    parsed = JSON.parse(json);
    formatted = JSON.stringify(parsed, null, 2);
  } catch {
    // not valid JSON, display raw
  }
  return (
    <pre className="text-xs leading-5 text-green-400 whitespace-pre-wrap break-all font-mono">
      {formatted}
    </pre>
  );
}

export default function Debug() {
  const [method, setMethod] = useState<'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'>('GET');
  const [endpoint, setEndpoint] = useState('/lol-summoner/v1/current-summoner');
  const [body, setBody] = useState('');
  const [response, setResponse] = useState<LcuResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [showEndpoints, setShowEndpoints] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleSend = async () => {
    setLoading(true);
    setResponse(null);
    const req: LcuRequest = { method, endpoint, body: body || undefined };
    const res = await lcuRequest(req);
    setResponse(res);
    setLoading(false);
  };

  const handleCopy = () => {
    if (response) {
      navigator.clipboard.writeText(response.body);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  const statusColor = (status: number) => {
    if (status >= 200 && status < 300) return 'text-league-success';
    if (status >= 400) return 'text-league-danger';
    return 'text-league-text-secondary';
  };

  return (
    <div className="p-6 h-full overflow-y-auto space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Bug className="text-league-gold" size={24} />
        <div>
          <h1 className="text-xl font-bold text-league-gold-light">LCU Debug</h1>
          <p className="text-xs text-league-text-secondary">Make raw requests to the League Client API</p>
        </div>
      </div>

      {/* Request Builder */}
      <div className="league-card space-y-3">
        <h2 className="text-sm font-semibold text-league-gold-light">Request</h2>

        {/* Method + Endpoint */}
        <div className="flex gap-2">
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value as any)}
            className={cn('league-input font-mono text-sm font-bold w-28', {
              'text-league-success': method === 'GET',
              'text-league-warning': ['POST', 'PUT', 'PATCH'].includes(method),
              'text-league-danger': method === 'DELETE',
            })}
          >
            {METHODS.map(m => <option key={m} value={m}>{m}</option>)}
          </select>

          <div className="relative flex-1">
            <input
              type="text"
              value={endpoint}
              onChange={(e) => setEndpoint(e.target.value)}
              placeholder="/lol-summoner/v1/current-summoner"
              className="league-input w-full font-mono text-sm pr-10"
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            />
            <button
              onClick={() => setShowEndpoints(!showEndpoints)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-league-text-muted hover:text-league-gold transition-colors"
            >
              <ChevronDown size={14} />
            </button>

            {showEndpoints && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-league-surface border border-league-border-dark rounded-league z-50 overflow-hidden animate-fade-in">
                {QUICK_ENDPOINTS.map((ep) => (
                  <button
                    key={ep}
                    onClick={() => { setEndpoint(ep); setShowEndpoints(false); }}
                    className="block w-full text-left px-3 py-2 text-xs font-mono text-league-text-secondary
                               hover:bg-league-surface-hover hover:text-league-text-primary transition-colors"
                  >
                    {ep}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={handleSend}
            disabled={loading}
            className="btn-primary flex items-center gap-2 text-sm px-5"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            Send
          </button>
        </div>

        {/* Body (for POST/PUT/PATCH) */}
        {['POST', 'PUT', 'PATCH'].includes(method) && (
          <div>
            <p className="text-xs text-league-text-muted mb-1.5">Request Body (JSON)</p>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder='{"key": "value"}'
              className="league-input w-full font-mono text-xs resize-none"
              rows={4}
            />
          </div>
        )}
      </div>

      {/* Response */}
      {(loading || response) && (
        <div className="league-card space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-league-gold-light">Response</h2>
            {response && (
              <div className="flex items-center gap-3">
                <span className={cn('text-sm font-bold font-mono', statusColor(response.status))}>
                  {response.status} {response.status === 200 ? 'OK' : response.status === 404 ? 'Not Found' : ''}
                </span>
                <button
                  onClick={handleCopy}
                  className="btn-ghost flex items-center gap-1.5 text-xs py-1 px-2"
                >
                  <Copy size={12} />
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            )}
          </div>

          {loading ? (
            <div className="flex items-center gap-2 text-league-text-muted text-sm">
              <Loader2 size={16} className="animate-spin" />
              Waiting for response…
            </div>
          ) : response ? (
            <div className="bg-league-bg-darkest rounded-league p-4 max-h-96 overflow-auto border border-league-border-dark">
              <JsonViewer json={response.body} />
            </div>
          ) : null}
        </div>
      )}

      {/* Tip */}
      <div className="text-xs text-league-text-muted flex items-center gap-2 px-1">
        <Bug size={12} />
        Click the dropdown arrow next to the endpoint field for quick access to common LCU endpoints.
      </div>
    </div>
  );
}
