import { useState, useEffect, useCallback } from 'react';
import type { BmadAgent, BmadSkill } from '../types';

const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL || '';

export function useBmadRegistry() {
  const [agents, setAgents] = useState<BmadAgent[]>([]);
  const [skills, setSkills] = useState<BmadSkill[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRegistry = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [agentsRes, skillsRes] = await Promise.all([
        fetch(`${API_BASE}/api/bmad/agents`),
        fetch(`${API_BASE}/api/bmad/skills`),
      ]);
      if (!agentsRes.ok || !skillsRes.ok) {
        throw new Error('Failed to load BMAD registry');
      }
      const agentsData = await agentsRes.json();
      const skillsData = await skillsRes.json();
      setAgents(agentsData);
      setSkills(skillsData);
    } catch (err: any) {
      setError(err?.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRegistry();
  }, [fetchRegistry]);

  const getAgent = useCallback(
    (agentId: string | null | undefined): BmadAgent | undefined => {
      if (!agentId) return undefined;
      return agents.find((a) => a.id === agentId);
    },
    [agents]
  );

  const getSkill = useCallback(
    (skillId: string | null | undefined): BmadSkill | undefined => {
      if (!skillId) return undefined;
      return skills.find((s) => s.skill_id === skillId);
    },
    [skills]
  );

  return { agents, skills, loading, error, getAgent, getSkill, refetch: fetchRegistry };
}
