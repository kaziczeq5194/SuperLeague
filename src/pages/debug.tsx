import { useState } from 'react';
import { Bug, Send, Copy, Check } from 'lucide-react';
import { lcuRequest } from '@/lib/lcu-api';
import type { LcuResponse } from '@/lib/types';

const QUICK_ENDPOINTS = [
  { label: 'Current Summoner', method: 'GET', endpoint: '/lol-summoner/v1/current-summoner' },
  { label: 'Ranked Stats',    method: 'GET', endpoint: '/lol-ranked/v1/current-ranked-stats' },
  { label: 'Challenges',      method: 'GET', endpoint: '/lol-challenges/v1/challenges/local-player/' },
  { label: 'Lobby',           method: 'GET', endpoint: '/lol-lobby/v2/lobby/members' },
  { label: 'Owned Skins',     method: 'GET', endpoint: '/lol-champions/v1/inventories/local-player/skins-minimal' },
  { label: 'Match History',   method: 'GET', endpoint: '/lol-match-history/v1/products/lol/current-summoner/matches' },
];

export default function Debug() {
  const [method, setMethod] = useState('GET');
  const [endpoint, setEndpoint] = useState('/lol-summoner/v1/current-summoner');
  const [body, setBody] = useState('');
  const [response, setResponse] = useState<LcuResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleSend = async () => {
    setLoading(true);
    const res = await lcuRequest({
      method: method as any,
      endpoint,
      body: body || undefined,
    });
    setResponse(res);
    setLoading(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(response?.body ?? '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-6 space-y-5 animate-slide-up">
      {/* Quick endpoints */}
      <div className="flex gap-1.5 flex-wrap">
        {QUICK_ENDPOINTS.map(({ label, method: m, endpoint: ep }) => (
          <button
            key={ep}
            onClick={() => { setMethod(m); setEndpoint(ep); setBody(''); }}
            className="btn-ghost text-[11px] py-1 px-2.5"
          >
            {label}
          </button>
        ))}
      </div>

      {/* Request form */}
      <div className="card p-4 space-y-3">
        <div className="flex gap-2">
          <select value={method} onChange={(e) => setMethod(e.target.value)} className="select w-24 text-sm">
            {['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
          <input
            type="text"
            value={endpoint}
            onChange={(e) => setEndpoint(e.target.value)}
            placeholder="/lol-summoner/v1/current-summoner"
            className="input flex-1 font-mono text-xs"
          />
          <button onClick={handleSend} disabled={loading} className="btn-gold text-sm">
            <Send size={13} />
            {loading ? 'Sending…' : 'Send'}
          </button>
        </div>

        {(method === 'POST' || method === 'PUT' || method === 'PATCH') && (
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder='{"key": "value"}'
            className="textarea font-mono text-xs"
            rows={4}
          />
        )}
      </div>

      {/* Response */}
      {response && (
        <div className="card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`badge text-[10px] ${response.status < 300 ? 'badge-green' : 'badge-red'}`}>
                {response.status}
              </span>
              <span className="text-xs text-ink-ghost">
                {response.body.length.toLocaleString()} chars
              </span>
            </div>
            <button onClick={handleCopy} className="btn-ghost text-xs py-1">
              {copied ? <Check size={12} className="text-emerald" /> : <Copy size={12} />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
          <pre className="bg-dark border border-white/[0.04] rounded-lg p-3 text-xs font-mono text-ink-dim overflow-auto max-h-80 no-scrollbar whitespace-pre-wrap break-all">
            {response.body}
          </pre>
        </div>
      )}
    </div>
  );
}
