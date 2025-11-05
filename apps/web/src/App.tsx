import React, { useEffect, useState, lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';

// Lazy-load screens to avoid TDZ/cycle issues
const Home = lazy(() => import('./screens/Home'));
const Jobs = lazy(() => import('./screens/Jobs'));
const Quests = lazy(() => import('./screens/Quests'));
const Character = lazy(() => import('./screens/Character'));
const Monster = lazy(() => import('./screens/Monster'));
const Merchant = lazy(() => import('./screens/Merchant'));
const Clan = lazy(() => import('./screens/Clan'));
const ClanCreate = lazy(() => import('./screens/ClanCreate'));
const ClanBrowse = lazy(() => import('./screens/ClanBrowse'));
const Duel = lazy(() => import('./screens/Duel'));

import type { Player } from './store/player';
import { loadPlayer, savePlayer, tickEnergy, createPlayer, normalizePlayer } from './store/player';
import { ensureDevSession } from './store/session';
import { apiVerifyAuth, apiPlayerMe, apiPlayerSave } from './utils/api';
import { getTelegramUser } from './utils/telegram';
import { notifyEnergyFull } from './utils/energy';
import { showToast } from './utils/notify';

function usePlayerState() {
  const [player, setPlayer] = useState<Player | null>(null);
  useEffect(() => {
    const p = loadPlayer();
    if (p) setPlayer(p);
  }, []);
  useEffect(() => {
    if (!player) return;
    const id = setInterval(() => {
      const wasFull = player.energy >= player.energyMax;
      const next = tickEnergy(player);
      if (!wasFull && next.energy >= next.energyMax) {
        try { showToast('Energy is full'); } catch {}
        try { notifyEnergyFull(); } catch {}
      }
      if (next.energy !== player.energy || next.lastEnergyTs !== player.lastEnergyTs) {
        setPlayer(next);
        savePlayer(next);
      }
    }, 45000);
    return () => clearInterval(id);
  }, [player]);
  const updatePlayer = (p: Player) => { setPlayer(p); savePlayer(p); };
  return { player, updatePlayer } as const;
}

function HomeRoute({ player, updatePlayer }: { player: Player; updatePlayer: (p: Player)=>void }) {
  const navigate = useNavigate();
  return (
    <Home
      player={player}
      setScreen={(s) => {
        if (s === 'quests') navigate('/quests');
        else if (s === 'jobs') navigate('/jobs');
        else if (s === 'merchant') navigate('/merchant');
        else if (s === 'leaderboard') navigate('/monster');
        else if (s === 'monster') navigate('/monster');
        else if (s === 'character') navigate('/character');
        else if (s === 'home') navigate('/');
      }}
      onUpdatePlayer={updatePlayer}
      onOpenQuests={() => navigate('/quests')}
      onOpenJobs={() => navigate('/jobs')}
      onOpenArena={() => navigate('/duel')}
      onOpenGuild={() => navigate('/clan')}
      onOpenCharacter={() => navigate('/character')}
    />
  );
}

export default function App() {
  const { player, updatePlayer } = usePlayerState();
  useEffect(() => {
    ensureDevSession();
    (async () => {
      // Seed local player if missing
      let p = loadPlayer();
      if (!p) {
        p = createPlayer('warrior', 'Warrior');
        updatePlayer(p);
      } else if (!player) {
        updatePlayer(p);
      }
      // Try Telegram auth; if present, sync nickname
      try {
        const session = await apiVerifyAuth();
        if (session && p) {
          if (p.name !== session.name) {
            updatePlayer({ ...p, name: session.name });
          }
        }
      } catch {}
      // Load server snapshot if available
      try {
        const me = await apiPlayerMe();
        if (me?.ok && (me as any).data?.data) {
          const snap = normalizePlayer((me as any).data.data);
          updatePlayer(snap);
        }
      } catch {}
      // Fallback: WebApp user for display name
      try {
        const u = getTelegramUser();
        if (u && p) {
          const display = (u.username ? `@${u.username}` : [u.first_name, u.last_name].filter(Boolean).join(' ')) || p.name;
          if (display && display !== p.name) {
            updatePlayer({ ...p, name: display });
          }
        }
      } catch {}
    })();
  }, []);
  // Persist to server when player changes (debounced)
  useEffect(() => {
    if (!player) return;
    const id = setTimeout(() => { try { apiPlayerSave(player); } catch {} }, 600);
    return () => clearTimeout(id);
  }, [player]);
  return (
    <div className="app">
      <Suspense fallback={<div style={{padding:16}}>Loading…</div>}>
        <Routes>
          <Route path="/" element={player ? <HomeRoute player={player} updatePlayer={updatePlayer} /> : <div style={{padding:16}}>Loading…</div>} />
          <Route path="/quests" element={player ? (
            <Quests player={player} onBack={() => history.back()} onUpdatePlayer={updatePlayer} />
          ) : <Navigate to="/" replace />} />
          <Route path="/jobs" element={player ? (
            <Jobs player={player} onBack={() => history.back()} onUpdatePlayer={updatePlayer} />
          ) : <Navigate to="/" replace />} />
          <Route path="/character" element={player ? (
            <Character player={player} onBack={() => history.back()} onUpdatePlayer={updatePlayer} />
          ) : <Navigate to="/" replace />} />
          <Route path="/monster" element={player ? (
            <Monster player={player} onBack={() => history.back()} onUpdatePlayer={updatePlayer} />
          ) : <Navigate to="/" replace />} />
          <Route path="/merchant" element={player ? (
            <Merchant player={player} onBack={() => history.back()} onUpdatePlayer={updatePlayer} />
          ) : <Navigate to="/" replace />} />
          <Route path="/clan" element={player ? (
            <Clan player={player} onBack={() => history.back()} />
          ) : <Navigate to="/" replace />} />
          <Route path="/clan/create" element={player ? (
            <ClanCreate player={player} onBack={() => history.back()} />
          ) : <Navigate to="/" replace />} />
          <Route path="/clan/browse" element={player ? (
            <ClanBrowse player={player} onBack={() => history.back()} />
          ) : <Navigate to="/" replace />} />
          <Route path="/duel" element={player ? (
            <Duel player={player} onBack={() => history.back()} />
          ) : <Navigate to="/" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </div>
  );
}

