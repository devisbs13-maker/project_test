import { create } from 'zustand';
import type { Job } from '../shared-shim';

type JobsState = {
  jobs: Job[];
  setJobs: (j: Job[]) => void;
};

export const useJobsStore = create<JobsState>((set) => ({
  jobs: [],
  setJobs: (j) => set({ jobs: j }),
}));
