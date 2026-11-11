import React from 'react';
import { MeasurementLesson } from '../types/multimeter';
import { getResistorColorBands } from '../utils/simulator';

interface DeviceSceneProps {
  lesson: MeasurementLesson;
  simValues: Record<string, number>;
  setSimValues: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  ledGlowIntensity: number;
  isBeep: boolean;
  isDangerAlert: boolean;
}

export const DeviceSceneSvg: React.FC<DeviceSceneProps> = ({
  lesson,
  simValues,
  setSimValues,
  ledGlowIntensity,
  isBeep,
  isDangerAlert,
}) => {
  const id = lesson.id;

  // ==========================================================================
  // 1. DC BATTERY TEST SCENE
  // ==========================================================================
  if (id === 'dc-battery-test') {
    const batType = simValues['batteryType'] ?? 0;
    const charge = simValues['chargePct'] ?? 95;
    const batTitles = [
      'AA 1.5V 鹼性電池 (LR6)',
      '9V 6F22 方型電池 (PP3)',
      '18650 3.7V 鋰離子電池 (Li-ion)',
      'CR2032 3.0V 鋰鈕扣電池',
    ];
    const bodyColors = ['#eab308', '#2563eb', '#ec4899', '#94a3b8'];

    return (
      <g>
        {/* Title Banner */}
        <text
          x={745}
          y={68}
          textAnchor="middle"
          className="fill-slate-200 text-sm font-bold"
        >
          🔋 待測直流電源：{batTitles[batType] || batTitles[0]}
        </text>
        <text
          x={745}
          y={88}
          textAnchor="middle"
          className="fill-slate-400 text-[11px]"
        >
          點擊下方測試點移動紅黑探棒，或點「🔄 對調正負極」觀察負號 (-)
        </text>

        {/* Battery Cylinder Graphic (between x=625 and x=875, y=125..200) */}
        {/* Positive Nub on Left (x=615, y=162) */}
        <rect
          x={608}
          y={144}
          width={20}
          height={36}
          rx={4}
          fill="#cbd5e1"
          stroke="#f8fafc"
          strokeWidth={2}
        />
        {/* Main Battery Body */}
        <rect
          x={626}
          y={116}
          width={250}
          height={92}
          rx={10}
          fill="#0f172a"
          stroke={bodyColors[batType] || '#eab308'}
          strokeWidth={3}
        />
        {/* Left Positive Accent Section */}
        <rect
          x={628}
          y={118}
          width={75}
          height={88}
          rx={8}
          fill={bodyColors[batType] || '#eab308'}
          opacity={0.85}
        />
        {/* Negative Metal Plate on Right (x=885, y=162) */}
        <rect
          x={876}
          y={132}
          width={14}
          height={60}
          rx={3}
          fill="#94a3b8"
          stroke="#e2e8f0"
          strokeWidth={1.5}
        />

        {/* + and - Symbols on Battery */}
        <text
          x={665}
          y={170}
          textAnchor="middle"
          className="fill-slate-900 text-base font-black font-mono"
        >
          + POS
        </text>
        <text
          x={842}
          y={170}
          textAnchor="middle"
          className="fill-slate-300 text-sm font-black font-mono"
        >
          - NEG
        </text>

        {/* Charge Bar Inside Battery */}
        <rect
          x={716}
          y={138}
          width={96}
          height={20}
          rx={4}
          fill="#1e293b"
          stroke="#475569"
          strokeWidth={1.2}
        />
        <rect
          x={718}
          y={140}
          width={Math.max(4, Math.round((charge / 100) * 92))}
          height={16}
          rx={3}
          fill={
            charge >= 70 ? '#10b981' : charge >= 35 ? '#f59e0b' : '#ef4444'
          }
        />
        <text
          x={764}
          y={153}
          textAnchor="middle"
          className="fill-white text-[10px] font-mono font-bold"
        >
          電量 {charge}%
        </text>
        <text
          x={764}
          y={184}
          textAnchor="middle"
          className="fill-amber-300 text-[10px] font-mono"
        >
          塑膠絕緣外皮 (不導電)
        </text>

        {/* Reference Box at Bottom */}
        <rect
          x={500}
          y={310}
          width={490}
          height={98}
          rx={10}
          fill="#0f172a"
          stroke="#334155"
          strokeWidth={1.5}
        />
        <text
          x={520}
          y={334}
          className="fill-cyan-300 text-xs font-bold"
        >
          💡 為什麼紅黑探棒反接會出現「-」負號？
        </text>
        <text
          x={520}
          y={356}
          className="fill-slate-300 text-[11px]"
        >
          • 數位電表永遠計算：顯示電壓 = 紅探棒電位 (V_red) − 黑探棒電位 (V_COM)
        </text>
        <text
          x={520}
          y={376}
          className="fill-slate-300 text-[11px]"
        >
          • 正接時：1.58V − 0V = +1.58V ｜ 反接時：0V − 1.58V = -1.58V（安全無損！）
        </text>
        <text
          x={520}
          y={396}
          className="fill-amber-300 text-[11px] font-mono"
        >
          • AA滿電 ≈ 1.58V (沒電 &lt;1.2V) ｜ 9V滿電 ≈ 9.4V ｜ 18650滿電 ≈ 4.20V
        </text>
      </g>
    );
  }

  // ==========================================================================
  // 2. USB & MB-102 BREADBOARD POWER SUPPLY SCENE
  // ==========================================================================
  if (id === 'usb-mb102-rails') {
    const powerOn = (simValues['mbPowerOn'] ?? 1) === 1;
    const topMode = simValues['topRailMode'] ?? 50;
    const botMode = simValues['botRailMode'] ?? 33;

    return (
      <g>
        <text
          x={745}
          y={58}
          textAnchor="middle"
          className="fill-slate-200 text-sm font-bold"
        >
          🔌 MB-102 麵包板雙軌電源模組 (5.0V / 3.3V 可調跳帽)
        </text>

        {/* Breadboard Body */}
        <rect
          x={490}
          y={78}
          width={510}
          height={330}
          rx={14}
          fill="#f8fafc"
          stroke="#cbd5e1"
          strokeWidth={3}
        />

        {/* Top Power Rails (+ Red and - Blue) */}
        <line
          x1={610}
          y1={92}
          x2={980}
          y2={92}
          stroke="#ef4444"
          strokeWidth={2.5}
        />
        <text x={595} y={98} className="fill-red-600 text-xs font-black font-mono">
          +
        </text>
        <line
          x1={610}
          y1={162}
          x2={980}
          y2={162}
          stroke="#2563eb"
          strokeWidth={2.5}
        />
        <text x={595} y={166} className="fill-blue-600 text-xs font-black font-mono">
          -
        </text>

        {/* Top Rail Holes */}
        {Array.from({ length: 14 }, (_, i) => {
          const hx = 630 + i * 25;
          return (
            <g key={`tr-${i}`}>
              <rect x={hx - 4} y={101} width={8} height={8} rx={1.5} fill="#334155" />
              <rect x={hx - 4} y={144} width={8} height={8} rx={1.5} fill="#334155" />
            </g>
          );
        })}

        {/* Center Breadboard Area */}
        <rect
          x={605}
          y={205}
          width={375}
          height={70}
          rx={6}
          fill="#e2e8f0"
          stroke="#cbd5e1"
          strokeWidth={1.5}
        />
        <text
          x={792}
          y={236}
          textAnchor="middle"
          className="fill-slate-600 text-xs font-bold"
        >
          MB-102 830孔麵包板中央實驗區
        </text>
        <text
          x={792}
          y={256}
          textAnchor="middle"
          className="fill-slate-500 text-[11px] font-mono"
        >
          上軌設定: {topMode === 50 ? '5.0V' : topMode === 33 ? '3.3V' : 'OFF'} ｜ 下軌設定:{' '}
          {botMode === 50 ? '5.0V' : '3.3V'}
        </text>

        {/* Bottom Power Rails (+ Red and - Blue) */}
        <line
          x1={610}
          y1={318}
          x2={980}
          y2={318}
          stroke="#ef4444"
          strokeWidth={2.5}
        />
        <text x={595} y={324} className="fill-red-600 text-xs font-black font-mono">
          +
        </text>
        <line
          x1={610}
          y1={388}
          x2={980}
          y2={388}
          stroke="#2563eb"
          strokeWidth={2.5}
        />
        <text x={595} y={392} className="fill-blue-600 text-xs font-black font-mono">
          -
        </text>

        {/* Bottom Rail Holes */}
        {Array.from({ length: 14 }, (_, i) => {
          const hx = 630 + i * 25;
          return (
            <g key={`br-${i}`}>
              <rect x={hx - 4} y={328} width={8} height={8} rx={1.5} fill="#334155" />
              <rect x={hx - 4} y={371} width={8} height={8} rx={1.5} fill="#334155" />
            </g>
          );
        })}

        {/* MB-102 Black PCB Module Snapped on Left Side of Breadboard */}
        <rect
          x={480}
          y={74}
          width={110}
          height={338}
          rx={10}
          fill="#0f172a"
          stroke="#38bdf8"
          strokeWidth={2.5}
        />
        <text
          x={535}
          y={98}
          textAnchor="middle"
          className="fill-cyan-300 text-xs font-bold font-mono"
        >
          MB-102
        </text>
        {/* Top Jumper Block */}
        <rect
          x={498}
          y={112}
          width={74}
          height={32}
          rx={4}
          fill="#1e293b"
          stroke="#eab308"
          strokeWidth={1.5}
        />
        <text
          x={535}
          y={132}
          textAnchor="middle"
          className="fill-amber-300 text-[10px] font-mono font-bold"
        >
          上跳帽: {topMode === 50 ? '5V' : topMode === 33 ? '3.3V' : 'OFF'}
        </text>

        {/* Power Switch Button (Clickable on Canvas!) */}
        <g
          onClick={() =>
            setSimValues((prev) => ({
              ...prev,
              mbPowerOn: (prev.mbPowerOn ?? 1) === 1 ? 0 : 1,
            }))
          }
          className="cursor-pointer"
        >
          <rect
            x={502}
            y={188}
            width={66}
            height={52}
            rx={6}
            fill={powerOn ? '#0284c7' : '#334155'}
            stroke="#f8fafc"
            strokeWidth={2}
          />
          <text
            x={535}
            y={210}
            textAnchor="middle"
            className="fill-white text-[10px] font-bold"
          >
            電源開關
          </text>
          <text
            x={535}
            y={227}
            textAnchor="middle"
            className="fill-amber-300 text-xs font-black font-mono"
          >
            {powerOn ? 'ON' : 'OFF'}
          </text>
        </g>

        {/* Power Green LED */}
        <circle
          cx={535}
          cy={265}
          r={7}
          fill={powerOn ? '#22c55e' : '#1e293b'}
          stroke="#e2e8f0"
          strokeWidth={1.5}
        />
        <text
          x={535}
          y={285}
          textAnchor="middle"
          className="fill-slate-400 text-[9px] font-mono"
        >
          PWR LED
        </text>

        {/* Bottom Jumper Block */}
        <rect
          x={498}
          y={334}
          width={74}
          height={32}
          rx={4}
          fill="#1e293b"
          stroke="#eab308"
          strokeWidth={1.5}
        />
        <text
          x={535}
          y={354}
          textAnchor="middle"
          className="fill-amber-300 text-[10px] font-mono font-bold"
        >
          下跳帽: {botMode === 50 ? '5V' : '3.3V'}
        </text>
      </g>
    );
  }

  // ==========================================================================
  // 3. RESISTOR & POTENTIOMETER SCENE (OHM)
  // ==========================================================================
  if (id === 'resistor-pot-ohm') {
    const resOhms = simValues['resistorOhms'] ?? 1000;
    const potPct = simValues['potTurnPct'] ?? 35;
    const fingers = (simValues['fingersTouching'] ?? 0) === 1;
    const powered = (simValues['circuitPowered'] ?? 0) === 1;
    const bandInfo = getResistorColorBands(resOhms);
    const r12 = ((potPct / 100) * 10).toFixed(2);
    const r23 = (((100 - potPct) / 100) * 10).toFixed(2);

    return (
      <g>
        <text
          x={745}
          y={55}
          textAnchor="middle"
          className="fill-slate-200 text-sm font-bold"
        >
          🎨 四環色碼電阻 &amp; B10K (10kΩ) 三腳可變電阻量測台
        </text>

        {/* Top Card: 4-Band Resistor */}
        <rect
          x={485}
          y={72}
          width={515}
          height={138}
          rx={12}
          fill="#0f172a"
          stroke={powered ? '#ef4444' : '#334155'}
          strokeWidth={2}
        />
        <text x={508} y={96} className="fill-cyan-300 text-xs font-bold">
          1. 待測四環色碼電阻 ({resOhms >= 1000 ? resOhms / 1000 + ' kΩ' : resOhms + ' Ω'}) — 色環：{bandInfo.names.join(' · ')}
        </text>
        {powered && (
          <text x={508} y={196} className="fill-rose-400 text-xs font-bold">
            ⚠️ 警告：目前處於錯誤通電狀態 (Power ON)，請先切斷電源再量電阻！
          </text>
        )}

        {/* Metal Leads */}
        <line
          x1={590}
          y1={135}
          x2={900}
          y2={135}
          stroke="#cbd5e1"
          strokeWidth={6}
          strokeLinecap="round"
        />
        {/* Resistor Body */}
        <rect
          x={655}
          y={113}
          width={140}
          height={44}
          rx={16}
          fill="#fde68a"
          stroke="#92400e"
          strokeWidth={2.5}
        />
        {/* 4 Color Bands */}
        {bandInfo.colors.map((c, idx) => (
          <rect
            key={idx}
            x={678 + idx * 28}
            y={114}
            width={11}
            height={42}
            fill={c}
          />
        ))}

        {/* Fingers Touching Warning Overlay */}
        {fingers && (
          <g>
            <ellipse
              cx={612}
              cy={135}
              rx={18}
              ry={26}
              fill="#f43f5e"
              opacity={0.45}
              stroke="#fda4af"
              strokeWidth={1.5}
            />
            <ellipse
              cx={838}
              cy={135}
              rx={18}
              ry={26}
              fill="#f43f5e"
              opacity={0.45}
              stroke="#fda4af"
              strokeWidth={1.5}
            />
            <path
              d="M 612 102 Q 725 65 838 102"
              fill="none"
              stroke="#fb7185"
              strokeWidth={2.5}
              strokeDasharray="5 4"
            />
            <text
              x={725}
              y={184}
              textAnchor="middle"
              className="fill-rose-300 text-[11px] font-bold"
            >
              🖐️ 雙手同時捏住金屬腳：並聯人體電阻 (~300kΩ) 造成高阻值嚴重低估！
            </text>
          </g>
        )}

        {/* Bottom Card: 10kΩ Potentiometer */}
        <rect
          x={485}
          y={224}
          width={515}
          height={196}
          rx={12}
          fill="#0f172a"
          stroke="#334155"
          strokeWidth={2}
        />
        <text x={508} y={248} className="fill-amber-300 text-xs font-bold">
          2. WH148 B10K 線性可變電阻 (旋鈕位置 {potPct}% ➔ R₁₂ = {r12}kΩ, R₂₃ = {r23}kΩ, R₁₃ = 10.0kΩ)
        </text>

        {/* Potentiometer Legs to Pin1 (615,345), Pin2 (725,345), Pin3 (835,345) */}
        <line x1={695} y1={305} x2={615} y2={345} stroke="#94a3b8" strokeWidth={4} />
        <line x1={725} y1={305} x2={725} y2={345} stroke="#eab308" strokeWidth={4} />
        <line x1={755} y1={305} x2={835} y2={345} stroke="#94a3b8" strokeWidth={4} />

        {/* Potentiometer Circular Body */}
        <circle
          cx={725}
          cy={285}
          r={36}
          fill="#0f766e"
          stroke="#5eead4"
          strokeWidth={2.5}
        />
        {/* Carbon Track Arc */}
        <circle
          cx={725}
          cy={285}
          r={24}
          fill="#1e293b"
          stroke="#94a3b8"
          strokeWidth={2}
        />
        {/* Rotating Knob Pointer */}
        <g
          transform={`translate(725, 285) rotate(${-130 + (potPct / 100) * 260})`}
        >
          <line
            x1={0}
            y1={4}
            x2={0}
            y2={-22}
            stroke="#fbbf24"
            strokeWidth={4}
            strokeLinecap="round"
          />
          <circle cx={0} cy={0} r={5} fill="#f8fafc" />
        </g>

        <text
          x={725}
          y={402}
          textAnchor="middle"
          className="fill-slate-400 text-[11px]"
        >
          💡 Pin 1 ↔ Pin 3 為固定碳膜總長 (10kΩ)；中間腳 Pin 2 為旋轉滑臂 (Wiper)
        </text>
      </g>
    );
  }

  // ==========================================================================
  // 4. CONTINUITY BEEP GAME & JUMPER WIRE SCENE
  // ==========================================================================
  if (id === 'continuity-beep-game') {
    const suspectState = simValues['suspectWireFault'] ?? 1;

    return (
      <g>
        <text
          x={745}
          y={55}
          textAnchor="middle"
          className="fill-slate-200 text-sm font-bold"
        >
          🔊 導通蜂鳴尋線遊戲 (The Beep Game) &amp; 杜邦線斷芯抓漏
        </text>

        {/* Top Section: Breadboard Cutaway */}
        <rect
          x={485}
          y={72}
          width={515}
          height={155}
          rx={12}
          fill="#f8fafc"
          stroke="#94a3b8"
          strokeWidth={2.5}
        />
        <text x={505} y={94} className="fill-slate-900 text-xs font-bold">
          任務 A：麵包板內部 5 孔銅片尋跡（同欄 A1~E1 導通，跨中央凹槽 F1 或隔壁欄 A2 絕緣）
        </text>

        {/* Internal 5-Hole Copper Strip Illustration under Row 1 (A1..E1) */}
        <rect
          x={552}
          y={108}
          width={146}
          height={24}
          rx={6}
          fill="#06b6d4"
          opacity={0.28}
          stroke="#0891b2"
          strokeWidth={1.5}
          strokeDasharray="4 2"
        />
        {/* Center Ravine Groove */}
        <rect
          x={722}
          y={100}
          width={32}
          height={110}
          rx={4}
          fill="#cbd5e1"
        />
        <text
          x={738}
          y={158}
          textAnchor="middle"
          className="fill-slate-600 text-[9px] font-bold"
          transform="rotate(-90 738 158)"
        >
          中央凹槽隔離
        </text>

        {/* Right 5-Hole Strip (F1..J1) */}
        <rect
          x={772}
          y={108}
          width={146}
          height={24}
          rx={6}
          fill="#f59e0b"
          opacity={0.2}
          stroke="#d97706"
          strokeWidth={1.5}
          strokeDasharray="4 2"
        />

        {/* Row 2 Strip (A2..E2) */}
        <rect
          x={552}
          y={173}
          width={146}
          height={24}
          rx={6}
          fill="#64748b"
          opacity={0.2}
          stroke="#475569"
          strokeWidth={1.5}
          strokeDasharray="4 2"
        />

        {/* Bottom Section: Jumper Wires */}
        <rect
          x={485}
          y={240}
          width={515}
          height={180}
          rx={12}
          fill="#0f172a"
          stroke="#334155"
          strokeWidth={2}
        />
        <text x={505} y={262} className="fill-cyan-300 text-xs font-bold">
          任務 B：測試兩條杜邦跳線，找出哪一條是害電路不通的「內部斷芯嫌疑線」！
        </text>

        {/* Good Blue Jumper Wire (y=285) */}
        <line
          x1={575}
          y1={285}
          x2={895}
          y2={285}
          stroke="#3b82f6"
          strokeWidth={7}
          strokeLinecap="round"
        />
        <rect x={595} y={278} width={28} height={14} rx={2} fill="#1e293b" />
        <rect x={847} y={278} width={28} height={14} rx={2} fill="#1e293b" />
        <text
          x={735}
          y={278}
          textAnchor="middle"
          className="fill-cyan-300 text-[11px] font-bold"
        >
          1號 藍色杜邦線 (良品 0.15Ω)
        </text>

        {/* Suspect Yellow Jumper Wire (y=358) */}
        <line
          x1={575}
          y1={358}
          x2={715}
          y2={358}
          stroke="#eab308"
          strokeWidth={7}
          strokeLinecap="round"
        />
        <line
          x1={755}
          y1={358}
          x2={895}
          y2={358}
          stroke="#eab308"
          strokeWidth={7}
          strokeLinecap="round"
        />
        <rect x={595} y={351} width={28} height={14} rx={2} fill="#1e293b" />
        <rect x={847} y={351} width={28} height={14} rx={2} fill="#1e293b" />

        {/* X-Ray Magnifier on Suspect Wire Center */}
        <circle
          cx={735}
          cy={358}
          r={24}
          fill="#020617"
          stroke={suspectState === 0 ? '#10b981' : '#f43f5e'}
          strokeWidth={2}
          strokeDasharray="3 2"
        />
        {suspectState === 1 ? (
          <text
            x={735}
            y={362}
            textAnchor="middle"
            className="fill-rose-400 text-[10px] font-black"
          >
            ✂️斷芯
          </text>
        ) : suspectState === 2 ? (
          <text
            x={735}
            y={362}
            textAnchor="middle"
            className="fill-amber-400 text-[10px] font-bold"
          >
            85Ω氧化
          </text>
        ) : (
          <line x1={715} y1={358} x2={755} y2={358} stroke="#22c55e" strokeWidth={5} />
        )}
        <text
          x={735}
          y={402}
          textAnchor="middle"
          className="fill-amber-300 text-[11px] font-bold"
        >
          2號 黃色嫌疑杜邦線 (點擊兩端針腳用 🔊 導通檔驗證)
        </text>
      </g>
    );
  }

  // ==========================================================================
  // 5. DIODE & LED POLARITY SCENE
  // ==========================================================================
  if (id === 'diode-led-polarity') {
    const ledType = simValues['ledColorType'] ?? 0;
    const ledPalette = [
      { name: '紅光 LED (Vf ≈ 1.92V)', color: '#ef4444' },
      { name: '黃光 LED (Vf ≈ 2.04V)', color: '#eab308' },
      { name: '綠光 LED (Vf ≈ 2.18V)', color: '#10b981' },
      { name: '藍光 LED (Vf ≈ 3.16V)', color: '#3b82f6' },
      { name: '白光 LED (Vf ≈ 3.26V)', color: '#f8fafc' },
    ];
    const activeLed = ledPalette[ledType] || ledPalette[0];

    return (
      <g>
        <text
          x={745}
          y={55}
          textAnchor="middle"
          className="fill-slate-200 text-sm font-bold"
        >
          💡 二極體檔 (➔|) 順向壓降 Vf 與 LED 點亮測試
        </text>

        {/* Top Card: 5mm LED */}
        <rect
          x={485}
          y={72}
          width={515}
          height={175}
          rx={12}
          fill="#0f172a"
          stroke="#334155"
          strokeWidth={2}
        />
        <text x={508} y={96} className="fill-cyan-300 text-xs font-bold">
          1. 5mm 發光二極體：{activeLed.name} — 紅探棒接長腳(+)、黑探棒接短腳(-)即會微亮！
        </text>

        {/* LED Leads: Anode Long Leg (590,195) and Cathode Short Leg (700,195) */}
        <line
          x1={632}
          y1={148}
          x2={590}
          y2={195}
          stroke="#cbd5e1"
          strokeWidth={4}
          strokeLinecap="round"
        />
        <line
          x1={658}
          y1={148}
          x2={700}
          y2={195}
          stroke="#94a3b8"
          strokeWidth={4}
          strokeLinecap="round"
        />

        {/* Glowing Halo when forward biased in Diode Mode */}
        {ledGlowIntensity > 0.1 && (
          <>
            <circle
              cx={645}
              cy={122}
              r={46}
              fill={activeLed.color}
              opacity={0.32 * ledGlowIntensity}
            />
            <circle
              cx={645}
              cy={122}
              r={28}
              fill={activeLed.color}
              opacity={0.55 * ledGlowIntensity}
            />
          </>
        )}

        {/* LED Dome */}
        <path
          d="M 623 148 L 623 118 A 22 22 0 0 1 667 118 L 667 148 Z"
          fill={activeLed.color}
          fillOpacity={ledGlowIntensity > 0.1 ? 0.95 : 0.35}
          stroke="#f8fafc"
          strokeWidth={2}
        />
        {/* LED Reference Table on Right of Top Card */}
        <rect
          x={760}
          y={104}
          width={220}
          height={125}
          rx={8}
          fill="#020617"
          stroke="#1e293b"
          strokeWidth={1.5}
        />
        <text x={774} y={124} className="fill-amber-300 text-[11px] font-bold">
          📌 LED 極性與 Vf 速查表
        </text>
        <text x={774} y={144} className="fill-slate-300 text-[10.5px] font-mono">
          • 陽極 (+): 長腳 / 內部小支架
        </text>
        <text x={774} y={162} className="fill-slate-300 text-[10.5px] font-mono">
          • 陰極 (-): 短腳 / 燈殼切平邊
        </text>
        <text x={774} y={182} className="fill-rose-300 text-[10.5px] font-mono">
          • 紅/黃/綠 Vf: 1.9V ~ 2.2V
        </text>
        <text x={774} y={200} className="fill-cyan-300 text-[10.5px] font-mono">
          • 藍/白光 Vf: 3.1V ~ 3.4V
        </text>
        <text x={774} y={218} className="fill-emerald-300 text-[10px] font-mono">
          狀態: {ledGlowIntensity > 0.1 ? '✨ 順向導通發光中!' : '逆向截止 / 未導通'}
        </text>

        {/* Bottom Card: 1N4148 / 1N4007 Silicon Diode */}
        <rect
          x={485}
          y={260}
          width={515}
          height={158}
          rx={12}
          fill="#0f172a"
          stroke="#334155"
          strokeWidth={2}
        />
        <text x={508} y={284} className="fill-rose-300 text-xs font-bold">
          2. 1N4148 / 1N4007 矽二極體 (Silicon Diode, 順向壓降 Vf ≈ 0.65V，色環端為陰極 -)
        </text>

        {/* Diode Leads */}
        <line
          x1={610}
          y1={345}
          x2={865}
          y2={345}
          stroke="#cbd5e1"
          strokeWidth={5}
          strokeLinecap="round"
        />
        {/* Diode Cylinder Package */}
        <rect
          x={685}
          y={325}
          width={105}
          height={40}
          rx={6}
          fill="#ea580c"
          stroke="#fed7aa"
          strokeWidth={2}
        />
        {/* Cathode Black/Silver Stripe on Right */}
        <rect x={762} y={326} width={16} height={38} fill="#0f172a" />
        <text
          x={725}
          y={350}
          textAnchor="middle"
          className="fill-white text-xs font-mono font-bold"
        >
          1N4148 ➔|
        </text>
        <text
          x={745}
          y={398}
          textAnchor="middle"
          className="fill-slate-400 text-[11px]"
        >
          💡 電流只能順著三角形箭頭方向 (陽極 + ➔ 陰極色環 -) 單向流動！
        </text>
      </g>
    );
  }

  // ==========================================================================
  // 6. CAPACITANCE & SAFE DISCHARGE SCENE
  // ==========================================================================
  if (id === 'capacitance-safe-discharge') {
    const capNom = simValues['capNominalUf'] ?? 10;
    const isDischarged = (simValues['capDischarged'] ?? 1) === 1;

    return (
      <g>
        <text
          x={745}
          y={55}
          textAnchor="middle"
          className="fill-slate-200 text-sm font-bold"
        >
          ⚡ 電容檔 (⊣⊢) 容量測量與 1kΩ 電阻安全放電程序
        </text>

        <rect
          x={485}
          y={74}
          width={515}
          height={344}
          rx={14}
          fill="#0f172a"
          stroke={isDischarged ? '#334155' : '#ef4444'}
          strokeWidth={2.5}
        />

        {/* Electrolytic Capacitor Cylinder */}
        <line x1={680} y1={195} x2={640} y2={255} stroke="#cbd5e1" strokeWidth={4} />
        <line x1={745} y1={195} x2={785} y2={255} stroke="#94a3b8" strokeWidth={4} />

        <rect
          x={655}
          y={102}
          width={115}
          height={96}
          rx={10}
          fill={capNom === 0.1 ? '#d97706' : '#1e3a8a'}
          stroke="#93c5fd"
          strokeWidth={2}
        />
        {/* Negative White Stripe on Right Side of Electrolytic Cap */}
        {capNom >= 1 && (
          <g>
            <rect
              x={742}
              y={104}
              width={24}
              height={92}
              rx={4}
              fill="#e2e8f0"
            />
            <text
              x={754}
              y={135}
              textAnchor="middle"
              className="fill-slate-900 text-sm font-black font-mono"
            >
              -
            </text>
            <text
              x={754}
              y={165}
              textAnchor="middle"
              className="fill-slate-900 text-sm font-black font-mono"
            >
              -
            </text>
          </g>
        )}

        <text
          x={700}
          y={142}
          textAnchor="middle"
          className="fill-white text-sm font-black font-mono"
        >
          {capNom === 0.1 ? '104 (0.1µF)' : `${capNom} µF`}
        </text>
        <text
          x={700}
          y={164}
          textAnchor="middle"
          className="fill-cyan-300 text-[11px] font-mono"
        >
          {isDischarged ? '殘留電壓: 0.00V (安全)' : '⚠️ 殘留高壓: 11.84V!'}
        </text>

        {/* Interactive 1kΩ Safe Discharge Button on SVG */}
        <g
          onClick={() =>
            setSimValues((prev) => ({
              ...prev,
              capDischarged: (prev.capDischarged ?? 1) === 1 ? 0 : 1,
            }))
          }
          className="cursor-pointer"
        >
          <rect
            x={545}
            y={315}
            width={395}
            height={68}
            rx={10}
            fill={isDischarged ? '#064e3b' : '#7f1d1d'}
            stroke={isDischarged ? '#10b981' : '#f43f5e'}
            strokeWidth={2}
          />
          <text
            x={742}
            y={342}
            textAnchor="middle"
            className="fill-white text-xs font-bold"
          >
            {isDischarged
              ? '✅ 已跨接 1kΩ 電阻放電完畢 (點擊可模擬重新充電至 11.8V)'
              : '⚠️ 電容帶有 11.8V 殘電！👉 點此用 1kΩ 電阻安全放電 5 秒'}
          </text>
          <text
            x={742}
            y={364}
            textAnchor="middle"
            className="fill-amber-300 text-[11px] font-mono"
          >
            Gavin Jackson 守則：電容 + ──[ 1kΩ 放電電阻 ]── 電容 - (等待 5 秒歸零)
          </text>
        </g>
      </g>
    );
  }

  // ==========================================================================
  // 7. SERIES CURRENT & OHM'S LAW SCENE (mA)
  // ==========================================================================
  if (id === 'series-current-ohms-law') {
    const vSupply = simValues['supplyVolts'] ?? 5.0;
    const rOhms = simValues['seriesResistor'] ?? 220;
    const bandInfo = getResistorColorBands(rOhms);
    const currentMa = +(((vSupply - 2.0) / rOhms) * 1000).toFixed(2);

    return (
      <g>
        <text
          x={745}
          y={55}
          textAnchor="middle"
          className="fill-slate-200 text-sm font-bold"
        >
          🔄 串聯測電流 (In Series)：歐姆定律 I = (U − Vf) / R 實證迴路
        </text>

        <rect
          x={485}
          y={72}
          width={515}
          height={346}
          rx={14}
          fill="#0f172a"
          stroke={isDangerAlert ? '#ef4444' : '#334155'}
          strokeWidth={2.5}
        />

        {/* Schematic Loop Wire: +5V (545,165) -> Resistor -> SER_BREAK_A (715,165) ... GAP ... SER_BREAK_B (845,165) -> LED -> GND (680,345) */}
        <line x1={545} y1={165} x2={585} y2={165} stroke="#ef4444" strokeWidth={4} />
        {/* Resistor between 585 and 675 */}
        <rect
          x={585}
          y={151}
          width={85}
          height={28}
          rx={8}
          fill="#fde68a"
          stroke="#92400e"
          strokeWidth={2}
        />
        {bandInfo.colors.map((c, idx) => (
          <rect key={idx} x={598 + idx * 17} y={152} width={7} height={26} fill={c} />
        ))}
        <text
          x={627}
          y={142}
          textAnchor="middle"
          className="fill-amber-300 text-xs font-bold font-mono"
        >
          R = {rOhms}Ω
        </text>
        <line x1={670} y1={165} x2={715} y2={165} stroke="#ef4444" strokeWidth={4} />

        {/* THE INTENTIONAL SERIES BREAK GAP between SER_BREAK_A (715,165) and SER_BREAK_B (845,165) */}
        <rect
          x={728}
          y={128}
          width={104}
          height={64}
          rx={8}
          fill="#020617"
          stroke={ledGlowIntensity > 0 ? '#10b981' : '#f59e0b'}
          strokeWidth={2}
          strokeDasharray="5 3"
        />
        <text
          x={780}
          y={152}
          textAnchor="middle"
          className="fill-amber-300 text-[11px] font-bold"
        >
          ✂️ 剪開串聯缺口
        </text>
        <text
          x={780}
          y={172}
          textAnchor="middle"
          className="fill-cyan-300 text-[10px] font-mono"
        >
          {ledGlowIntensity > 0 ? `⚡ 電流 I=${currentMa}mA` : '待串入 mA 電表'}
        </text>

        {/* Downstream from SER_BREAK_B (845,165) to LED (920,250) to GND (680,345) */}
        <path
          d="M 845 165 L 925 165 L 925 345 L 545 345 L 545 165"
          fill="none"
          stroke="#475569"
          strokeWidth={3.5}
        />
        {/* DC Power Source Box on Left (545, 255) */}
        <rect
          x={504}
          y={222}
          width={82}
          height={66}
          rx={8}
          fill="#1e293b"
          stroke="#38bdf8"
          strokeWidth={2}
        />
        <text
          x={545}
          y={248}
          textAnchor="middle"
          className="fill-white text-xs font-bold"
        >
          DC 電源
        </text>
        <text
          x={545}
          y={270}
          textAnchor="middle"
          className="fill-cyan-300 text-sm font-black font-mono"
        >
          {vSupply.toFixed(1)} V
        </text>

        {/* Red LED on Right Vertical Branch (x=925, y=250) */}
        {ledGlowIntensity > 0.1 && (
          <circle
            cx={925}
            cy={250}
            r={34 * ledGlowIntensity + 12}
            fill="#ef4444"
            opacity={0.42 * ledGlowIntensity}
          />
        )}
        <circle
          cx={925}
          cy={250}
          r={18}
          fill="#ef4444"
          fillOpacity={ledGlowIntensity > 0.1 ? 0.95 : 0.3}
          stroke="#f8fafc"
          strokeWidth={2}
        />
        <text
          x={875}
          y={254}
          textAnchor="end"
          className="fill-rose-300 text-xs font-bold font-mono"
        >
          LED (Vf=2.0V) {ledGlowIntensity > 0.1 ? 'ON' : 'OFF'}
        </text>

        {/* Formula Summary Banner inside Box */}
        <rect
          x={605}
          y={235}
          width={245}
          height={72}
          rx={8}
          fill="#020617"
          stroke="#1e293b"
          strokeWidth={1.5}
        />
        <text x={727} y={258} textAnchor="middle" className="fill-emerald-300 text-xs font-bold font-mono">
          歐姆定律：I = (U − Vf) / R
        </text>
        <text x={727} y={278} textAnchor="middle" className="fill-slate-200 text-xs font-mono">
          I = ({vSupply.toFixed(1)}V − 2.0V) / {rOhms}Ω = {currentMa} mA
        </text>
        <text x={727} y={296} textAnchor="middle" className="fill-slate-400 text-[10px] font-mono">
          電阻功率 P = {(vSupply - 2.0).toFixed(1)}V × {currentMa}mA = {((vSupply - 2.0) * currentMa).toFixed(0)} mW
        </text>
      </g>
    );
  }

  // ==========================================================================
  // 8. CIRCUIT VOLTAGE DROP & TROUBLESHOOTING SCENE
  // ==========================================================================
  if (id === 'circuit-voltage-drop') {
    const btnClosed = (simValues['buttonClosed'] ?? 1) === 1;
    const fault = simValues['faultMode'] ?? 0;

    return (
      <g>
        <text
          x={745}
          y={55}
          textAnchor="middle"
          className="fill-slate-200 text-sm font-bold"
        >
          🔎 克希荷夫壓降診斷：5V 電源 + 微動按鈕 + 220Ω 電阻 + LED
        </text>

        <rect
          x={485}
          y={72}
          width={515}
          height={346}
          rx={14}
          fill="#0f172a"
          stroke="#334155"
          strokeWidth={2}
        />

        {/* Main Circuit Loop */}
        <path
          d="M 535 170 L 930 170 L 930 350 L 535 350 Z"
          fill="none"
          stroke="#475569"
          strokeWidth={4}
        />

        {/* Clickable Push Button Switch between TP1 (535,170) and TP2 (685,170) */}
        <g
          onClick={() =>
            setSimValues((prev) => ({
              ...prev,
              buttonClosed: (prev.buttonClosed ?? 1) === 1 ? 0 : 1,
            }))
          }
          className="cursor-pointer"
        >
          <rect
            x={572}
            y={138}
            width={78}
            height={54}
            rx={8}
            fill="#1e293b"
            stroke={btnClosed ? '#22d3ee' : '#94a3b8'}
            strokeWidth={2}
          />
          <circle
            cx={611}
            cy={165}
            r={14}
            fill={btnClosed ? '#06b6d4' : '#0f172a'}
            stroke="#f8fafc"
            strokeWidth={1.5}
          />
          <text
            x={611}
            y={128}
            textAnchor="middle"
            className="fill-cyan-300 text-[11px] font-bold"
          >
            按鈕開關 ({btnClosed ? '已按下 ON' : '放開 OFF'})
          </text>
        </g>

        {/* 220Ω Resistor between TP2 (685,170) and TP3 (855,170) */}
        <rect
          x={728}
          y={154}
          width={86}
          height={32}
          rx={8}
          fill="#fde68a"
          stroke="#92400e"
          strokeWidth={2}
        />
        <text
          x={771}
          y={144}
          textAnchor="middle"
          className="fill-amber-300 text-xs font-bold font-mono"
        >
          220Ω 限流電阻
        </text>
        <text
          x={771}
          y={174}
          textAnchor="middle"
          className="fill-slate-900 text-xs font-black font-mono"
        >
          220 Ω
        </text>

        {/* Red LED on Right Branch (x=930, y=260) */}
        {ledGlowIntensity > 0.1 && (
          <circle
            cx={930}
            cy={260}
            r={38}
            fill="#ef4444"
            opacity={0.4}
          />
        )}
        <circle
          cx={930}
          cy={260}
          r={18}
          fill="#ef4444"
          fillOpacity={ledGlowIntensity > 0.1 ? 0.95 : 0.3}
          stroke="#f8fafc"
          strokeWidth={2}
        />
        <text
          x={898}
          y={264}
          textAnchor="end"
          className="fill-rose-300 text-xs font-bold font-mono"
        >
          紅光 LED {fault === 2 ? '(虛焊開路!)' : ledGlowIntensity > 0.1 ? '(2.0V ON)' : '(OFF)'}
        </text>

        {/* KVL Diagnostic Hint Card in Center */}
        <rect
          x={585}
          y={222}
          width={275}
          height={90}
          rx={8}
          fill="#020617"
          stroke="#1e293b"
          strokeWidth={1.5}
        />
        <text x={722} y={244} textAnchor="middle" className="fill-cyan-300 text-xs font-bold">
          💡 單探棒巡檢法 (黑探棒固定留 TP4 GND)
        </text>
        <text x={722} y={266} textAnchor="middle" className="fill-slate-300 text-[11px] font-mono">
          正常導通時：TP1=5V, TP2=5V, TP3=2V
        </text>
        <text x={722} y={286} textAnchor="middle" className="fill-amber-300 text-[11px] font-mono">
          跨接電阻 (TP2↔TP3): 5V − 2V = 3.00V 壓降
        </text>
        <text x={722} y={304} textAnchor="middle" className="fill-rose-300 text-[10px] font-mono">
          {fault === 0
            ? '目前狀態：正常運作無故障'
            : fault === 1
            ? '⚠️ 已注入故障 A：按鈕內部氧化斷路'
            : '⚠️ 已注入故障 B：LED 腳位虛焊開路'}
        </text>
      </g>
    );
  }

  // ==========================================================================
  // 9. AC MAINS SOCKET & SAFETY SCENE
  // ==========================================================================
  const mainsV = simValues['mainsRegion'] ?? 115;
  const peakV = Math.round(mainsV * 1.414);

  return (
    <g>
      <text
        x={745}
        y={55}
        textAnchor="middle"
        className="fill-slate-200 text-sm font-bold"
      >
        ⚡ 家用交流電插座 ({mainsV}V~ 60Hz True-RMS) 與 CAT III 安全規範
      </text>

      {/* Left: Wall Outlet Faceplate */}
      <rect
        x={535}
        y={92}
        width={280}
        height={265}
        rx={18}
        fill="#f1f5f9"
        stroke="#94a3b8"
        strokeWidth={3}
      />
      <rect
        x={575}
        y={130}
        width={200}
        height={190}
        rx={24}
        fill="#e2e8f0"
        stroke="#cbd5e1"
        strokeWidth={2}
      />

      {/* Short Slot: Hot/Live L (x=615, y=195) */}
      <rect x={609} y={170} width={12} height={46} rx={3} fill="#0f172a" />
      <text
        x={615}
        y={156}
        textAnchor="middle"
        className="fill-red-600 text-[11px] font-bold"
      >
        短孔 火線(L)
      </text>

      {/* Long Slot: Neutral N (x=735, y=195) */}
      <rect x={729} y={162} width={12} height={62} rx={3} fill="#0f172a" />
      <text
        x={735}
        y={150}
        textAnchor="middle"
        className="fill-blue-600 text-[11px] font-bold"
      >
        長孔 水線(N)
      </text>

      {/* Round Earth Ground E (x=675, y=295) */}
      <path
        d="M 661 298 A 14 14 0 0 1 689 298 L 689 306 L 661 306 Z"
        fill="#0f172a"
      />
      <text
        x={675}
        y={272}
        textAnchor="middle"
        className="fill-slate-600 text-[11px] font-bold"
      >
        圓孔 接地(E)
      </text>

      {/* Right: AC Sine Wave Mini Scope Card */}
      <rect
        x={835}
        y={92}
        width={175}
        height={265}
        rx={12}
        fill="#0f172a"
        stroke="#334155"
        strokeWidth={2}
      />
      <text
        x={922}
        y={118}
        textAnchor="middle"
        className="fill-amber-300 text-xs font-bold"
      >
        〰️ 60Hz 正弦波型
      </text>
      <line x1={850} y1={185} x2={995} y2={185} stroke="#475569" strokeWidth={1} strokeDasharray="3 3" />
      <path
        d="M 852 185 Q 887 120 922 185 T 992 185"
        fill="none"
        stroke="#fbbf24"
        strokeWidth={3}
      />
      <text
        x={922}
        y={242}
        textAnchor="middle"
        className="fill-cyan-300 text-xs font-mono font-bold"
      >
        有效值: {mainsV} V~
      </text>
      <text
        x={922}
        y={264}
        textAnchor="middle"
        className="fill-rose-300 text-[11px] font-mono"
      >
        瞬間峰值: ±{peakV} V
      </text>
      <text
        x={922}
        y={296}
        textAnchor="middle"
        className="fill-slate-300 text-[10.5px]"
      >
        正負極每秒交替 60 次
      </text>
      <text
        x={922}
        y={316}
        textAnchor="middle"
        className="fill-emerald-300 text-[10.5px] font-bold"
      >
        紅黑探棒對調讀數相同
      </text>

      <text
        x={745}
        y={395}
        textAnchor="middle"
        className="fill-rose-300 text-xs font-bold"
      >
        ⚠️ 嚴禁將紅探棒插在「10A」孔量插座！也切勿用直流檔 (DCV) 驗交流電！
      </text>
    </g>
  );
};
