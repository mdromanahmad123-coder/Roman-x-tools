export type FirebaseValue = string | number | boolean | null | object;

export interface DbConnection {
  url: string;
  connected: boolean;
}

export interface NodeProps {
  path: string;
  name: string;
  value: FirebaseValue;
  dbUrl: string;
  onRefresh: () => void;
  depth?: number;
}

export interface Notification {
  type: 'success' | 'error' | 'info';
  message: string;
  id: number;
}