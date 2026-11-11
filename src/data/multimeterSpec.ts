import { DialPositionSpec, MeterMode } from '../types/multimeter';

export const DIAL_SPECS: DialPositionSpec[] = [
  {
    mode: 'OFF',
    shortLabel: 'OFF',
    symbol: 'OFF',
    fullName: '關機檔 (Power Off)',
    angleDeg: -130,
    color: '#94a3b8',
    badgeBg: 'bg-slate-800 text-slate-300 border-slate-700',
    requiredRedJack: 'VOMA',
    connectionRule: '待機 (Standby)',
    powerRule: '皆可',
    unit: '',
    description:
      '使用完畢後務必將旋鈕轉回 OFF，避免內部 9V/AAA 電池耗盡。切換檔位前也應先將探棒離開待測電路。',
  },
  {
    mode: 'DCV',
    shortLabel: 'V⎓',
    symbol: 'V⎓',
    fullName: '直流電壓檔 (DC Voltage)',
    angleDeg: -95,
    color: '#38bdf8',
    badgeBg: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
    requiredRedJack: 'VOMA',
    connectionRule: '並聯 (Parallel)',
    powerRule: '需通電 (Power ON)',
    unit: 'V DC',
    description:
      '測量電池 (AA 1.5V、9V、18650)、USB 5V、麵包板 3.3V/5V 電源軌與元件跨壓。電表內阻極高 (~10MΩ)，必須「並聯」跨接在待測兩端；若紅黑探棒反接會顯示負號 (-)。',
  },
  {
    mode: 'ACV',
    shortLabel: 'V~',
    symbol: 'V~',
    fullName: '交流電壓檔 (AC Voltage True-RMS)',
    angleDeg: -58,
    color: '#fbbf24',
    badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    requiredRedJack: 'VOMA',
    connectionRule: '並聯 (Parallel)',
    powerRule: '需通電 (Power ON)',
    unit: 'V AC',
    description:
      '測量家用插座 (110V / 220V 60Hz) 或交流變壓器次級輸出。交流電方向隨時間正負交替，因此紅黑探棒對調數值相同（無正負極之分），但務必手握絕緣護套後端以防觸電！',
  },
  {
    mode: 'OHM',
    shortLabel: 'Ω',
    symbol: 'Ω',
    fullName: '電阻檔 (Resistance)',
    angleDeg: -18,
    color: '#34d399',
    badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    requiredRedJack: 'VOMA',
    connectionRule: '並聯 (Parallel)',
    powerRule: '必須斷電 (Power OFF!)',
    unit: 'Ω / kΩ / MΩ',
    description:
      '測量色碼電阻、可變電阻 (Potentiometer) 或光敏電阻。電表會由內部送出微小測試電流計算阻值，因此【待測電路絕對不可通電】，且建議將電阻單獨取下量測，避免並聯迴路干擾與手指同時碰觸兩端金屬腳。',
  },
  {
    mode: 'CONT',
    shortLabel: '🔊',
    symbol: '🔊',
    fullName: '導通蜂鳴檔 (Continuity / Beep Mode)',
    angleDeg: 22,
    color: '#22d3ee',
    badgeBg: 'bg-cyan-500/20 text-cyan-200 border-cyan-400/40',
    requiredRedJack: 'VOMA',
    connectionRule: '並聯 (Parallel)',
    powerRule: '必須斷電 (Power OFF!)',
    unit: 'Ω 🔊',
    description:
      '電子除錯神器！當兩探棒間阻值小於約 30Ω~50Ω 時，蜂鳴器會發出「嗶—」長音。常用於測試杜邦線是否內部斷芯、麵包板哪 5 孔互相導通（Beep Game）、以及焊接是否短路或虛焊。必須斷電操作！',
  },
  {
    mode: 'DIODE',
    shortLabel: '➔|',
    symbol: '➔|',
    fullName: '二極體 / LED 測試檔 (Diode Test)',
    angleDeg: 60,
    color: '#f472b6',
    badgeBg: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
    requiredRedJack: 'VOMA',
    connectionRule: '並聯 (Parallel)',
    powerRule: '必須斷電 (Power OFF!)',
    unit: 'V (Vf)',
    description:
      '電表內部輸出約 1mA~2mA 恆流源（開路電壓約 3.2V~3.5V），直接顯示二極體或 LED 的順向導通壓降 Vf（矽二極體約 0.65V；紅光 LED 約 1.9V、綠光約 2.1V、藍白光約 3.0~3.3V），且會讓 LED 微亮！反接則顯示 OL（逆向截止）。',
  },
  {
    mode: 'CAP',
    shortLabel: '⊣⊢',
    symbol: '⊣⊢',
    fullName: '電容檔 (Capacitance)',
    angleDeg: 95,
    color: '#a78bfa',
    badgeBg: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
    requiredRedJack: 'VOMA',
    connectionRule: '並聯 (Parallel)',
    powerRule: '必須斷電 (Power OFF!)',
    unit: 'nF / µF',
    description:
      '透過溫和充放電估算電容器儲存電荷能力（如 0.1µF 陶瓷電容、10µF / 1000µF 電解電容）。量測前務必先用 1kΩ 電阻跨接電容兩腳放電 5 秒！若帶著殘餘高壓直接量測，極易燒毀電表前端保護電路。',
  },
  {
    mode: 'DCMA',
    shortLabel: 'mA⎓',
    symbol: 'mA⎓',
    fullName: '直流毫安培電流檔 (DC Milliamps)',
    angleDeg: 130,
    color: '#fb923c',
    badgeBg: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
    requiredRedJack: 'VOMA',
    connectionRule: '串聯 (In Series)',
    powerRule: '需通電 (Power ON)',
    unit: 'mA',
    description:
      '測量 LED 迴路或微控制器工作電流（上限通常為 200mA~400mA，內建自復或玻璃保險絲）。必須將電路「剪開（斷開）」，讓電流從紅探棒流進電表、再從黑探棒流出回到負載（串聯）！絕對禁止直接跨接在電源正負極！',
  },
  {
    mode: 'DC10A',
    shortLabel: '10A⎓',
    symbol: '10A⎓',
    fullName: '直流大電流檔 (DC 10A High Current)',
    angleDeg: 162,
    color: '#ef4444',
    badgeBg: 'bg-red-500/20 text-red-300 border-red-500/40',
    requiredRedJack: '10A',
    connectionRule: '串聯 (In Series)',
    powerRule: '需通電 (Power ON)',
    unit: 'A',
    description:
      '測量馬達、加熱器或大功率燈條電流（最高 10A）。必須先將紅探棒拔起改插至左側專用的「10A」插孔，並以「串聯」方式接入迴路。量完電流後務必立刻把紅探棒插回 VΩmA 孔，否則下次量電壓會直接造成電源大短路！',
  },
];

