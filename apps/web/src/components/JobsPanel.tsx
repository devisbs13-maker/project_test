import { useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/apiClient';
import type { Job, PlayerJob } from '../shared-shim';
import styles from './JobsPanel.module.css';

type ActiveJob = {
  playerJobId: string; // local id for tracking; backend accepts as jobId or playerJobId
  jobId: string;
  endsAt: number; // epoch ms
};

const STORAGE_KEY = 'jobs.active';

function loadActive(): ActiveJob[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as ActiveJob[];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function saveActive(list: ActiveJob[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

function fmt(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const hh = Math.floor(s / 3600);
  const mm = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  return [hh, mm, ss].map((v) => String(v).padStart(2, '0')).join(':');
}

export default function JobsPanel() {
  const qc = useQueryClient();
  const [active, setActive] = useState<ActiveJob[]>(() => loadActive());
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    saveActive(active);
  }, [active]);

  const jobsQuery = useQuery<Job[]>({
    queryKey: ['jobs'],
    queryFn: () => api.get<Job[]>('/jobs'),
    staleTime: 60_000,
  });

  const startMutation = useMutation({
    mutationFn: async (job: Job) => {
      const res = await api.post<PlayerJob>('/jobs/start', { jobId: job.id });
      const endsAt = Date.now() + job.durationMinutes * 60_000;
      const aj: ActiveJob = { playerJobId: res.jobId, jobId: res.jobId, endsAt };
      setActive((prev) => [...prev.filter((a) => a.jobId !== job.id), aj]);
      return res;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['jobs'] });
    },
  });

  const claimMutation = useMutation({
    mutationFn: async (aj: ActiveJob) => {
      const res = await api.post<PlayerJob>('/jobs/claim', { playerJobId: aj.playerJobId, jobId: aj.jobId });
      setActive((prev) => prev.filter((x) => x.jobId !== aj.jobId));
      return res;
    },
  });

  // On mount, auto-claim finished jobs by confirming with API
  useEffect(() => {
    const ended = active.filter((a) => a.endsAt <= Date.now());
    if (ended.length === 0) return;
    for (const aj of ended) {
      claimMutation.mutate(aj);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const jobs = jobsQuery.data ?? [];
  const byId = useMemo(() => new Map(jobs.map((j) => [j.id, j])), [jobs]);

  return (
    <section className={styles.panel}>
      <div className={styles.header}>
        <h2>Р Р°Р±РѕС‚С‹</h2>
        {jobsQuery.isFetching && <span className={styles.meta}>РѕР±РЅРѕРІР»РµРЅРёРµвЂ¦</span>}
      </div>
      <ul className={styles.list}>
        {jobs.map((job) => {
          const aj = active.find((a) => a.jobId === job.id);
          const remaining = aj ? Math.max(0, aj.endsAt - now) : 0;
          const canClaim = aj && remaining === 0;
          return (
            <li className={styles.item} key={job.id}>
              <div>
                <div>{job.name} вЂ” {job.rewardGold}g</div>
                <div className={styles.meta}>
                  {aj ? (
                    <span className={styles.timer}>РћСЃС‚Р°Р»РѕСЃСЊ: {fmt(remaining)}</span>
                  ) : (
                    <span>Р”Р»РёС‚РµР»СЊРЅРѕСЃС‚СЊ: {job.durationMinutes} РјРёРЅ</span>
                  )}
                </div>
              </div>
              <div className={styles.actions}>
                {!aj && (
                  <button
                    className={styles.btn}
                    onClick={() => startMutation.mutate(job)}
                    disabled={startMutation.isLoading}
                  >
                    РћС‚РїСЂР°РІРёС‚СЊ
                  </button>
                )}
                {aj && (
                  <button
                    className={styles.btn}
                    onClick={() => aj && claimMutation.mutate(aj)}
                    disabled={!canClaim || claimMutation.isLoading}
                  >
                    Р—Р°Р±СЂР°С‚СЊ
                  </button>
                )}
              </div>
            </li>
          );
        })}
        {jobs.length === 0 && (
          <li className={styles.item}>РќРµС‚ РґРѕСЃС‚СѓРїРЅС‹С… СЂР°Р±РѕС‚</li>
        )}
      </ul>
    </section>
  );
}
