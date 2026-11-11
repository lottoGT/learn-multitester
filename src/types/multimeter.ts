export type MeterMode =
  | 'OFF'
  | 'DCV'
  | 'ACV'
  | 'OHM'
  | 'CONT'
  | 'DIODE'
  | 'CAP'
  | 'DCMA'
  | 'DC10A';

export type RedJackPort = 'VOMA' | '10A';

export interface DialPositionSpec {
  mode: MeterMode;
  shortLabel: string;
  symbol: string;
  fullName: string;
  angleDeg: number; // angle around rotary dial
  color: string;
  badgeBg: string;
  requiredRedJack: RedJackPort;
  connectionRule: '並聯 (Parallel)' | '串聯 (In Series)' | '待機 (Standby)';
  powerRule: '需通電 (Power ON)' | '必須斷電 (Power OFF!)' | '皆可';
  unit: string;
  description: string;
}

export interface TestPoint {
  id: string;
  label: string;
  shortLabel: string;
  x: number; // SVG coordinate in the Device stage (x: 430..1050, y: 40..430)
  y: number;
  polarityHint?: '+' | '-' | 'node' | 'ac';
  description: string;
}

export interface SimControlOption {
  value: number;
  label: string;
}

export interface SimControl {
  id: string;
  label: string;
  type: 'range' | 'toggle' | 'select';
  min?: number;
  max?: number;
  step?: number;
  defaultValue: number;
  unit?: string;
  options?: SimControlOption[];
}

export interface FormulaCard {
  title: string;
  formula: string;
  explanation: string;
}

export interface MeasurementLesson {
  id: string;
  chapter: string;
  title: string;
  subtitle: string;
  category: 'DCV' | 'ACV' | 'OHM' | 'CONT' | 'DIODE' | 'CAP' | 'CURRENT';
  difficulty: '入門' | '進階';
  guideRef: string;
  summary: string;
  connectionType: '並聯 (Parallel)' | '串聯 (In Series)';
  canCircuitBePowered: 'YES (需通電量測)' | 'NO! (必須斷電量測)';
  recommendedMode: MeterMode;
  recommendedRedJack: RedJackPort;
  defaultRedPointId: string;
  defaultBlackPointId: string;
  testPoints: TestPoint[];
  simControls: SimControl[];
  stepByStepGuide: string[];
  principles: string[];
  pitfalls: string[];
  formulasAndRef: FormulaCard[];
  quizTarget: {
    question: string;
    expectedMode: MeterMode;
    expectedRedJack: RedJackPort;
    validPairs: { red: string; black: string; allowReverse?: boolean }[];
    hint: string;
  };
}

export interface MeterSimulationResult {
  lcdMainText: string;
  lcdUnit: string;
  lcdSubText: string;
  isNegative: boolean;
  isBeep: boolean;
  isOverload: boolean;
  isDangerAlert: boolean;
  isFuseBlown: boolean;
  ledGlowIntensity: number; // 0..1 when diode mode lights up an LED or circuit is powered
  statusTone: 'ok' | 'warn' | 'danger' | 'neutral';
  statusTitle: string;
  statusDetail: string;
  inspectorLogs: string[];
}
