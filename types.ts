
export interface Address {
  id: string;
  raw: string;
  name?: string;
  phone?: string;
  lat?: number;
  lng?: number;
  isValid: boolean;
  isCompleted: boolean;
  error?: string;
}

export interface RouteConfig {
  depot: string;
  vehicleCount: number;
  returnToStart: boolean;
}

export enum AppState {
  LANDING = 'LANDING',
  ERROR_REVIEW = 'ERROR_REVIEW',
  CONFIG = 'CONFIG',
  PROCESSING = 'PROCESSING',
  RESULTS = 'RESULTS'
}

export interface OptimizedStop extends Address {
  sequenceOrder: number;
  distanceFromPrevious?: number;
}
