import React, { useState, useMemo, useEffect, useRef } from 'react';
import { LESSONS } from './data/lessons';
import {
  DIAL_SPECS,
  GOLDEN_RULES_TABLE,
  MODE_MAP,
  MULTIMETER_JACKS,
} from './data/multimeterSpec';
import { simulateMultimeter } from './utils/simulator';
import { DeviceSceneSvg } from './components/DeviceScenes';
import {
  MeasurementLesson,
  MeterMode,
  RedJackPort,
  TestPoint,
} from './types/multimeter';

type MobileCameraPreset = 'both' | 'meter' | 'device';

export default function App() {
  const [selectedLessonId, setSelectedLessonId] = useState<string>(LESSONS[0].id);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  // Responsive viewport detection
  const [isMobile, setIsMobile] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.innerWidth < 1024 : false
  );
  const [mobileTab, setMobileTab] = useState<
    'controls' | 'steps' | 'rules' | 'logs'
  >('controls');
  const [mobileCamera, setMobileCamera] = useState<MobileCameraPreset>('both');
  const [mobileBoardExpanded, setMobileBoardExpanded] = useState<boolean>(false);
  const [showMobileLessonPicker, setShowMobileLessonPicker] =
    useState<boolean>(false);

  // Multimeter Interactive State
  const [meterMode, setMeterMode] = useState<MeterMode>(
    LESSONS[0].recommendedMode
  );
  const [redJack, setRedJack] = useState<RedJackPort>(
    LESSONS[0].recommendedRedJack
  );
  const [redPointId, setRedPointId] = useState<string>(
    LESSONS[0].defaultRedPointId
  );
  const [blackPointId, setBlackPointId] = useState<string>(
    LESSONS[0].defaultBlackPointId
  );
  const [activeProbeToMove, setActiveProbeToMove] = useState<'red' | 'black'>(
    'red'
  );

  // Meter Features: Hold, Backlight, Fuse Blown, Audio Beep
  const [isHold, setIsHold] = useState<boolean>(false);
  const [heldText, setHeldText] = useState<{ main: string; unit: string } | null>(
    null
  );
  const [backlightOn, setBacklightOn] = useState<boolean>(true);
  const [fuseBlown, setFuseBlown] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [showProbeLabels, setShowProbeLabels] = useState<boolean>(true);
  const [zoom, setZoom] = useState<number>(1);

  // Practice / Quiz Mode vs Guided Mode
  const [practiceMode, setPracticeMode] = useState<boolean>(false);

  // Desktop Right Sidebar Tabs
  const [rightTab, setRightTab] = useState<'guide' | 'rules' | 'dialSpec'>(
    'guide'
  );
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  // Device Under Test (DUT) Simulation Controls State
  const [simValues, setSimValues] = useState<Record<string, number>>({});
  const [hoveredTestPointId, setHoveredTestPointId] = useState<string | null>(
    null
  );

  const audioCtxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const currentLesson: MeasurementLesson = useMemo(
    () => LESSONS.find((l) => l.id === selectedLessonId) || LESSONS[0],
    [selectedLessonId]
  );

  // Load lesson & meter state from URL hash if present
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (!hash) return;
    const params = new URLSearchParams(hash);
    const lId = params.get('lesson');
    const found = LESSONS.find((l) => l.id === lId);
    if (found) {
      setSelectedLessonId(found.id);
      const m = params.get('mode') as MeterMode | null;
      if (m && MODE_MAP[m]) setMeterMode(m);
      const rj = params.get('jack') as RedJackPort | null;
      if (rj === 'VOMA' || rj === '10A') setRedJack(rj);
      const rp = params.get('red');
      const bp = params.get('black');
      if (rp && found.testPoints.some((tp) => tp.id === rp)) setRedPointId(rp);
      if (bp && found.testPoints.some((tp) => tp.id === bp)) setBlackPointId(bp);
    }
  }, []);

  // Reset or auto-configure when switching lessons
  const applyLessonDefaults = (lesson: MeasurementLesson, isQuiz: boolean) => {
    const initialSim: Record<string, number> = {};
    for (const ctrl of lesson.simControls) {
      initialSim[ctrl.id] = ctrl.defaultValue;
    }
    setSimValues(initialSim);
    setIsHold(false);
    setHeldText(null);
    setHoveredTestPointId(null);

    if (isQuiz) {
      // In Practice/Quiz mode, start with dial at OFF and probes on first two points so user sets it up!
      setMeterMode('OFF');
      setRedJack('VOMA');
      setRedPointId(lesson.testPoints[0]?.id || lesson.defaultRedPointId);
      setBlackPointId(
        lesson.testPoints[lesson.testPoints.length - 1]?.id ||
          lesson.defaultBlackPointId
      );
    } else {
      setMeterMode(lesson.recommendedMode);
      setRedJack(lesson.recommendedRedJack);
      setRedPointId(lesson.defaultRedPointId);
      setBlackPointId(lesson.defaultBlackPointId);
    }
  };

  useEffect(() => {
    applyLessonDefaults(currentLesson, practiceMode);
  }, [currentLesson, practiceMode]);

  // Run real-time multimeter physics simulation
  const simResult = useMemo(
    () =>
      simulateMultimeter(
        currentLesson,
        meterMode,
        redJack,
        redPointId,
        blackPointId,
        simValues,
        fuseBlown
      ),
    [
      currentLesson,
      meterMode,
      redJack,
      redPointId,
      blackPointId,
      simValues,
      fuseBlown,
    ]
  );

  // Trigger fuse blown persistence if simulation caused a short circuit fuse blow
  useEffect(() => {
    if (simResult.isFuseBlown && !fuseBlown) {
      setFuseBlown(true);
    }
  }, [simResult.isFuseBlown, fuseBlown]);

  // Play short WebAudio continuity / warning beep when isBeep transitions to true
  useEffect(() => {
    if (!simResult.isBeep || !soundEnabled || meterMode === 'OFF') return;
    try {
      const AudioCtx =
        window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioCtx();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = simResult.isDangerAlert ? 'sawtooth' : 'square';
      osc.frequency.setValueAtTime(
        simResult.isDangerAlert ? 880 : 2650,
        ctx.currentTime
      );
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.18);
    } catch {
      // Ignore audio autoplay restriction if user hasn't clicked yet
    }
  }, [
    simResult.isBeep,
    simResult.isDangerAlert,
    redPointId,
    blackPointId,
    meterMode,
    soundEnabled,
  ]);

  // Quiz verification check
  const isQuizPassed = useMemo(() => {
    const q = currentLesson.quizTarget;
    if (meterMode !== q.expectedMode) return false;
    if (redJack !== q.expectedRedJack) return false;
    if (simResult.isDangerAlert || simResult.isFuseBlown) return false;
    return q.validPairs.some(
      (p) =>
        (redPointId === p.red && blackPointId === p.black) ||
        (p.allowReverse && redPointId === p.black && blackPointId === p.red)
    );
  }, [currentLesson, meterMode, redJack, redPointId, blackPointId, simResult]);

  // Filtered lessons in sidebar
  const filteredLessons = useMemo(() => {
    return LESSONS.filter((lesson) => {
      const matchCat =
        categoryFilter === 'ALL' || lesson.category === categoryFilter;
      const q = searchQuery.trim().toLowerCase();
      if (!q) return matchCat;
      return (
        matchCat &&
        (lesson.title.toLowerCase().includes(q) ||
          lesson.chapter.toLowerCase().includes(q) ||
          lesson.subtitle.toLowerCase().includes(q) ||
          lesson.summary.toLowerCase().includes(q))
      );
    });
  }, [searchQuery, categoryFilter]);

  const handleSwapProbes = () => {
    setRedPointId(blackPointId);
    setBlackPointId(redPointId);
  };

  const handleTestPointClick = (tpId: string) => {
    if (activeProbeToMove === 'red') {
      setRedPointId(tpId);
      setActiveProbeToMove('black');
    } else {
      setBlackPointId(tpId);
      setActiveProbeToMove('red');
    }
  };

  const handleToggleHold = () => {
    if (!isHold) {
      setHeldText({
        main: simResult.lcdMainText,
        unit: simResult.lcdUnit,
      });
      setIsHold(true);
    } else {
      setIsHold(false);
      setHeldText(null);
    }
  };

  const handleShareLink = () => {
    const params = new URLSearchParams();
    params.set('lesson', currentLesson.id);
    params.set('mode', meterMode);
    params.set('jack', redJack);
    params.set('red', redPointId);
    params.set('black', blackPointId);
    const url = `${window.location.origin}${window.location.pathname}#${params.toString()}`;
    window.history.replaceState(null, '', `#${params.toString()}`);
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const activeDialSpec = MODE_MAP[meterMode] || DIAL_SPECS[0];
  const redTestPoint: TestPoint =
    currentLesson.testPoints.find((tp) => tp.id === redPointId) ||
    currentLesson.testPoints[0];
  const blackTestPoint: TestPoint =
    currentLesson.testPoints.find((tp) => tp.id === blackPointId) ||
    currentLesson.testPoints[currentLesson.testPoints.length - 1];
  const hoveredTestPoint: TestPoint | null =
    currentLesson.testPoints.find((tp) => tp.id === hoveredTestPointId) || null;

  const displayedMainText =
    isHold && heldText ? heldText.main : simResult.lcdMainText;
  const displayedUnitText =
    isHold && heldText ? heldText.unit : simResult.lcdUnit;

  // Dynamic SVG viewBox for Portrait Mobile Camera Presets
  const svgViewBox = useMemo(() => {
    if (!isMobile) return '0 0 1090 470';
    if (mobileCamera === 'meter') return '10 12 405 445';
    if (mobileCamera === 'device') return '440 18 620 435';
    return '0 0 1090 470';
  }, [isMobile, mobileCamera]);

  // Coordinates of the Multimeter Banana Jacks on the SVG Canvas
  const redJackCoords =
    redJack === '10A' ? MULTIMETER_JACKS[0] : MULTIMETER_JACKS[2];
  const comJackCoords = MULTIMETER_JACKS[1];

  // ============================================================================
  // SHARED INTERACTIVE SVG WORKBENCH (MULTIMETER + PROBES + DEVICE SCENE)
  // ============================================================================
  const renderWorkbenchSvg = () => {
    const dialCx = 195;
    const dialCy = 280;
    const dialRadius = 66;

    // Curved test lead paths from Multimeter Jacks to Device Test Points
    const redStartX = redJackCoords.x;
    const redStartY = redJackCoords.y;
    const redEndX = redTestPoint.x;
    const redEndY = redTestPoint.y;
    const redCtrl1X = redStartX + 90;
    const redCtrl1Y = 468;
    const redCtrl2X = redEndX - 90;
    const redCtrl2Y = Math.min(445, redEndY + 95);
    const redWirePath = `M ${redStartX} ${redStartY} C ${redCtrl1X} ${redCtrl1Y}, ${redCtrl2X} ${redCtrl2Y}, ${redEndX} ${redEndY}`;

    const blkStartX = comJackCoords.x;
    const blkStartY = comJackCoords.y;
    const blkEndX = blackTestPoint.x;
    const blkEndY = blackTestPoint.y;
    const blkCtrl1X = blkStartX + 110;
    const blkCtrl1Y = 475;
    const blkCtrl2X = blkEndX - 70;
    const blkCtrl2Y = Math.min(455, blkEndY + 115);
    const blkWirePath = `M ${blkStartX} ${blkStartY} C ${blkCtrl1X} ${blkCtrl1Y}, ${blkCtrl2X} ${blkCtrl2Y}, ${blkEndX} ${blkEndY}`;

    return (
      <svg
        width={isMobile ? '100%' : 1090}
        height={isMobile ? '100%' : 470}
        viewBox={svgViewBox}
        preserveAspectRatio="xMidYMid meet"
        className="select-none drop-shadow-2xl max-h-full"
      >
        <defs>
          <filter id="lcdGlow" x="-10%" y="-10%" width="120%" height="120%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* ================================================================ */}
        {/* LEFT STAGE: INTERACTIVE DIGITAL MULTIMETER (DMT-99 / DMM)        */}
        {/* ================================================================ */}
        <g>
          {/* Yellow Rubberized Shock Holster */}
          <rect
            x={26}
            y={18}
            width={338}
            height={434}
            rx={28}
            fill="#eab308"
            stroke="#ca8a04"
            strokeWidth={3}
          />
          {/* Inner Dark Slate Meter Casing */}
          <rect
            x={38}
            y={30}
            width={314}
            height={410}
            rx={22}
            fill="#0f172a"
            stroke="#334155"
            strokeWidth={2.5}
          />

          {/* Top Model Branding Header */}
          <text
            x={58}
            y={52}
            className="fill-amber-400 text-xs font-black font-mono tracking-wider"
          >
            DMT-99 PRO
          </text>
          <text
            x={332}
            y={52}
            textAnchor="end"
            className="fill-slate-400 text-[10px] font-mono font-bold"
          >
            TRUE RMS · AUTO/MANUAL
          </text>

          {/* Backlit LCD Display Screen */}
          <rect
            x={56}
            y={62}
            width={278}
            height={104}
            rx={10}
            fill={
              meterMode === 'OFF'
                ? '#1e293b'
                : simResult.isDangerAlert
                ? '#450a0a'
                : backlightOn
                ? '#083344'
                : '#1e293b'
            }
            stroke={
              simResult.isDangerAlert
                ? '#ef4444'
                : backlightOn && meterMode !== 'OFF'
                ? '#22d3ee'
                : '#475569'
            }
            strokeWidth={2.5}
          />

          {meterMode !== 'OFF' ? (
            <g>
              {/* Top LCD Status Strip */}
              <text
                x={68}
                y={80}
                className="fill-cyan-300 text-[10px] font-mono font-bold"
              >
                {activeDialSpec.shortLabel} · {activeDialSpec.connectionRule}
              </text>
              {isHold && (
                <g>
                  <rect
                    x={218}
                    y={68}
                    width={36}
                    height={14}
                    rx={3}
                    fill="#f59e0b"
                  />
                  <text
                    x={236}
                    y={78}
                    textAnchor="middle"
                    className="fill-slate-900 text-[9px] font-mono font-black"
                  >
                    HOLD
                  </text>
                </g>
              )}
              {simResult.isBeep && (
                <text
                  x={322}
                  y={80}
                  textAnchor="end"
                  className="fill-amber-300 text-xs font-mono font-black animate-pulse"
                >
                  🔊 BEEP!
                </text>
              )}

              {/* Negative Polarity Sign (-) */}
              {simResult.isNegative && (
                <text
                  x={76}
                  y={128}
                  className="fill-cyan-300 text-base font-black font-mono"
                >
                  −
                </text>
              )}

              {/* Main 7-Segment Style Digital Value */}
              <text
                x={262}
                y={132}
                textAnchor="end"
                style={{ fontSize: '38px' }}
                className={`font-mono font-black tracking-tight ${
                  simResult.isDangerAlert
                    ? 'fill-rose-400'
                    : backlightOn
                    ? 'fill-white'
                    : 'fill-slate-200'
                }`}
              >
                {displayedMainText}
              </text>

              {/* Measurement Unit */}
              <text
                x={270}
                y={130}
                className="fill-amber-300 text-sm font-mono font-black"
              >
                {displayedUnitText}
              </text>

              {/* Bottom LCD Subtext */}
              <text
                x={68}
                y={155}
                className={`text-[10px] font-mono font-bold ${
                  simResult.isDangerAlert ? 'fill-rose-300' : 'fill-cyan-300'
                }`}
              >
                {simResult.lcdSubText}
              </text>
            </g>
          ) : (
            <text
              x={195}
              y={120}
              textAnchor="middle"
              className="fill-slate-500 text-sm font-mono font-bold"
            >
              OFF (點擊下方旋鈕開機)
            </text>
          )}

          {/* 3 Tactile Utility Buttons Below LCD: HOLD, BACKLIGHT, SWAP PROBES */}
          <g onClick={handleToggleHold} className="cursor-pointer">
            <rect
              x={56}
              y={174}
              width={80}
              height={24}
              rx={5}
              fill={isHold ? '#f59e0b' : '#1e293b'}
              stroke="#475569"
              strokeWidth={1.2}
            />
            <text
              x={96}
              y={190}
              textAnchor="middle"
              className={`text-[10px] font-bold ${
                isHold ? 'fill-slate-900' : 'fill-slate-300'
              }`}
            >
              HOLD 鎖定
            </text>
          </g>

          <g
            onClick={() => setBacklightOn((b) => !b)}
            className="cursor-pointer"
          >
            <rect
              x={144}
              y={174}
              width={80}
              height={24}
              rx={5}
              fill={backlightOn ? '#0891b2' : '#1e293b'}
              stroke="#475569"
              strokeWidth={1.2}
            />
            <text
              x={184}
              y={190}
              textAnchor="middle"
              className="fill-white text-[10px] font-bold"
            >
              💡 背光
            </text>
          </g>

          <g onClick={handleSwapProbes} className="cursor-pointer">
            <rect
              x={232}
              y={174}
              width={102}
              height={24}
              rx={5}
              fill="#334155"
              stroke="#38bdf8"
              strokeWidth={1.2}
            />
            <text
              x={283}
              y={190}
              textAnchor="middle"
              className="fill-cyan-300 text-[10px] font-bold"
            >
              🔄 正負極對調
            </text>
          </g>

          {/* ============================================================== */}
          {/* INTERACTIVE ROTARY SELECTOR DIAL (cx=195, cy=280)              */}
          {/* ============================================================== */}
          {/* Outer Dial Bezel Ring */}
          <circle
            cx={dialCx}
            cy={dialCy}
            r={dialRadius + 24}
            fill="#1e293b"
            stroke="#334155"
            strokeWidth={2}
          />

          {/* Clickable Dial Position Labels Around the Circle */}
          {DIAL_SPECS.map((spec) => {
            const rad = ((spec.angleDeg - 90) * Math.PI) / 180;
            const labelR = dialRadius + 15;
            const lx = dialCx + Math.cos(rad) * labelR;
            const ly = dialCy + Math.sin(rad) * labelR;
            const isSelected = meterMode === spec.mode;

            return (
              <g
                key={spec.mode}
                onClick={() => setMeterMode(spec.mode)}
                className="cursor-pointer"
              >
                <rect
                  x={lx - 21}
                  y={ly - 10}
                  width={42}
                  height={20}
                  rx={5}
                  fill={isSelected ? '#f59e0b' : '#0f172a'}
                  stroke={isSelected ? '#ffffff' : '#475569'}
                  strokeWidth={isSelected ? 1.8 : 1}
                />
                <text
                  x={lx}
                  y={ly + 4}
                  textAnchor="middle"
                  className={`text-[10px] font-mono font-black ${
                    isSelected ? 'fill-slate-900' : 'fill-slate-200'
                  }`}
                >
                  {spec.shortLabel}
                </text>
              </g>
            );
          })}

          {/* Inner Rotary Knob Body */}
          <circle
            cx={dialCx}
            cy={dialCy}
            r={dialRadius - 10}
            fill="#020617"
            stroke="#64748b"
            strokeWidth={2.5}
          />
          <circle
            cx={dialCx}
            cy={dialCy}
            r={dialRadius - 20}
            fill="#1e293b"
            stroke="#475569"
            strokeWidth={1.5}
          />

          {/* Rotating Pointer Bar */}
          <g
            transform={`translate(${dialCx}, ${dialCy}) rotate(${activeDialSpec.angleDeg})`}
          >
            <rect
              x={-6}
              y={-(dialRadius - 14)}
              width={12}
              height={(dialRadius - 14) * 2}
              rx={6}
              fill="#334155"
              stroke="#94a3b8"
              strokeWidth={1.5}
            />
            {/* Glowing Pointer Triangle at Tip */}
            <polygon
              points={`0,${-(dialRadius - 12)} -6,${-(dialRadius - 26)} 6,${-(
                dialRadius - 26
              )}`}
              fill="#f59e0b"
            />
            <circle cx={0} cy={0} r={8} fill="#0f172a" />
          </g>

          {/* ============================================================== */}
          {/* 3 INTERACTIVE BANANA JACK SOCKETS (10A, COM, VΩmA)             */}
          {/* ============================================================== */}
          {MULTIMETER_JACKS.map((jack) => {
            const isRedPlugged =
              (jack.id === '10A' && redJack === '10A') ||
              (jack.id === 'VOMA' && redJack === 'VOMA');
            const isBlackPlugged = jack.id === 'COM';

            return (
              <g
                key={jack.id}
                onClick={() => {
                  if (jack.id === '10A') setRedJack('10A');
                  if (jack.id === 'VOMA') setRedJack('VOMA');
                }}
                className={jack.id !== 'COM' ? 'cursor-pointer' : ''}
              >
                <text
                  x={jack.x}
                  y={jack.y - 26}
                  textAnchor="middle"
                  className={`text-[10px] font-mono font-black ${
                    jack.id === '10A'
                      ? 'fill-rose-400'
                      : jack.id === 'COM'
                      ? 'fill-slate-300'
                      : 'fill-amber-300'
                  }`}
                >
                  {jack.label}
                </text>

                {/* Outer Insulated Banana Socket Ring */}
                <circle
                  cx={jack.x}
                  cy={jack.y}
                  r={18}
                  fill="#020617"
                  stroke={jack.ringColor}
                  strokeWidth={3.5}
                />
                <circle cx={jack.x} cy={jack.y} r={9} fill="#1e293b" />

                {/* Active Plug Indicator inside Socket */}
                {isRedPlugged && (
                  <g>
                    <circle
                      cx={jack.x}
                      cy={jack.y}
                      r={11}
                      fill="#ef4444"
                      stroke="#ffffff"
                      strokeWidth={2}
                    />
                    <text
                      x={jack.x}
                      y={jack.y + 3.5}
                      textAnchor="middle"
                      className="fill-white text-[10px] font-black font-mono"
                    >
                      +
                    </text>
                  </g>
                )}
                {isBlackPlugged && (
                  <g>
                    <circle
                      cx={jack.x}
                      cy={jack.y}
                      r={11}
                      fill="#334155"
                      stroke="#ffffff"
                      strokeWidth={2}
                    />
                    <text
                      x={jack.x}
                      y={jack.y + 3.5}
                      textAnchor="middle"
                      className="fill-white text-[10px] font-black font-mono"
                    >
                      -
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </g>

        {/* ================================================================ */}
        {/* RIGHT STAGE: INTERACTIVE TARGET DEVICE / CIRCUIT DIAGRAM         */}
        {/* ================================================================ */}
        <g>
          {/* Stage Container Backdrop */}
          <rect
            x={420}
            y={18}
            width={646}
            height={434}
            rx={22}
            fill="#020617"
            fillOpacity={0.75}
            stroke="#1e293b"
            strokeWidth={2}
          />

          {/* Render Lesson-Specific Device Illustration */}
          <DeviceSceneSvg
            lesson={currentLesson}
            simValues={simValues}
            setSimValues={setSimValues}
            ledGlowIntensity={simResult.ledGlowIntensity}
            isBeep={simResult.isBeep}
            isDangerAlert={simResult.isDangerAlert}
          />

          {/* Render Interactive Test Points (TP) on the Device */}
          {currentLesson.testPoints.map((tp) => {
            const isRedHere = redPointId === tp.id;
            const isBlackHere = blackPointId === tp.id;
            const isHovered = hoveredTestPointId === tp.id;

            return (
              <g
                key={tp.id}
                onMouseEnter={() => !isMobile && setHoveredTestPointId(tp.id)}
                onMouseLeave={() => !isMobile && setHoveredTestPointId(null)}
                onClick={() => handleTestPointClick(tp.id)}
                className="cursor-pointer"
              >
                {/* Pulse Halo for Active/Hovered Test Point */}
                {(isRedHere || isBlackHere || isHovered) && (
                  <circle
                    cx={tp.x}
                    cy={tp.y}
                    r={18}
                    fill={
                      isRedHere
                        ? '#ef4444'
                        : isBlackHere
                        ? '#38bdf8'
                        : '#f59e0b'
                    }
                    opacity={0.28}
                  />
                )}

                {/* Metallic Test Pad Circle */}
                <circle
                  cx={tp.x}
                  cy={tp.y}
                  r={10}
                  fill={
                    isRedHere
                      ? '#ef4444'
                      : isBlackHere
                      ? '#334155'
                      : '#0f172a'
                  }
                  stroke={
                    isRedHere
                      ? '#fca5a5'
                      : isBlackHere
                      ? '#38bdf8'
                      : '#eab308'
                  }
                  strokeWidth={2.5}
                />
                <circle cx={tp.x} cy={tp.y} r={3.5} fill="#f8fafc" />

                {/* Test Point Label Pill */}
                {showProbeLabels && (
                  <g transform={`translate(${tp.x}, ${tp.y + 24})`}>
                    <rect
                      x={-54}
                      y={-10}
                      width={108}
                      height={19}
                      rx={6}
                      fill="#0f172a"
                      fillOpacity={0.92}
                      stroke={
                        isRedHere
                          ? '#ef4444'
                          : isBlackHere
                          ? '#38bdf8'
                          : '#475569'
                      }
                      strokeWidth={1.3}
                    />
                    <text
                      x={0}
                      y={3}
                      textAnchor="middle"
                      className="fill-slate-100 text-[10px] font-mono font-bold"
                    >
                      {tp.shortLabel}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </g>

        {/* ================================================================ */}
        {/* FOREGROUND: RED (+) & BLACK (-) PROBES AND CURVED TEST LEADS     */}
        {/* ================================================================ */}
        <g className="pointer-events-none">
          {/* Black Probe Lead Cable (COM -> Black Test Point) */}
          <path
            d={blkWirePath}
            fill="none"
            stroke="#020617"
            strokeWidth={8}
            strokeLinecap="round"
            opacity={0.6}
          />
          <path
            d={blkWirePath}
            fill="none"
            stroke="#475569"
            strokeWidth={5}
            strokeLinecap="round"
          />

          {/* Red Probe Lead Cable (VΩmA/10A -> Red Test Point) */}
          <path
            d={redWirePath}
            fill="none"
            stroke="#020617"
            strokeWidth={8}
            strokeLinecap="round"
            opacity={0.6}
          />
          <path
            d={redWirePath}
            fill="none"
            stroke="#ef4444"
            strokeWidth={5}
            strokeLinecap="round"
          />

          {/* Black Probe Pen Graphic at blackTestPoint */}
          <g
            transform={`translate(${blackTestPoint.x}, ${blackTestPoint.y}) rotate(22)`}
          >
            {/* Metallic Needle Tip */}
            <line
              x1={0}
              y1={0}
              x2={0}
              y2={-20}
              stroke="#e2e8f0"
              strokeWidth={3}
              strokeLinecap="round"
            />
            {/* Probe Handle */}
            <rect
              x={-6}
              y={-58}
              width={12}
              height={38}
              rx={4}
              fill="#1e293b"
              stroke="#94a3b8"
              strokeWidth={1.5}
            />
            <text
              x={0}
              y={-36}
              textAnchor="middle"
              className="fill-white text-[9px] font-mono font-black"
            >
              -
            </text>
          </g>

          {/* Red Probe Pen Graphic at redTestPoint */}
          <g
            transform={`translate(${redTestPoint.x}, ${redTestPoint.y}) rotate(-22)`}
          >
            {/* Metallic Needle Tip */}
            <line
              x1={0}
              y1={0}
              x2={0}
              y2={-20}
              stroke="#fef08a"
              strokeWidth={3}
              strokeLinecap="round"
            />
            {/* Probe Handle */}
            <rect
              x={-6}
              y={-58}
              width={12}
              height={38}
              rx={4}
              fill="#dc2626"
              stroke="#fecdd3"
              strokeWidth={1.5}
            />
            <text
              x={0}
              y={-36}
              textAnchor="middle"
              className="fill-white text-[9px] font-mono font-black"
            >
              +
            </text>
          </g>
        </g>
      </svg>
    );
  };

  // ============================================================================
  // PORTRAIT MOBILE LAYOUT (< 1024px)
  // ============================================================================
  if (isMobile) {
    return (
      <div className="h-dvh w-screen overflow-hidden flex flex-col bg-slate-950 text-slate-100">
        {/* 1. Mobile Header */}
        <header className="shrink-0 border-b border-slate-800 bg-slate-900/95 px-3 py-2 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="h-7 w-7 shrink-0 rounded-lg bg-gradient-to-br flex items-center justify-center font-black text-slate-950 text-xs">
                DMM
              </div>
              <div className="font-bold text-xs text-white truncate">
                三用電表互動圖像化學習台
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {fuseBlown && (
                <button
                  onClick={() => setFuseBlown(false)}
                  className="px-2 py-1 rounded-md bg-rose-500 text-white text-[11px] font-bold"
                >
                  🔧 換保險絲
                </button>
              )}
              <button
                onClick={() => setPracticeMode((p) => !p)}
                className={`px-2 py-1 rounded-md text-[11px] font-bold transition ${
                  practiceMode
                    ? 'bg-amber-500 text-slate-950'
                    : 'bg-slate-800 text-amber-300 border border-amber-500/30'
                }`}
              >
                {practiceMode
                  ? isQuizPassed
                    ? '⚡ 測驗通過✓'
                    : '⚡ 練習中'
                  : '📘 教學'}
              </button>
              <button
                onClick={handleShareLink}
                className="px-2 py-1 rounded-md bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 text-[11px] font-bold"
              >
                {copiedLink ? '✓ 已複製' : '🔗 分享'}
              </button>
            </div>
          </div>

          {/* Mobile Lesson Picker Trigger */}
          <button
            onClick={() => setShowMobileLessonPicker((v) => !v)}
            className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg bg-slate-950 border border-amber-500/40 text-left"
          >
            <div className="truncate pr-2">
              <span className="text-[10px] font-mono text-amber-400 font-bold mr-1.5">
                [{currentLesson.chapter}]
              </span>
              <span className="text-xs font-bold text-white">
                {currentLesson.title}
              </span>
            </div>
            <span className="text-xs text-amber-300 font-bold shrink-0">
              {showMobileLessonPicker ? '▲ 收起' : '▼ 切換範例'}
            </span>
          </button>

          {showMobileLessonPicker && (
            <div className="max-h-64 overflow-y-auto rounded-xl bg-slate-950 border border-slate-700 p-2 space-y-1.5 shadow-2xl">
              {LESSONS.map((lesson) => {
                const active = lesson.id === currentLesson.id;
                return (
                  <button
                    key={lesson.id}
                    onClick={() => {
                      setSelectedLessonId(lesson.id);
                      setShowMobileLessonPicker(false);
                    }}
                    className={`w-full text-left p-2.5 rounded-lg border transition ${
                      active
                        ? 'bg-amber-500/15 border-amber-500 text-white'
                        : 'bg-slate-900/80 border-slate-800 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] font-mono text-amber-400 mb-0.5">
                      <span>{lesson.chapter}</span>
                      <span>{lesson.connectionType}</span>
                    </div>
                    <div className="text-xs font-bold">{lesson.title}</div>
                  </button>
                );
              })}
            </div>
          )}
        </header>

        {/* 2. Sticky Top SVG Workbench Stage */}
        <div
          className={`shrink-0 flex flex-col border-b border-slate-800 bg-slate-950 transition-all ${
            mobileBoardExpanded ? 'h-[62dvh]' : 'h-[40dvh]'
          }`}
        >
          <div className="px-2.5 py-1.5 bg-slate-900/70 border-b border-slate-800/80 flex items-center justify-between gap-1 overflow-x-auto">
            <div className="flex items-center gap-1 shrink-0">
              {(
                [
                  { id: 'both', label: '🔍 雙端全景' },
                  { id: 'meter', label: '🎯 電表特寫' },
                  { id: 'device', label: '🎯 待測物特寫' },
                ] as { id: MobileCameraPreset; label: string }[]
              ).map((cam) => (
                <button
                  key={cam.id}
                  onClick={() => setMobileCamera(cam.id)}
                  className={`px-2 py-0.5 rounded text-[11px] font-semibold transition ${
                    mobileCamera === cam.id
                      ? 'bg-amber-500 text-slate-950 font-bold'
                      : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {cam.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={handleSwapProbes}
                className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
              >
                🔄 正負對調
              </button>
              <button
                onClick={() => setMobileBoardExpanded((v) => !v)}
                className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-200 border border-slate-700"
              >
                {mobileBoardExpanded ? '↕ 縮小' : '↕ 放大'}
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-auto flex items-center justify-center p-1.5 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px]">
            {renderWorkbenchSvg()}
          </div>

          {/* Live Readout Strip */}
          <div className="px-3 py-1.5 bg-slate-900 border-t border-slate-800 text-[11px] flex items-center justify-between gap-2">
            <div className="truncate font-bold text-amber-300">
              {simResult.statusTitle}
            </div>
            <div className="font-mono font-black text-cyan-300 shrink-0">
              {simResult.isNegative ? '-' : ''}
              {displayedMainText} {displayedUnitText}
            </div>
          </div>
        </div>

        {/* 3. Mobile 4-Tab Bar */}
        <div className="shrink-0 grid grid-cols-4 bg-slate-900 border-b border-slate-800 p-1 gap-1">
          <button
            onClick={() => setMobileTab('controls')}
            className={`py-1.5 rounded-lg text-xs font-bold transition ${
              mobileTab === 'controls'
                ? 'bg-amber-500 text-slate-950 shadow'
                : 'text-slate-400'
            }`}
          >
            🎛️ 檔位與探棒
          </button>
          <button
            onClick={() => setMobileTab('steps')}
            className={`py-1.5 rounded-lg text-xs font-bold transition ${
              mobileTab === 'steps'
                ? 'bg-amber-500 text-slate-950 shadow'
                : 'text-slate-400'
            }`}
          >
            📋 量測步驟
          </button>
          <button
            onClick={() => setMobileTab('rules')}
            className={`py-1.5 rounded-lg text-xs font-bold transition ${
              mobileTab === 'rules'
                ? 'bg-amber-500 text-slate-950 shadow'
                : 'text-slate-400'
            }`}
          >
            ⚠️ 原理防呆
          </button>
          <button
            onClick={() => setMobileTab('logs')}
            className={`py-1.5 rounded-lg text-xs font-bold transition ${
              mobileTab === 'logs'
                ? 'bg-amber-500 text-slate-950 shadow'
                : 'text-slate-400'
            }`}
          >
            📐 黃金守則
          </button>
        </div>

        {/* 4. Mobile Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {mobileTab === 'controls' && (
            <div className="space-y-3">
              {/* Quick Mode Selector Grid */}
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                <div className="text-xs font-bold text-amber-400">
                  1. 切換電表旋鈕檔位 (Rotary Mode)
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {DIAL_SPECS.map((d) => (
                    <button
                      key={d.mode}
                      onClick={() => setMeterMode(d.mode)}
                      className={`py-1.5 px-2 rounded-lg text-xs font-mono font-bold border transition ${
                        meterMode === d.mode
                          ? 'bg-amber-500 text-slate-950 border-amber-400'
                          : 'bg-slate-950 text-slate-300 border-slate-800'
                      }`}
                    >
                      {d.shortLabel}
                    </button>
                  ))}
                </div>
              </div>

              {/* Probe Placement Selector */}
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-cyan-400">
                    2. 操作正負極探棒測試點
                  </span>
                  <button
                    onClick={handleSwapProbes}
                    className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 text-[11px] font-bold"
                  >
                    🔄 對調紅黑探棒
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <span className="text-[11px] text-rose-300 font-bold block">
                      🔴 紅探棒 (+) 位置：
                    </span>
                    {currentLesson.testPoints.map((tp) => (
                      <button
                        key={`m-r-${tp.id}`}
                        onClick={() => setRedPointId(tp.id)}
                        className={`w-full text-left px-2 py-1.5 rounded text-[11px] font-mono border ${
                          redPointId === tp.id
                            ? 'bg-rose-500/20 border-red-500 text-white font-bold'
                            : 'bg-slate-950 border-slate-800 text-slate-400'
                        }`}
                      >
                        {tp.shortLabel}
                      </button>
                    ))}
                  </div>
                  <div className="space-y-1">
                    <span className="text-[11px] text-slate-300 font-bold block">
                      ⚫ 黑探棒 (COM -) 位置：
                    </span>
                    {currentLesson.testPoints.map((tp) => (
                      <button
                        key={`m-b-${tp.id}`}
                        onClick={() => setBlackPointId(tp.id)}
                        className={`w-full text-left px-2 py-1.5 rounded text-[11px] font-mono border ${
                          blackPointId === tp.id
                            ? 'bg-cyan-500/20 border-cyan-400 text-white font-bold'
                            : 'bg-slate-950 border-slate-800 text-slate-400'
                        }`}
                      >
                        {tp.shortLabel}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* DUT Simulation Controls */}
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2.5">
                <div className="text-xs font-bold text-emerald-400">
                  3. 調整待測設備物理狀態
                </div>
                {currentLesson.simControls.map((ctrl) => {
                  const val = simValues[ctrl.id] ?? ctrl.defaultValue;
                  if (ctrl.type === 'select' && ctrl.options) {
                    return (
                      <div key={ctrl.id} className="space-y-1">
                        <span className="text-xs text-slate-300 block">
                          {ctrl.label}
                        </span>
                        <select
                          value={val}
                          onChange={(e) =>
                            setSimValues((prev) => ({
                              ...prev,
                              [ctrl.id]: Number(e.target.value),
                            }))
                          }
                          className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white"
                        >
                          {ctrl.options.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    );
                  }
                  if (ctrl.type === 'toggle') {
                    return (
                      <div
                        key={ctrl.id}
                        className="flex items-center justify-between bg-slate-950 p-2 rounded-lg border border-slate-800"
                      >
                        <span className="text-xs text-slate-200">
                          {ctrl.label}
                        </span>
                        <button
                          onClick={() =>
                            setSimValues((prev) => ({
                              ...prev,
                              [ctrl.id]: val === 1 ? 0 : 1,
                            }))
                          }
                          className={`px-2.5 py-1 rounded text-xs font-bold ${
                            val === 1
                              ? 'bg-amber-500 text-slate-950'
                              : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {val === 1 ? '已開啟 ON' : '已關閉 OFF'}
                        </button>
                      </div>
                    );
                  }
                  return (
                    <div key={ctrl.id} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-300">{ctrl.label}</span>
                        <span className="font-mono font-bold text-amber-300">
                          {val} {ctrl.unit || ''}
                        </span>
                      </div>
                      <input
                        type="range"
                        min={ctrl.min}
                        max={ctrl.max}
                        step={ctrl.step}
                        value={val}
                        onChange={(e) =>
                          setSimValues((prev) => ({
                            ...prev,
                            [ctrl.id]: Number(e.target.value),
                          }))
                        }
                        className="w-full accent-amber-500 h-2 bg-slate-800 rounded-lg"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {mobileTab === 'steps' && (
            <div className="space-y-2.5">
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 leading-relaxed">
                {currentLesson.summary}
              </div>
              {currentLesson.stepByStepGuide.map((step, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-200 leading-relaxed flex gap-2"
                >
                  <span className="text-amber-400 font-mono font-bold">
                    {idx + 1}.
                  </span>
                  <span>{step}</span>
                </div>
              ))}
            </div>
          )}

          {mobileTab === 'rules' && (
            <div className="space-y-2.5">
              {currentLesson.pitfalls.map((pit, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 text-xs text-rose-200 leading-relaxed"
                >
                  {pit}
                </div>
              ))}
              {currentLesson.principles.map((p, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 leading-relaxed"
                >
                  • {p}
                </div>
              ))}
            </div>
          )}

          {mobileTab === 'logs' && (
            <div className="space-y-2.5">
              {GOLDEN_RULES_TABLE.map((row, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-1"
                >
                  <div className="font-bold text-amber-300">{row.quantity}</div>
                  <div className="text-cyan-300 font-mono text-[11px]">
                    接法：{row.connection} ｜ 可否通電：{row.canBePowered}
                  </div>
                  <div className="text-slate-400 text-[11px]">{row.note}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ============================================================================
  // DESKTOP THREE-COLUMN WORKBENCH (>= 1024px)
  // ============================================================================
  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-slate-950 text-slate-100">
      {/* Top Header Bar */}
      <header className="h-14 shrink-0 border-b border-slate-800 bg-slate-900/90 px-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-gradient-to-br flex items-center justify-center font-black text-slate-950 text-sm shadow-lg">
            DMM
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-base tracking-tight text-white">
                三用電表互動式圖像化學習工作台
              </h1>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 font-medium">
                Gavin Jackson &amp; UniRegensburg SWH 雙教材實戰
              </span>
            </div>
            <p className="text-xs text-slate-400">
              中央互動三用電表旋鈕與插孔 · 紅黑探棒正負極自由搭接與對調 · 9 大量測場景與防燒錶模擬
            </p>
          </div>
        </div>

        {/* Center Mode Switcher: Guided vs Quiz */}
        <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-lg border border-slate-800">
          <button
            onClick={() => setPracticeMode(false)}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              !practiceMode
                ? 'bg-amber-500 text-slate-950 shadow font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            📘 標準教學量測模式
          </button>
          <button
            onClick={() => setPracticeMode(true)}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              practiceMode
                ? 'bg-cyan-500 text-slate-950 shadow font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            ⚡ 自由轉檔搭探棒測驗模式 {practiceMode && (isQuizPassed ? '(✓ 已過關!)' : '(挑戰中)')}
          </button>
        </div>

        {/* Right Utility Controls */}
        <div className="flex items-center gap-2.5 text-xs">
          {fuseBlown && (
            <button
              onClick={() => setFuseBlown(false)}
              className="px-2.5 py-1 rounded-md bg-rose-500 text-white font-bold animate-pulse"
            >
              🔧 更換燒斷的保險絲
            </button>
          )}
          <button
            onClick={handleShareLink}
            className="px-2.5 py-1 rounded-md bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 font-semibold transition"
          >
            {copiedLink ? '✓ 已複製分享網址' : '🔗 分享目前量測狀態'}
          </button>
          <label className="flex items-center gap-1.5 cursor-pointer select-none text-slate-300">
            <input
              type="checkbox"
              checked={soundEnabled}
              onChange={(e) => setSoundEnabled(e.target.checked)}
              className="rounded accent-amber-500"
            />
            蜂鳴音效
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer select-none text-slate-300">
            <input
              type="checkbox"
              checked={showProbeLabels}
              onChange={(e) => setShowProbeLabels(e.target.checked)}
              className="rounded accent-amber-500"
            />
            測試點標籤
          </label>
          <div className="flex items-center bg-slate-800 rounded-md border border-slate-700 overflow-hidden">
            <button
              onClick={() =>
                setZoom((z) => Math.max(0.75, +(z - 0.1).toFixed(2)))
              }
              className="px-2 py-1 hover:bg-slate-700 text-slate-200"
            >
              -
            </button>
            <span className="px-2 font-mono text-[11px] text-slate-300">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() =>
                setZoom((z) => Math.min(1.3, +(z + 0.1).toFixed(2)))
              }
              className="px-2 py-1 hover:bg-slate-700 text-slate-200"
            >
              +
            </button>
          </div>
        </div>
      </header>

      {/* Main Three-Column Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT SIDEBAR: 9 Interactive Measurement Lessons */}
        <aside className="w-72 shrink-0 border-r border-slate-800 bg-slate-900/60 flex flex-col">
          <div className="p-3 border-b border-slate-800 space-y-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜尋量測主題 (如 電池, 電阻, LED, 蜂鳴, 電流)..."
              className="w-full px-3 py-1.5 text-xs rounded-lg bg-slate-950 border border-slate-800 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
            />
            <div className="flex flex-wrap gap-1">
              {[
                { id: 'ALL', label: '全部' },
                { id: 'DCV', label: 'V⎓ 直流' },
                { id: 'OHM', label: 'Ω 電阻' },
                { id: 'CONT', label: '🔊 導通' },
                { id: 'DIODE', label: '➔| 二極體' },
                { id: 'CAP', label: '⊣⊢ 電容' },
                { id: 'CURRENT', label: 'mA 電流' },
                { id: 'ACV', label: 'V~ 交流' },
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setCategoryFilter(cat.id)}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium transition ${
                    categoryFilter === cat.id
                      ? 'bg-amber-500 text-slate-950 font-bold'
                      : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2.5 space-y-2">
            {filteredLessons.map((lesson) => {
              const active = lesson.id === currentLesson.id;
              return (
                <button
                  key={lesson.id}
                  onClick={() => setSelectedLessonId(lesson.id)}
                  className={`w-full text-left p-3 rounded-xl border transition-all ${
                    active
                      ? 'bg-gradient-to-r border-amber-500/60 shadow-lg'
                      : 'bg-slate-900/70 border-slate-800/80 hover:border-slate-700 hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-[11px] font-mono text-amber-400 font-semibold">
                      {lesson.chapter}
                    </span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                        lesson.canCircuitBePowered.startsWith('NO')
                          ? 'bg-rose-500/15 text-rose-300'
                          : 'bg-emerald-500/15 text-emerald-300'
                      }`}
                    >
                      {lesson.canCircuitBePowered.startsWith('NO')
                        ? '必須斷電'
                        : '通電量測'}
                    </span>
                  </div>
                  <div className="font-bold text-xs text-slate-100 mb-1">
                    {lesson.title}
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                    {lesson.subtitle}
                  </p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    <span className="text-[10px] px-1.5 py-0.2 bg-slate-800 text-cyan-300 rounded font-mono">
                      建議檔位: {MODE_MAP[lesson.recommendedMode].shortLabel}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.2 bg-slate-800/70 text-slate-300 rounded">
                      {lesson.connectionType}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        {/* CENTER WORKSPACE: Top Mode/Probe Toolbar + Interactive SVG Stage + Bottom 3-Column Bar */}
        <main className="flex-1 flex flex-col bg-slate-950 overflow-hidden relative">
          {/* Quick Mode & Probe Control Strip */}
          <div className="px-4 py-2 border-b border-slate-800/80 bg-slate-900/50 flex flex-wrap items-center justify-between gap-2">
            {/* Rotary Mode Quick Buttons */}
            <div className="flex items-center gap-1">
              <span className="text-[11px] font-bold text-slate-400 mr-1">
                旋鈕檔位：
              </span>
              {DIAL_SPECS.map((d) => (
                <button
                  key={d.mode}
                  onClick={() => setMeterMode(d.mode)}
                  title={d.fullName}
                  className={`px-2 py-1 rounded text-xs font-mono font-bold border transition ${
                    meterMode === d.mode
                      ? 'bg-amber-500 text-slate-950 border-amber-400 shadow'
                      : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800/60'
                  }`}
                >
                  {d.shortLabel}
                </button>
              ))}
            </div>

            {/* Probe Action Controls */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-slate-400">點擊測試點移動：</span>
              <button
                onClick={() => setActiveProbeToMove('red')}
                className={`px-2.5 py-1 rounded text-xs font-bold border transition ${
                  activeProbeToMove === 'red'
                    ? 'bg-red-500 text-white border-red-500'
                    : 'bg-slate-900 text-rose-300 border-slate-800'
                }`}
              >
                🔴 紅探棒 (+) [{redTestPoint.shortLabel}]
              </button>
              <button
                onClick={() => setActiveProbeToMove('black')}
                className={`px-2.5 py-1 rounded text-xs font-bold border transition ${
                  activeProbeToMove === 'black'
                    ? 'bg-slate-700 text-white border-cyan-400'
                    : 'bg-slate-900 text-slate-300 border-slate-800'
                }`}
              >
                ⚫ 黑探棒 (-) [{blackTestPoint.shortLabel}]
              </button>
              <button
                onClick={handleSwapProbes}
                className="px-2.5 py-1 rounded text-xs font-bold bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 transition"
                title="一鍵對調紅黑探棒正負極位置"
              >
                🔄 對調正負極
              </button>
              <button
                onClick={() => applyLessonDefaults(currentLesson, false)}
                className="px-2 py-1 rounded text-xs bg-slate-800 hover:bg-slate-700 text-slate-300"
                title="自動擺好此範例的標準檔位與探棒位置"
              >
                ✨ 標準示範接法
              </button>
            </div>
          </div>

          {/* Quiz Challenge Banner when in Practice Mode */}
          {practiceMode && (
            <div
              className={`px-4 py-2 border-b flex items-center justify-between text-xs ${
                isQuizPassed
                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                  : 'bg-amber-950/40 border-amber-500/40 text-amber-200'
              }`}
            >
              <div>
                <span className="font-bold mr-2">
                  {isQuizPassed ? '🎉 測驗過關！' : '🎯 實作測驗題目：'}
                </span>
                <span>{currentLesson.quizTarget.question}</span>
              </div>
              <span className="text-[11px] font-mono text-amber-300 shrink-0 ml-2">
                提示：{currentLesson.quizTarget.hint}
              </span>
            </div>
          )}

          {/* Center SVG Stage */}
          <div className="flex-1 overflow-auto flex items-center justify-center p-3 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:20px_20px]">
            <div
              className="transition-transform origin-center"
              style={{ transform: `scale(${zoom})` }}
            >
              {renderWorkbenchSvg()}
            </div>
          </div>

          {/* Bottom 3-Column Interactive Inspector & Simulator Bar */}
          <div className="h-44 shrink-0 border-t border-slate-800 bg-slate-900/90 grid grid-cols-12 divide-x divide-slate-800">
            {/* Col 1: Real-time Diagnostic Verdict & Test Point Inspector */}
            <div className="col-span-5 p-3 flex flex-col justify-between overflow-y-auto">
              <div
                className={`p-2.5 rounded-xl border space-y-1 ${
                  simResult.statusTone === 'danger'
                    ? 'bg-rose-950/40 border-rose-500/40 text-rose-200'
                    : simResult.statusTone === 'warn'
                    ? 'bg-amber-950/40 border-amber-500/40 text-amber-200'
                    : simResult.statusTone === 'ok'
                    ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                    : 'bg-slate-950 border-slate-800 text-slate-300'
                }`}
              >
                <div className="text-xs font-bold flex items-center justify-between">
                  <span>{simResult.statusTitle}</span>
                  <span className="font-mono text-cyan-300">
                    {simResult.isNegative ? '-' : ''}
                    {displayedMainText} {displayedUnitText}
                  </span>
                </div>
                <p className="text-[11px] leading-snug opacity-90">
                  {simResult.statusDetail}
                </p>
              </div>

              <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1">
                {hoveredTestPoint ? (
                  <span className="text-cyan-300 truncate">
                    🔍 測試點 [{hoveredTestPoint.shortLabel}]：
                    {hoveredTestPoint.description}
                  </span>
                ) : (
                  <span>
                    💡 紅探棒插孔：<strong className="text-rose-300">{redJack === '10A' ? '10A 大電流孔' : 'VΩmA 標準孔'}</strong> ｜ 黑探棒：<strong className="text-slate-300">COM 接地孔</strong>
                  </span>
                )}
              </div>
            </div>

            {/* Col 2: Device Under Test (DUT) Physical Sliders & Fault Injectors */}
            <div className="col-span-4 p-3 flex flex-col justify-between overflow-y-auto">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
                  🎛️ 待測設備物理量與故障模擬器
                </span>
                <span className="text-[10px] text-slate-400">
                  即時連動電表讀數
                </span>
              </div>

              <div className="space-y-2 my-auto">
                {currentLesson.simControls.map((ctrl) => {
                  const val = simValues[ctrl.id] ?? ctrl.defaultValue;
                  if (ctrl.type === 'select' && ctrl.options) {
                    return (
                      <div key={ctrl.id} className="space-y-1">
                        <span className="text-[11px] text-slate-300 font-medium block">
                          {ctrl.label}
                        </span>
                        <select
                          value={val}
                          onChange={(e) =>
                            setSimValues((prev) => ({
                              ...prev,
                              [ctrl.id]: Number(e.target.value),
                            }))
                          }
                          className="w-full px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-700 text-xs text-cyan-300 font-medium focus:outline-none focus:border-amber-500"
                        >
                          {ctrl.options.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    );
                  }
                  if (ctrl.type === 'toggle') {
                    return (
                      <div
                        key={ctrl.id}
                        className="flex items-center justify-between bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-800"
                      >
                        <span className="text-[11px] font-medium text-slate-200 pr-2">
                          {ctrl.label}
                        </span>
                        <button
                          onClick={() =>
                            setSimValues((prev) => ({
                              ...prev,
                              [ctrl.id]: val === 1 ? 0 : 1,
                            }))
                          }
                          className={`px-2.5 py-0.5 rounded text-[11px] font-bold shrink-0 transition ${
                            val === 1
                              ? 'bg-amber-500 text-slate-950'
                              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                          }`}
                        >
                          {val === 1 ? 'ON (開啟)' : 'OFF (關閉)'}
                        </button>
                      </div>
                    );
                  }
                  return (
                    <div key={ctrl.id} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-300 text-[11px] font-medium">
                          {ctrl.label}
                        </span>
                        <span className="font-mono font-bold text-amber-300 text-xs">
                          {val} {ctrl.unit || ''}
                        </span>
                      </div>
                      <input
                        type="range"
                        min={ctrl.min}
                        max={ctrl.max}
                        step={ctrl.step}
                        value={val}
                        onChange={(e) =>
                          setSimValues((prev) => ({
                            ...prev,
                            [ctrl.id]: Number(e.target.value),
                          }))
                        }
                        className="w-full accent-amber-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Col 3: DMM Internal Telemetry Log */}
            <div className="col-span-3 p-3 bg-slate-950 flex flex-col font-mono">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  DMM 內部量測日誌
                </span>
              </div>
              <div className="flex-1 bg-slate-900/90 border border-slate-800 rounded-lg p-2 text-[10.5px] text-emerald-300 space-y-1.5 overflow-y-auto">
                {simResult.inspectorLogs.map((line, i) => (
                  <div key={i} className="leading-relaxed break-all">
                    {line}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>

        {/* RIGHT SIDEBAR: Step-by-Step Guide, Principles, Pitfalls, and UniRegensburg Golden Table */}
        <aside className="w-[430px] shrink-0 border-l border-slate-800 bg-slate-900/75 flex flex-col">
          <div className="grid grid-cols-3 border-b border-slate-800 bg-slate-950/60 p-1 gap-1">
            <button
              onClick={() => setRightTab('guide')}
              className={`py-2 rounded-lg text-xs font-bold transition ${
                rightTab === 'guide'
                  ? 'bg-slate-800 text-amber-300 shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              📋 量測步驟與原理
            </button>
            <button
              onClick={() => setRightTab('rules')}
              className={`py-2 rounded-lg text-xs font-bold transition ${
                rightTab === 'rules'
                  ? 'bg-slate-800 text-amber-300 shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              📐 黃金守則對照表
            </button>
            <button
              onClick={() => setRightTab('dialSpec')}
              className={`py-2 rounded-lg text-xs font-bold transition ${
                rightTab === 'dialSpec'
                  ? 'bg-slate-800 text-amber-300 shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              🎛️ 電表檔位圖鑑
            </button>
          </div>

          {/* RIGHT TAB 1: Lesson Guide, Test Points, Principles & Pitfalls */}
          {rightTab === 'guide' && (
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <section className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400">
                    範例概述 ({currentLesson.chapter})
                  </h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-cyan-300">
                    {currentLesson.connectionType} · {currentLesson.canCircuitBePowered}
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/70 p-3 rounded-xl border border-slate-800">
                  {currentLesson.summary}
                </p>
              </section>

              {/* Quick Probe Placement Table */}
              <section className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                    📍 待測設備測試點 (點擊可直接搭接紅/黑探棒)
                  </h3>
                </div>
                <div className="rounded-xl border border-slate-800 overflow-hidden bg-slate-950/60 divide-y divide-slate-800/70">
                  {currentLesson.testPoints.map((tp) => {
                    const isRed = redPointId === tp.id;
                    const isBlk = blackPointId === tp.id;
                    return (
                      <div
                        key={tp.id}
                        onMouseEnter={() => setHoveredTestPointId(tp.id)}
                        onMouseLeave={() => setHoveredTestPointId(null)}
                        className="p-2.5 flex items-center justify-between gap-2 hover:bg-slate-800/50 transition"
                      >
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-slate-200 truncate">
                            {tp.label}
                          </div>
                          <div className="text-[11px] text-slate-400 truncate">
                            {tp.description}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => setRedPointId(tp.id)}
                            className={`px-2 py-1 rounded text-[10px] font-bold border transition ${
                              isRed
                                ? 'bg-red-500 text-white border-red-500'
                                : 'bg-slate-900 text-rose-300 border-slate-700 hover:bg-slate-800'
                            }`}
                          >
                            🔴 紅+
                          </button>
                          <button
                            onClick={() => setBlackPointId(tp.id)}
                            className={`px-2 py-1 rounded text-[10px] font-bold border transition ${
                              isBlk
                                ? 'bg-cyan-500 text-slate-950 border-cyan-400'
                                : 'bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-800'
                            }`}
                          >
                            ⚫ 黑-
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* Step-by-Step Instructions */}
              <section className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400">
                  👣 實作量測步驟 (Step-by-Step)
                </h3>
                <div className="space-y-2">
                  {currentLesson.stepByStepGuide.map((step, idx) => (
                    <div
                      key={idx}
                      className="text-xs text-slate-200 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800 leading-relaxed flex gap-2"
                    >
                      <span className="text-amber-400 font-mono font-bold">
                        {idx + 1}.
                      </span>
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
              </section>

              {/* Formulas & Reference Cards */}
              <section className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                  🧮 歐姆定律與電氣公式對照
                </h3>
                {currentLesson.formulasAndRef.map((f, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-slate-950 border border-emerald-500/30 space-y-1"
                  >
                    <div className="text-xs font-bold text-emerald-300">
                      {f.title}
                    </div>
                    <div className="font-mono text-xs font-bold text-amber-300 bg-slate-900 px-2.5 py-1.5 rounded">
                      {f.formula}
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      {f.explanation}
                    </p>
                  </div>
                ))}
              </section>

              {/* Safety Pitfalls */}
              <section className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-rose-400">
                  ⚠️ 防燒錶警告與常見錯誤
                </h3>
                {currentLesson.pitfalls.map((item, idx) => (
                  <div
                    key={idx}
                    className="text-xs text-rose-200 bg-rose-950/40 border border-rose-500/30 p-2.5 rounded-lg leading-relaxed"
                  >
                    {item}
                  </div>
                ))}
              </section>

              {/* Principles */}
              <section className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                  🔬 電表內部運作原理 (Under the Hood)
                </h3>
                {currentLesson.principles.map((item, idx) => (
                  <div
                    key={idx}
                    className="text-xs text-slate-300 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800 leading-relaxed"
                  >
                    • {item}
                  </div>
                ))}
              </section>
            </div>
          )}

          {/* RIGHT TAB 2: UniRegensburg SWH Tutorial 1 Golden Rules & Color Chart */}
          {rightTab === 'rules' && (
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 leading-relaxed">
                <strong>🏛️ UniRegensburg SWH Tutorial 1 黃金對照表：</strong>
                每次拿起三用電表把探棒碰觸電路前，請先在腦中確認這兩個問題：「該<strong>並聯</strong>還是<strong>串聯</strong>？」以及「待測電路<strong>可以插著電嗎</strong>？」
              </div>

              <div className="rounded-xl border border-slate-800 overflow-hidden bg-slate-950/60">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-900 text-[11px] text-slate-400">
                      <th className="py-2 px-2.5">量測項目</th>
                      <th className="py-2 px-2">並聯 / 串聯</th>
                      <th className="py-2 px-2">可否通電？</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/70">
                    {GOLDEN_RULES_TABLE.map((row, i) => (
                      <tr key={i} className="hover:bg-slate-800/50">
                        <td className="py-2.5 px-2.5">
                          <div className="font-bold text-slate-100">
                            {row.quantity}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            {row.note}
                          </div>
                        </td>
                        <td className="py-2.5 px-2 font-mono text-[11px] text-cyan-300 font-bold">
                          {row.connection}
                        </td>
                        <td className="py-2.5 px-2 font-mono text-[11px]">
                          <span
                            className={`px-1.5 py-0.5 rounded font-bold ${
                              row.canBePowered.startsWith('NO')
                                ? 'bg-rose-500/20 text-rose-300'
                                : 'bg-emerald-500/20 text-emerald-300'
                            }`}
                          >
                            {row.canBePowered}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* 4-Band Resistor Color Code Reference Table */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                  🎨 四環色碼電阻速查表 (Gavin Jackson Step 4)
                </h3>
                <div className="grid grid-cols-2 gap-1.5 text-[11px] font-mono">
                  {[
                    { name: '黑 Black (0)', mult: '×1', bg: '#0f172a', text: '#f8fafc' },
                    { name: '棕 Brown (1)', mult: '×10 (±1%)', bg: '#78350f', text: '#ffffff' },
                    { name: '紅 Red (2)', mult: '×100 (±2%)', bg: '#dc2626', text: '#ffffff' },
                    { name: '橘 Orange (3)', mult: '×1k', bg: '#ea580c', text: '#ffffff' },
                    { name: '黃 Yellow (4)', mult: '×10k', bg: '#eab308', text: '#0f172a' },
                    { name: '綠 Green (5)', mult: '×100k', bg: '#10b981', text: '#0f172a' },
                    { name: '藍 Blue (6)', mult: '×1M', bg: '#2563eb', text: '#ffffff' },
                    { name: '紫 Violet (7)', mult: '×10M', bg: '#9333ea', text: '#ffffff' },
                    { name: '金 Gold (-)', mult: '×0.1 (±5%)', bg: '#ca8a04', text: '#0f172a' },
                    { name: '銀 Silver (-)', mult: '×0.01 (±10%)', bg: '#94a3b8', text: '#0f172a' },
                  ].map((b, i) => (
                    <div
                      key={i}
                      className="px-2.5 py-1.5 rounded-lg flex items-center justify-between border border-slate-700"
                      style={{ backgroundColor: b.bg, color: b.text }}
                    >
                      <span className="font-bold">{b.name}</span>
                      <span>{b.mult}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* RIGHT TAB 3: Interactive Dial & Jack Reference */}
          {rightTab === 'dialSpec' && (
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              <div className="text-xs text-slate-300 bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                點擊下方任一檔位或插孔卡片，中間的三用電表會立即同步轉動旋鈕或切換紅探棒插孔！
              </div>

              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400">
                🔌 三大香蕉插孔 (Banana Jacks)
              </h3>
              <div className="space-y-2">
                {MULTIMETER_JACKS.map((j) => (
                  <div
                    key={j.id}
                    onClick={() => {
                      if (j.id === '10A') setRedJack('10A');
                      if (j.id === 'VOMA') setRedJack('VOMA');
                    }}
                    className={`p-3 rounded-xl border transition cursor-pointer ${
                      (j.id === '10A' && redJack === '10A') ||
                      (j.id === 'VOMA' && redJack === 'VOMA')
                        ? 'bg-rose-500/15 border-red-500'
                        : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold font-mono text-white">
                        {j.label} ({j.subLabel})
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-amber-300 font-mono">
                        {j.id === 'COM'
                          ? '⚫ 黑探棒固定孔'
                          : redJack === j.id
                          ? '🔴 目前紅探棒插此孔'
                          : '點擊插入紅探棒'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      {j.description}
                    </p>
                  </div>
                ))}
              </div>

              <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400 pt-2">
                🎛️ 旋鈕 9 大檔位功能詳解
              </h3>
              <div className="space-y-2">
                {DIAL_SPECS.map((d) => {
                  const active = meterMode === d.mode;
                  return (
                    <div
                      key={d.mode}
                      onClick={() => setMeterMode(d.mode)}
                      className={`p-3 rounded-xl border transition cursor-pointer ${
                        active
                          ? 'bg-amber-500/15 border-amber-500'
                          : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-white">
                          [{d.shortLabel}] {d.fullName}
                        </span>
                        <span className="text-[10px] font-mono text-cyan-300">
                          {d.connectionRule} · {d.powerRule}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300 leading-relaxed">
                        {d.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
