import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';

// Original screens with styling and layout
import Home from './screens/Home';
import Jobs from './screens/Jobs';
import Quests from './screens/Quests';
import Character from './screens/Character';
// import Leaderboard from './screens/Leaderboard';
import Monster from './screens/Monster';
import Merchant from './screens/Merchant';
import Clan from './screens/Clan';
import ClanCreate from './screens/ClanCreate';
import ClanBrowse from './screens/ClanBrowse';

import type { Player } from './store/player';
import { loadPlayer, savePlayer, tickEnergy, createPlayer } from './store/player';
import { ensureDevSession } from './store/session';
import { apiVerifyAuth } from './utils/api';
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
        try { showToast('Энергия полная ⚡'); } catch {}
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
      onOpenArena={() => alert('Арена появится позже')}
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
        p = createPlayer('warrior', '\\u0412\\u043e\\u0438\\u043d');
        updatePlayer(p);
      } else if (!player) {
        updatePlayer(p);
      }
      // Try Telegram auth; if present, sync nickname to Telegram username/display name
      try {
        const session = await apiVerifyAuth();
        if (session && p) {
          if (p.name !== session.name) {
            updatePlayer({ ...p, name: session.name });
          }
        }
      } catch {}

      // Fallback: if API is unreachable but WebApp is present, use client-side TG user for display name
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
  return (
    <div className="app">
      <Routes>
        <Route path="/" element={player ? <HomeRoute player={player} updatePlayer={updatePlayer} /> : <div style={{padding:16}}>{'\\u0417\\u0430\\u0433\\u0440\\u0443\\u0437\\u043a\\u0430\\u2026'}</div>} />
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
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}
