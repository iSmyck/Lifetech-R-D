import { useState } from 'react';
import type { BmadAgent, BmadSkill } from '../types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Props {
  agents: BmadAgent[];
  skills: BmadSkill[];
  currentAgentId?: string | null;
  currentSkillId?: string | null;
  onSelect: (agentId: string, skillId: string) => void;
  onClose: () => void;
}

export default function AgentPicker({
  agents,
  skills,
  currentAgentId,
  currentSkillId,
  onSelect,
  onClose,
}: Props) {
  const [selectedAgent, setSelectedAgent] = useState<string>(currentAgentId || '');
  const [selectedSkill, setSelectedSkill] = useState<string>(currentSkillId || '');

  const agentSkills = (agentId: string) => {
    const agent = agents.find((a) => a.id === agentId);
    if (!agent) return skills;
    // Filter skills by module match or show all
    return skills.filter((s) => !s.module || s.module === agent.module || s.module === 'bmm');
  };

  const handleConfirm = () => {
    if (selectedAgent && selectedSkill) {
      onSelect(selectedAgent, selectedSkill);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-bmad-bg border border-bmad-border rounded-modal shadow-bmad-lg p-6 max-w-md w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-heading text-bmad-text font-semibold mb-1">Select Agent</h3>
        <p className="text-caption text-bmad-muted mb-4">
          Choose the BMAD agent and skill workflow for this thread.
        </p>

        {/* Agents grid */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          {agents.map((agent) => (
            <button
              key={agent.id}
              onClick={() => {
                setSelectedAgent(agent.id);
                // Auto-select first skill for this agent if none selected
                const avail = agentSkills(agent.id);
                if (avail.length > 0 && !avail.find((s) => s.skill_id === selectedSkill)) {
                  setSelectedSkill(avail[0].skill_id);
                }
              }}
              className={cn(
                'flex items-center gap-2 p-3 rounded-card border text-left transition-all',
                selectedAgent === agent.id
                  ? 'border-bmad-primary bg-bmad-primary/10'
                  : 'border-bmad-border bg-bmad-surface-raised hover:border-bmad-primary/30'
              )}
            >
              <span className="text-xl">{agent.icon}</span>
              <div>
                <div className="text-caption text-bmad-text font-medium">{agent.name}</div>
                <div className="text-[10px] text-bmad-muted">{agent.title}</div>
              </div>
            </button>
          ))}
        </div>

        {/* Skills */}
        {selectedAgent && (
          <div className="mb-4">
            <label className="text-[11px] text-bmad-muted font-medium mb-1.5 block">
              Skill Workflow
            </label>
            <div className="space-y-1.5">
              {agentSkills(selectedAgent).map((skill) => (
                <button
                  key={skill.skill_id}
                  onClick={() => setSelectedSkill(skill.skill_id)}
                  className={cn(
                    'w-full flex items-center gap-2 px-3 py-2 rounded-card border text-left transition-all',
                    selectedSkill === skill.skill_id
                      ? 'border-bmad-primary bg-bmad-primary/10'
                      : 'border-bmad-border bg-bmad-surface-raised hover:border-bmad-primary/30'
                  )}
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-caption text-bmad-text font-medium">{skill.name}</div>
                    <div className="text-[10px] text-bmad-muted truncate">{skill.description}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={handleConfirm}
            disabled={!selectedAgent || !selectedSkill}
            className={cn(
              'flex-1 px-4 py-2 rounded-button text-caption font-medium transition-all',
              selectedAgent && selectedSkill
                ? 'bg-bmad-primary hover:bg-bmad-primary-light text-white'
                : 'bg-bmad-surface-raised text-bmad-muted cursor-not-allowed'
            )}
          >
            Confirm Selection
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-button text-caption text-bmad-muted hover:text-bmad-text transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