export const MODE_MAP: Record<MeterMode, DialPositionSpec> = Object.fromEntries(
  DIAL_SPECS.map((d) => [d.mode, d])
) as Record<MeterMode, DialPositionSpec>;

export interface JackSocketSpec {
  id: '10A' | 'COM' | 'VOMA';
  label: string;
  subLabel: string;
  x: number;
  y: number;
  ringColor: string;
  description: string;
}

// Coordinates inside the Multimeter Body SVG (left side of workbench)
export const MULTIMETER_JACKS: JackSocketSpec[] = [
  {
    id: '10A',
    label: '10A MAX',
    subLabel: 'FUSED 10A/250V',
    x: 112,
    y: 412,
    ringColor: '#ef4444',
    description:
      '10A 大電流專用插孔（內部為極低阻值康銅分流器 ~0.01Ω）。僅在使用 10A 檔位串聯測大電流時將紅探棒插入此孔；平時切勿插在此孔去量電壓，否則等同把電源正負極直接短路！',
  },
  {
    id: 'COM',
    label: 'COM',
    subLabel: 'COMMON (-)',
    x: 195,
    y: 412,
    ringColor: '#475569',
    description:
      '共同接地端（Common Ground）。無論切換任何量測模式，【黑色探棒永远固定插在 COM 孔】不動！',
  },
  {
    id: 'VOMA',
    label: 'VΩmA',
    subLabel: '➔| 🔊 ⊣⊢ (<400mA)',
    x: 278,
    y: 412,
    ringColor: '#dc2626',
    description:
      '標準多功能正極插孔。95% 的日常量測（交直流電壓 V、電阻 Ω、導通蜂鳴 🔊、二極體/LED ➔|、電容 ⊣⊢、以及 400mA 以下小電流 mA）紅探棒都插在這裡！',
  },
];

// UniRegensburg SWH Tutorial 1 Golden Rule Table
export const GOLDEN_RULES_TABLE = [
  {
    quantity: '導通蜂鳴 / 短路測試 (Continuity 🔊)',
    connection: '並聯跨接 (Parallel)',
    canBePowered: 'NO! 絕對不可通電',
    redJack: 'VΩmA',
    note: '低於 ~30Ω 發出嗶聲；通電量測會誤判甚至損壞電表',
  },
  {
    quantity: '電阻量測 (Resistance Ω)',
    connection: '並聯跨接 (Parallel)',
    canBePowered: 'NO! 絕對不可通電',
    redJack: 'VΩmA',
    note: '需將元件與電源分離，且雙手勿同時捏住電阻兩端金屬腳',
  },
  {
    quantity: '二極體 / LED 測試 (Diode ➔|)',
    connection: '並聯跨接 (Parallel)',
    canBePowered: 'NO! 絕對不可通電',
    redJack: 'VΩmA',
    note: '紅接長腳(+)、黑接短腳(-)，顯示順向壓降 Vf 並微亮 LED',
  },
  {
    quantity: '電容量測 (Capacitance ⊣⊢)',
    connection: '並聯跨接 (Parallel)',
    canBePowered: 'NO! 必須先放電',
    redJack: 'VΩmA',
    note: '量測前先以 1kΩ 電阻跨接電容兩腳放電 5 秒',
  },
  {
    quantity: '直流 / 交流電壓 (Voltage V⎓ / V~)',
    connection: '並聯跨接 (Parallel)',
    canBePowered: 'YES 需通電量測',
    redJack: 'VΩmA',
    note: '電表內阻約 10MΩ，跨接於待測兩點量測電位差',
  },
  {
    quantity: '電流測量 (Current mA / 10A)',
    connection: '串聯接入 (In Series!)',
    canBePowered: 'YES 需通電量測',
    redJack: 'mA用 VΩmA / 大電流用 10A',
    note: '必須斷開電路將電表串入迴路！若並聯跨接電源會立刻燒毀保險絲',
  },
];
