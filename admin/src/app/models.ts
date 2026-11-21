// Shared TypeScript types for the operator console

export const PRIORITIES = ['P1', 'P2', 'P3', 'P4'] as const;
export const TEAMS = ['NET', 'DB', 'APP', 'SEC'] as const;

export type Priority = (typeof PRIORITIES)[number];
export type Team = (typeof TEAMS)[number];
export type Status = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';

export interface WorkNote {
  incidentId: string;
  author: string;
  authorName: string;
  text: string;
  createdAt: string;
}

export interface Incident {
  incidentId: string;
  title: string;
  description?: string;
  priority: Priority;
  team: Team;
  status: Status;
  assignee?: string | null;
  slaDueAt: string;
  slaBreached?: boolean;
  escalated?: boolean;
  escalatedTo?: string;
  createdBy?: string;
  createdAt: string;
  resolvedAt?: string | null;
  resolution?: string;
  history?: { status: Status; at: string; by?: string }[];
  notes?: WorkNote[];
}

export interface User {
  sub: string;
  name: string;
  role: 'manager' | 'operator';
  team: Team | null;
}

export interface Session {
  token: string;
  user: User;
}

export interface NewIncident {
  title: string;
  priority: Priority;
  team: Team;
  description: string;
}

export interface IncidentFilters {
  status: string;
  priority: string;
  team: string;
  mine: boolean;
}