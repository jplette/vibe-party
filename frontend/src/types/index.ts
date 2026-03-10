// ─── Domain Types ─────────────────────────────────────────────────────────────

export interface User {
  id: string;
  keycloakId: string;
  email: string;
  name: string;
  globalRole: 'admin' | 'user';
}

export interface Event {
  id: string;
  name: string;
  description?: string;
  date?: string;
  endDate?: string;
  locationName?: string;
  locationStreet?: string;
  locationCity?: string;
  locationZip?: string;
  locationCountry?: string;
  createdBy: string;
  createdAt: string;
}

export interface Todo {
  id: string;
  eventId: string;
  title: string;
  description?: string;
  assignedTo?: string;
  assignedInvitationId?: string;
  dueDate?: string;
  completedAt?: string;
  createdAt: string;
}

export type AssigneeOption =
  | { kind: 'member'; userId: string; name: string; email: string }
  | { kind: 'invitation'; invitationId: string; email: string; status?: 'pending' | 'accepted' | 'declined' };

export interface BringItem {
  id: string;
  eventId: string;
  name: string;
  quantity?: string;
  assignedTo?: string;
  assignedInvitationId?: string;
  fulfilledAt?: string;
}

export interface EventGuest {
  kind: 'member' | 'invitation';
  userId?: string;
  invitationId?: string;
  email: string;
  name: string;
  role: 'admin' | 'member' | 'guest';
}

export interface Invitation {
  id: string;
  eventId: string;
  email: string;
  status: 'pending' | 'accepted' | 'declined';
  invitedBy: string;
  createdAt: string;
}

export interface EventMember {
  userId: string;
  eventId: string;
  role: 'admin' | 'member';
  user?: User;
}

// ─── API Response Types ───────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ApiError {
  message: string;
  code?: string;
  status: number;
}

// ─── Form Types ───────────────────────────────────────────────────────────────

export interface EventFormValues {
  name: string;
  description?: string;
  date?: string;
  endDate?: string;
  locationName?: string;
  locationStreet?: string;
  locationCity?: string;
  locationZip?: string;
  locationCountry?: string;
}

export interface TodoFormValues {
  title: string;
  description?: string;
  assignedTo?: string;
}

export interface BringItemFormValues {
  name: string;
  quantity?: string;
  assignedTo?: string;
}

export interface InvitationFormValues {
  email: string;
}

// ─── Auth Types ───────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  roles: string[];
}
