import {
  MeasurementLesson,
  MeterMode,
  MeterSimulationResult,
  RedJackPort,
} from '../types/multimeter';

export function getResistorColorBands(ohms: number): {
  colors: string[];
  names: string[];
} {
  switch (ohms) {
    case 150:
      return {
        colors: ['#78350f', '#10b981', '#78350f', '#eab308'],
        names: ['棕(1)', '綠(5)', '棕(×10)', '金(±5%)'],
      };
    case 220:
      return {
        colors: ['#ef4444', '#ef4444', '#78350f', '#eab308'],
        names: ['紅(2)', '紅(2)', '棕(×10)', '金(±5%)'],
      };
    case 470:
      return {
        colors: ['#eab308', '#a855f7', '#78350f', '#eab308'],
        names: ['黃(4)', '紫(7)', '棕(×10)', '金(±5%)'],
      };
    case 1000:
      return {
        colors: ['#78350f', '#0f172a', '#ef4444', '#eab308'],
        names: ['棕(1)', '黑(0)', '紅(×100)', '金(±5%)'],
      };
    case 4700:
      return {
        colors: ['#eab308', '#a855f7', '#ef4444', '#eab308'],
        names: ['黃(4)', '紫(7)', '紅(×100)', '金(±5%)'],
      };
    case 10000:
      return {
        colors: ['#78350f', '#0f172a', '#f97316', '#eab308'],
        names: ['棕(1)', '黑(0)', '橘(×1k)', '金(±5%)'],
      };
    case 100000:
      return {
        colors: ['#78350f', '#0f172a', '#eab308', '#eab308'],
        names: ['棕(1)', '黑(0)', '黃(×10k)', '金(±5%)'],
      };
    case 1000000:
      return {
        colors: ['#78350f', '#0f172a', '#10b981', '#eab308'],
        names: ['棕(1)', '黑(0)', '綠(×100k)', '金(±5%)'],
      };
    default:
      return {
        colors: ['#78350f', '#0f172a', '#ef4444', '#eab308'],
        names: ['棕(1)', '黑(0)', '紅(×100)', '金(±5%)'],
      };
  }
}

export function formatResistanceDisplay(ohms: number): {
  valueStr: string;
  unit: string;
} {
  if (ohms >= 1000000) {
    return { valueStr: (ohms / 1000000).toFixed(3), unit: 'MΩ' };
  }
  if (ohms >= 1000) {
    return {
      valueStr: ohms >= 100000 ? (ohms / 1000).toFixed(1) : (ohms / 1000).toFixed(2),
      unit: 'kΩ',
    };
  }
  return { valueStr: ohms < 10 ? ohms.toFixed(2) : ohms.toFixed(1), unit: 'Ω' };
}

export function simulateMultimeter(
  lesson: MeasurementLesson,
  mode: MeterMode,
  redJack: RedJackPort,
  redPointId: string,
  blackPointId: string,
  simValues: Record<string, number>,
  alreadyBlown: boolean
): MeterSimulationResult {
  // 1. Check OFF mode
  if (mode === 'OFF') {
    return {
      lcdMainText: '',
      lcdUnit: '',
      lcdSubText: 'METER OFF',
      isNegative: false,
      isBeep: false,
      isOverload: false,
      isDangerAlert: false,
      isFuseBlown: alreadyBlown,
      ledGlowIntensity: 0,
      statusTone: 'neutral',
      statusTitle: '電表目前已關機 (OFF)',
      statusDetail: '請點擊電表中央旋鈕或上方模式按鈕切換至量測檔位（建議檔位：' + lesson.recommendedMode + '）。',
      inspectorLogs: [
        '[STANDBY] 旋鈕位於 OFF 關機位置，LCD 螢幕關閉以節省內部電池電力。',
      ],
    };
  }

  // 2. Check if both probes are on the exact same test point
  if (redPointId === blackPointId) {
    if (mode === 'OHM' || mode === 'CONT') {
      return {
        lcdMainText: '0.02',
        lcdUnit: 'Ω',
        lcdSubText: mode === 'CONT' ? '🔊 BEEP (PROBE SHORT)' : 'AUTO Ω',
        isNegative: false,
        isBeep: mode === 'CONT',
        isOverload: false,
        isDangerAlert: false,
        isFuseBlown: alreadyBlown,
        ledGlowIntensity: 0,
        statusTone: 'ok',
        statusTitle: '紅黑探棒接觸同一測試點（探棒自短接歸零測試）',
        statusDetail:
          '紅黑探棒尖端直接碰在一起（或同一個金屬點），電阻僅有測試線本身的 ~0.02Ω，導通蜂鳴檔會發出嗶聲，常用於測試探棒線材本身是否完好！',
        inspectorLogs: [
          `[PROBE CHECK] 紅探棒 (${redPointId}) 與黑探棒 (${blackPointId}) 位於同一節點，電位差 0.00V、接觸電阻 0.02Ω。`,
        ],
      };
    }
    return {
      lcdMainText: '0.00',
      lcdUnit: mode === 'ACV' ? 'V~' : mode === 'DCV' ? 'V' : '',
      lcdSubText: 'SAME NODE (ΔV=0)',
      isNegative: false,
      isBeep: false,
      isOverload: false,
      isDangerAlert: false,
      isFuseBlown: alreadyBlown,
      ledGlowIntensity: 0,
      statusTone: 'warn',
      statusTitle: '紅黑探棒位於同一個測試點 (' + redPointId + ')',
      statusDetail: '同一個節點沒有電位差 (ΔV = 0V)。請將紅探棒與黑探棒分別接到待測元件的兩端！',
      inspectorLogs: [
        `[WARN] 紅黑探棒皆在 ${redPointId}，請分開探棒至不同端點。`,
      ],
    };
  }

  // Helper to check unordered pair
  const isPair = (a: string, b: string) =>
    (redPointId === a && blackPointId === b) ||
    (redPointId === b && blackPointId === a);

  // 3. Global Danger Check: Red probe plugged into 10A jack while probing a Voltage source!
  const isVoltageSourceLesson =
    lesson.id === 'dc-battery-test' ||
    lesson.id === 'usb-mb102-rails' ||
    lesson.id === 'ac-mains-safety' ||
    (lesson.id === 'series-current-ohms-law' && isPair('SER_VCC_5V', 'SER_GND')) ||
    (lesson.id === 'circuit-voltage-drop' && isPair('NODE_VCC', 'NODE_GND'));

  if (redJack === '10A' && isVoltageSourceLesson) {
    return {
      lcdMainText: 'FUSE!',
      lcdUnit: 'SHORT',
      lcdSubText: '💥 10A JACK DIRECT SHORT!',
      isNegative: false,
      isBeep: true,
      isOverload: true,
      isDangerAlert: true,
      isFuseBlown: true,
      ledGlowIntensity: 0,
      statusTone: 'danger',
      statusTitle: '💥 嚴重短路警報：紅探棒插在 10A 孔直接跨接電源！',
      statusDetail:
        '電表的「10A」插孔到「COM」孔之間內部是一根僅 0.01Ω 的粗金屬分流銅棒（無論旋鈕轉在哪一檔都直接連通！）。把插在 10A 孔的探棒跨接在電池或電源兩端會引發瞬間大短路並燒斷 10A 保險絲！請立即將紅探棒移回右側 VΩmA 孔！',
      inspectorLogs: [
        '[CRITICAL DANGER] 紅探棒插於 10A 專用孔並跨接電源正負極 -> 迴路阻抗 0.01Ω -> 瞬間短路電流 >50A -> 保險絲熔斷！',
      ],
    };
  }

  // 4. Global Check: Using DCMA / DC10A mode in parallel across a voltage source!
  if ((mode === 'DCMA' || mode === 'DC10A') && isVoltageSourceLesson) {
    return {
      lcdMainText: 'FUSE!',
      lcdUnit: 'mA',
      lcdSubText: '💥 400mA FUSE BLOWN!',
      isNegative: false,
      isBeep: true,
      isOverload: true,
      isDangerAlert: true,
      isFuseBlown: true,
      ledGlowIntensity: 0,
      statusTone: 'danger',
      statusTitle: '💥 保險絲燒斷！嚴禁使用「電流檔 (mA/10A)」直接並聯電源！',
      statusDetail:
        '電流檔內部電阻趨近於 0Ω，必須把電路剪開「串聯」進迴路！你把電流檔直接並聯跨接在電源兩端，瞬間大電流已燒斷電表內部 400mA 保險絲！請切換回電壓檔或點擊「🔧 更換保險絲」。',
      inspectorLogs: [
        '[FUSE BLOWN] 誤用電流檔 (mA/10A) 並聯跨接電源 -> 400mA/250V 快熔保險絲已燒斷！',
      ],
    };
  }

  // If fuse is already blown and user is trying to measure current in mA/10A mode
  if (alreadyBlown && (mode === 'DCMA' || mode === 'DC10A')) {
    return {
      lcdMainText: '0.00',
      lcdUnit: mode === 'DC10A' ? 'A' : 'mA',
      lcdSubText: '⚠️ FUSE OPEN (0 mA)',
      isNegative: false,
      isBeep: false,
      isOverload: false,
      isDangerAlert: true,
      isFuseBlown: true,
      ledGlowIntensity: 0,
      statusTone: 'danger',
      statusTitle: '⚠️ 電表內部電流保險絲已燒斷 (讀數永遠為 0.00 mA)',
      statusDetail:
        '這是新手最常遇到的困惑：「為什麼我照著串聯量電流卻一直顯示 0.00 mA、LED 也不亮？」因為上一次誤操作已經把電表裡的保險絲燒斷（內部斷路）了！請點擊上方「🔧 更換保險絲」按鈕修復電表。',
      inspectorLogs: [
        '[FUSE OPEN] 電表內部保險絲斷路，電流無法流過電表，請點擊更換保險絲。',
      ],
    };
  }

  // Wrong Red Jack check for normal modes (VOMA required for DCV, ACV, OHM, CONT, DIODE, CAP, DCMA)
  if (redJack === '10A' && mode !== 'DC10A') {
    return {
      lcdMainText: 'LEAD',
      lcdUnit: 'ERR',
      lcdSubText: '⚠️ MOVE RED PROBE TO VΩmA',
      isNegative: false,
      isBeep: true,
      isOverload: false,
      isDangerAlert: true,
      isFuseBlown: alreadyBlown,
      ledGlowIntensity: 0,
      statusTone: 'danger',
      statusTitle: '⚠️ 插孔錯誤 (Lead Error)：紅探棒目前插在 10A 孔！',
      statusDetail:
        '像 FNIRSI DMT-99 等現代防呆電表會偵測插孔：當旋鈕不在 10A 檔、紅探棒卻插在左側 10A 孔時會顯示 LEAD 警告。請點擊電表右下角的「VΩmA」插孔將紅探棒移過去！',
      inspectorLogs: [
        '[LEAD ERROR] 旋鈕位於 ' + mode + ' 檔，但紅探棒插在 10A 孔，無法量測且有短路風險！',
      ],
    };
  }

  if (redJack === 'VOMA' && mode === 'DC10A') {
    return {
      lcdMainText: 'LEAD',
      lcdUnit: '10A',
      lcdSubText: '⚠️ MOVE RED PROBE TO 10A JACK',
      isNegative: false,
      isBeep: true,
      isOverload: false,
      isDangerAlert: true,
      isFuseBlown: alreadyBlown,
      ledGlowIntensity: 0,
      statusTone: 'warn',
      statusTitle: '⚠️ 旋鈕在 10A 大電流檔，請將紅探棒改插至左側「10A」插孔',
      statusDetail:
        '使用 10A 檔位時必須將紅探棒插入專用的 10A 插孔；若只測量幾十毫安培的 LED 電流，請將旋鈕改轉至「mA⎓」檔即可。',
      inspectorLogs: [
        '[JACK MISMATCH] 10A 檔位需配合左側 10A 專用插孔使用。',
      ],
    };
  }

  // ==========================================================================
  // LESSON-SPECIFIC SIMULATION LOGIC
  // ==========================================================================

  // --------------------------------------------------------------------------
  // LESSON 1: DC BATTERY TEST
  // --------------------------------------------------------------------------
  if (lesson.id === 'dc-battery-test') {
    const batType = simValues['batteryType'] ?? 0;
    const charge = simValues['chargePct'] ?? 95;

    let fullV = 1.60;
    let emptyV = 1.05;
    let batName = 'AA 1.5V 鹼性電池';
    if (batType === 1) {
      fullV = 9.45;
      emptyV = 6.8;
      batName = '9V 方型電池';
    } else if (batType === 2) {
      fullV = 4.20;
      emptyV = 3.0;
      batName = '18650 鋰離子電池';
    } else if (batType === 3) {
      fullV = 3.25;
      emptyV = 2.5;
      batName = 'CR2032 鈕扣電池';
    }

    const actualV = +(emptyV + (charge / 100) * (fullV - emptyV)).toFixed(2);

    if (redPointId === 'BAT_BODY' || blackPointId === 'BAT_BODY') {
      return {
        lcdMainText: mode === 'OHM' || mode === 'CONT' || mode === 'DIODE' ? 'OL' : '0.00',
        lcdUnit: mode === 'DCV' ? 'V' : mode === 'OHM' ? 'MΩ' : '',
        lcdSubText: 'INSULATED PLASTIC WRAP',
        isNegative: false,
        isBeep: false,
        isOverload: mode === 'OHM' || mode === 'CONT' || mode === 'DIODE',
        isDangerAlert: false,
        isFuseBlown: alreadyBlown,
        ledGlowIntensity: 0,
        statusTone: 'warn',
        statusTitle: '探棒碰到電池塑膠絕緣外皮（不導電）',
        statusDetail: '電池側面的塑膠包膜是絕緣體！請將探棒尖端對準電池兩端的裸露金屬極（+ 正極突起端 與 - 負極平底端）。',
        inspectorLogs: ['[OPEN] 探棒接觸絕緣外皮，未形成電氣迴路。'],
      };
    }

    if (mode === 'OHM' || mode === 'CONT' || mode === 'DIODE' || mode === 'CAP') {
      return {
        lcdMainText: 'ERR',
        lcdUnit: 'LIVE!',
        lcdSubText: '⚠️ DO NOT MEASURE Ω ON BATTERY!',
        isNegative: false,
        isBeep: true,
        isOverload: true,
        isDangerAlert: true,
        isFuseBlown: alreadyBlown,
        ledGlowIntensity: 0,
        statusTone: 'danger',
        statusTitle: '⚠️ 嚴禁使用電阻/導通/二極體/電容檔測量帶電電池！',
        statusDetail:
          'UniRegensburg 教材黃金守則：電阻檔與導通檔只能在「無電狀態 (Power OFF)」下使用！電池本身帶有電壓，用電阻檔去量電池會讓外部電壓灌入電表內部測試電路。請將旋鈕轉至【V⎓ (直流電壓檔)】！',
        inspectorLogs: [
          `[SAFETY VIOLATION] 誤用 ${mode} 檔測量帶電 ${batName} (${actualV}V)！請立即切換至 DCV (V⎓)。`,
        ],
      };
    }

    if (mode === 'ACV') {
      return {
        lcdMainText: '0.00',
        lcdUnit: 'V~',
        lcdSubText: 'WRONG MODE (USE DCV V⎓)',
        isNegative: false,
        isBeep: false,
        isOverload: false,
        isDangerAlert: false,
        isFuseBlown: alreadyBlown,
        ledGlowIntensity: 0,
        statusTone: 'warn',
        statusTitle: '檔位錯誤：電池是「直流電 (DC)」，請轉至【V⎓】而非交流【V~】',
        statusDetail: '電池提供的是方向固定的直流電 (DC)，在交流電壓檔 (ACV) 下內部耦合電容會擋住直流訊號。請將旋鈕轉至【V⎓】！',
        inspectorLogs: ['[MODE HINT] 測量電池請選 V⎓ (DCV)。'],
      };
    }

    // DCV mode on BAT_POS & BAT_NEG
    const isReversed = redPointId === 'BAT_NEG' && blackPointId === 'BAT_POS';
    const healthStr =
      charge >= 70 ? '電量充沛 (Fresh)' : charge >= 35 ? '電量中等 (Fair)' : '電量耗盡 (Tired/Dead)';

    return {
      lcdMainText: actualV.toFixed(2),
      lcdUnit: 'V',
      lcdSubText: isReversed ? 'DC AUTO (PROBES REVERSED -)' : `DC AUTO · ${healthStr}`,
      isNegative: isReversed,
      isBeep: false,
      isOverload: false,
      isDangerAlert: false,
      isFuseBlown: alreadyBlown,
      ledGlowIntensity: 0,
      statusTone: 'ok',
      statusTitle: isReversed
        ? `🔄 紅黑探棒反接：讀數顯示負號 (-${actualV.toFixed(2)} V)`
        : `✅ 成功量測 ${batName}：+${actualV.toFixed(2)} V (${healthStr})`,
      statusDetail: isReversed
        ? `紅探棒接在負極 (-)、黑探棒接在正極 (+)，因此 V_red - V_black = -${actualV.toFixed(2)}V。數位電表出現負號完全安全，這能幫你一眼認出哪一端才是真正的正極！`
        : `紅探棒接正極 (+)、黑探棒接負極 (-)，實測開路電壓為 ${actualV.toFixed(2)}V。可拉動下方「剩餘電量」滑桿觀察新舊電池電壓差異。`,
      inspectorLogs: [
        `[DCV] 待測物：${batName} (電量 ${charge}%)`,
        `[DCV] V_red(${redPointId}) - V_black(${blackPointId}) = ${isReversed ? '-' : '+'}${actualV.toFixed(2)} V DC`,
      ],
    };
  }

  // --------------------------------------------------------------------------
  // LESSON 2: USB & MB-102 POWER RAILS
  // --------------------------------------------------------------------------
  if (lesson.id === 'usb-mb102-rails') {
    const powerOn = (simValues['mbPowerOn'] ?? 1) === 1;
    const topMode = simValues['topRailMode'] ?? 50;
    const botMode = simValues['botRailMode'] ?? 33;

    const topV = !powerOn ? 0 : topMode === 50 ? 5.02 : topMode === 33 ? 3.31 : 0;
    const botV = !powerOn ? 0 : botMode === 50 ? 5.01 : 3.31;

    const nodeVoltages: Record<string, number> = {
      RAIL_TOP_POS: topV,
      RAIL_TOP_NEG: 0,
      RAIL_BOT_POS: botV,
      RAIL_BOT_NEG: 0,
    };

    if (mode !== 'DCV') {
      if (mode === 'CONT' && isPair('RAIL_TOP_NEG', 'RAIL_BOT_NEG') && !powerOn) {
        return {
          lcdMainText: '0.08',
          lcdUnit: 'Ω',
          lcdSubText: '🔊 BEEP (COMMON GND)',
          isNegative: false,
          isBeep: true,
          isOverload: false,
          isDangerAlert: false,
          isFuseBlown: alreadyBlown,
          ledGlowIntensity: 0,
          statusTone: 'ok',
          statusTitle: '🔊 上下兩側藍色負電源軌 (- GND) 內部彼此導通！',
          statusDetail: '在斷電狀態下用導通檔驗證：MB-102 模組內部的上下兩條 GND 負極軌是直接連通的（共地 Common Ground）。',
          inspectorLogs: ['[CONT] 上下 GND 電源軌導通 (0.08Ω 🔊)。'],
        };
      }
      return {
        lcdMainText: powerOn ? 'ERR' : '0.00',
        lcdUnit: mode === 'ACV' ? 'V~' : '',
        lcdSubText: 'SWITCH DIAL TO DCV (V⎓)',
        isNegative: false,
        isBeep: powerOn && (mode === 'OHM' || mode === 'CONT'),
        isOverload: powerOn && (mode === 'OHM' || mode === 'CONT'),
        isDangerAlert: powerOn && (mode === 'OHM' || mode === 'CONT'),
        isFuseBlown: alreadyBlown,
        ledGlowIntensity: 0,
        statusTone: powerOn && (mode === 'OHM' || mode === 'CONT') ? 'danger' : 'warn',
        statusTitle: '請將旋鈕切換至【V⎓ (直流電壓檔)】以測量麵包板電源軌電壓',
        statusDetail: 'MB-102 輸出為穩定直流電壓 (DC)，請勿在通電時使用電阻檔或導通檔測量電源軌。',
        inspectorLogs: ['[HINT] 測量麵包板 3.3V / 5V 電源軌請使用 V⎓ (DCV) 檔。'],
      };
    }

    const vRed = nodeVoltages[redPointId] ?? 0;
    const vBlack = nodeVoltages[blackPointId] ?? 0;
    const diff = +(vRed - vBlack).toFixed(2);
    const isNeg = diff < 0;
    const absStr = Math.abs(diff).toFixed(2);

    return {
      lcdMainText: absStr,
      lcdUnit: 'V',
      lcdSubText: !powerOn
        ? 'MB-102 POWER SWITCH IS OFF'
        : isNeg
        ? 'DC AUTO (REVERSED -)'
        : 'DC AUTO · RAIL VOLTAGE OK',
      isNegative: isNeg,
      isBeep: false,
      isOverload: false,
      isDangerAlert: false,
      isFuseBlown: alreadyBlown,
      ledGlowIntensity: powerOn ? 1 : 0,
      statusTone: !powerOn ? 'warn' : 'ok',
      statusTitle: !powerOn
        ? 'MB-102 電源開關目前為 OFF (讀數 0.00 V)'
        : `✅ 麵包板電源軌實測：${diff >= 0 ? '+' : ''}${diff.toFixed(2)} V DC`,
      statusDetail: !powerOn
        ? 'MB-102 上的白色鎖定開關未按下（電源關閉），因此上下電源軌皆為 0.00V。請在下方開啟「MB-102 電源開關」！'
        : `紅探棒 [${redPointId} = ${vRed.toFixed(2)}V] 減 黑探棒 [${blackPointId} = ${vBlack.toFixed(2)}V] = ${diff.toFixed(2)}V。如果把紅探棒接上軌 (5V)、黑探棒接下軌 (3.3V)，還會量出兩者之間的電位差 1.71V！`,
      inspectorLogs: [
        `[MB-102] 電源開關=${powerOn ? 'ON' : 'OFF'} | 上軌設定=${topV}V | 下軌設定=${botV}V`,
        `[DCV] V(${redPointId}) - V(${blackPointId}) = ${diff.toFixed(2)} V`,
      ],
    };
  }

  // --------------------------------------------------------------------------
  // LESSON 3: RESISTOR & POTENTIOMETER (OHM)
  // --------------------------------------------------------------------------
  if (lesson.id === 'resistor-pot-ohm') {
    const resOhms = simValues['resistorOhms'] ?? 1000;
    const potPct = simValues['potTurnPct'] ?? 35;
    const fingers = (simValues['fingersTouching'] ?? 0) === 1;
    const powered = (simValues['circuitPowered'] ?? 0) === 1;

    if (powered && (mode === 'OHM' || mode === 'CONT' || mode === 'DIODE')) {
      return {
        lcdMainText: 'ERR',
        lcdUnit: 'LIVE!',
        lcdSubText: '⚠️ POWER IS ON! TURN OFF FIRST',
        isNegative: false,
        isBeep: true,
        isOverload: true,
        isDangerAlert: true,
        isFuseBlown: alreadyBlown,
        ledGlowIntensity: 0,
        statusTone: 'danger',
        statusTitle: '⚠️ 違反斷電鐵律：電路通電中 (Power ON) 絕對不可量電阻！',
        statusDetail:
          'UniRegensburg 教材特別警告：測量電阻 (Ω) 時「Can the circuit be plugged in? NO!」。外部電源電壓會干擾電表內部的歐姆測試電流，導致讀數完全失準甚至燒毀電表！請先關閉下方「錯誤示範：在電路仍通電狀態下量電阻」開關。',
        inspectorLogs: [
          '[RULE VIOLATION] 待測電路仍通電中！請先切斷電源再使用 Ω 檔。',
        ],
      };
    }

    if (mode !== 'OHM' && mode !== 'CONT') {
      return {
        lcdMainText: powered ? '5.00' : '0.00',
        lcdUnit: mode === 'DCV' ? 'V' : '',
        lcdSubText: 'SWITCH DIAL TO Ω (RESISTANCE)',
        isNegative: false,
        isBeep: false,
        isOverload: false,
        isDangerAlert: false,
        isFuseBlown: alreadyBlown,
        ledGlowIntensity: 0,
        statusTone: 'warn',
        statusTitle: '請將電表旋鈕轉至綠色【Ω (電阻檔)】以測量歐姆值',
        statusDetail: '未通電的單獨電阻沒有任何電壓 (0.00V)，必須切換至【Ω 電阻檔】由電表內部提供微小測試電流才能測出阻值。',
        inspectorLogs: ['[HINT] 請將旋鈕切換至 Ω 檔。'],
      };
    }

    // Calculate raw resistance between selected points
    let rawOhms: number | null = null;
    let targetDesc = '';

    if (isPair('RES_LEFT', 'RES_RIGHT')) {
      rawOhms = resOhms * 0.996; // realistic 1% metal film reading e.g. 996 ohms or 0.996k
      targetDesc = `四環色碼電阻 (標稱 ${resOhms >= 1000 ? resOhms / 1000 + 'kΩ' : resOhms + 'Ω'})`;
    } else if (isPair('POT_PIN1', 'POT_PIN3')) {
      rawOhms = 10000;
      targetDesc = 'B10K 可變電阻兩端固定腳 (Pin 1 ↔ Pin 3 總阻值恆為 10.0 kΩ)';
    } else if (isPair('POT_PIN1', 'POT_PIN2')) {
      rawOhms = Math.max(2, Math.round((potPct / 100) * 10000));
      targetDesc = `B10K 可變電阻左段 (Pin 1 ↔ Pin 2 滑臂，旋鈕 ${potPct}%)`;
    } else if (isPair('POT_PIN2', 'POT_PIN3')) {
      rawOhms = Math.max(2, Math.round(((100 - potPct) / 100) * 10000));
      targetDesc = `B10K 可變電阻右段 (Pin 2 滑臂 ↔ Pin 3，旋鈕 ${potPct}%)`;
    }

    if (rawOhms === null) {
      return {
        lcdMainText: 'OL',
        lcdUnit: 'MΩ',
        lcdSubText: 'OPEN LOOP (NO CONNECTION)',
        isNegative: false,
        isBeep: false,
        isOverload: true,
        isDangerAlert: false,
        isFuseBlown: alreadyBlown,
        ledGlowIntensity: 0,
        statusTone: 'warn',
        statusTitle: '開路 (OL — Over Limit)：上方色碼電阻與下方可變電阻彼此獨立未相連',
        statusDetail: '請將紅黑探棒同時接在上方色碼電阻的「電阻左腳 ↔ 電阻右腳」，或同時接在下方可變電阻的「Pin1 / Pin2 / Pin3」任兩腳之間！',
        inspectorLogs: ['[OPEN] 兩探棒分別位於兩個不相連的獨立元件上，阻值無限大 (OL)。'],
      };
    }

    // Apply parallel human body resistance (~300kΩ) if fingersTouching toggle is ON
    const bodyResistance = 300000;
    const effectiveOhms = fingers
      ? (rawOhms * bodyResistance) / (rawOhms + bodyResistance)
      : rawOhms;

    if (mode === 'CONT') {
      const beeps = effectiveOhms < 30;
      return {
        lcdMainText: beeps ? effectiveOhms.toFixed(1) : 'OL',
        lcdUnit: 'Ω',
        lcdSubText: beeps ? '🔊 BEEP (<30Ω LOW R)' : 'NO BEEP (>30Ω USE Ω MODE)',
        isNegative: false,
        isBeep: beeps,
        isOverload: !beeps,
        isDangerAlert: false,
        isFuseBlown: alreadyBlown,
        ledGlowIntensity: 0,
        statusTone: beeps ? 'ok' : 'warn',
        statusTitle: beeps
          ? `🔊 導通蜂鳴觸發 (${effectiveOhms.toFixed(1)} Ω < 30Ω)`
          : `阻值 (${Math.round(effectiveOhms)} Ω) 大於 30Ω 蜂鳴門檻，請切換至【Ω 電阻檔】讀取精確阻值`,
        statusDetail:
          '導通檔 (🔊) 僅在阻值小於 ~30Ω 時顯示讀數並鳴叫（例如可變電阻旋到底時）；測量一般電阻請轉至隔壁的【Ω 電阻檔】！',
        inspectorLogs: [`[CONT] 實測阻值 ${Math.round(effectiveOhms)}Ω。`],
      };
    }

    const formatted = formatResistanceDisplay(effectiveOhms);
    return {
      lcdMainText: formatted.valueStr,
      lcdUnit: formatted.unit,
      lcdSubText: fingers
        ? '⚠️ PARALLEL BODY RESISTANCE (~300kΩ)'
        : 'AUTO RANGE Ω · POWER OFF OK',
      isNegative: false,
      isBeep: false,
      isOverload: false,
      isDangerAlert: false,
      isFuseBlown: alreadyBlown,
      ledGlowIntensity: 0,
      statusTone: fingers && rawOhms >= 10000 ? 'warn' : 'ok',
      statusTitle: fingers
        ? `⚠️ 手指並聯干擾：實測由 ${formatResistanceDisplay(rawOhms).valueStr}${formatResistanceDisplay(rawOhms).unit} 掉到 ${formatted.valueStr} ${formatted.unit}！`
        : `✅ 成功量測 ${targetDesc}：${formatted.valueStr} ${formatted.unit}`,
      statusDetail: fingers
        ? `因為雙手同時捏住兩端金屬探針，你的人體電阻 (~300kΩ) 與待測電阻並聯了！電阻越大（如 100kΩ、1MΩ），人體並聯造成的誤差越嚴重。請務必只握住探棒塑膠絕緣柄！`
        : `電阻無正負極之分。試著轉動下方「可變電阻旋鈕角度」滑桿，並比較 Pin1↔Pin2、Pin2↔Pin3 與 Pin1↔Pin3 的阻值變化！`,
      inspectorLogs: [
        `[OHM] 目標：${targetDesc}`,
        `[OHM] 元件真實阻值=${Math.round(rawOhms)}Ω | 手指並聯=${fingers ? '開啟 (並聯 300kΩ)' : '關閉'} -> 顯示=${formatted.valueStr} ${formatted.unit}`,
      ],
    };
  }

  // --------------------------------------------------------------------------
  // LESSON 4: CONTINUITY BEEP GAME & BROKEN JUMPER WIRE
  // --------------------------------------------------------------------------
  if (lesson.id === 'continuity-beep-game') {
    const suspectState = simValues['suspectWireFault'] ?? 1; // 1=open, 2=85ohm oxidized, 0=good

    if (mode !== 'CONT' && mode !== 'OHM') {
      return {
        lcdMainText: '0.00',
        lcdUnit: mode === 'DCV' ? 'V' : '',
        lcdSubText: 'SWITCH DIAL TO 🔊 (CONTINUITY)',
        isNegative: false,
        isBeep: false,
        isOverload: false,
        isDangerAlert: false,
        isFuseBlown: alreadyBlown,
        ledGlowIntensity: 0,
        statusTone: 'warn',
        statusTitle: '請將電表旋鈕轉至【🔊 (導通蜂鳴檔)】進行尋線與斷線測試',
        statusDetail: '導通蜂鳴檔會在兩點相通 (<30Ω) 時發出「嗶—」聲，讓你不用轉頭看螢幕就能快速檢查麵包板與杜邦線！',
        inspectorLogs: ['[HINT] 請將旋鈕切換至 🔊 (CONT) 檔。'],
      };
    }

    if (isPair('BB_A1', 'BB_E1')) {
      return {
        lcdMainText: '0.12',
        lcdUnit: 'Ω',
        lcdSubText: '🔊 BEEP! ROW 1 (A1~E1) CONNECTED',
        isNegative: false,
        isBeep: mode === 'CONT',
        isOverload: false,
        isDangerAlert: false,
        isFuseBlown: alreadyBlown,
        ledGlowIntensity: 0,
        statusTone: 'ok',
        statusTitle: '🔊 嗶—！麵包板孔位 A1 與 E1 內部銅片導通 (0.12 Ω)',
        statusDetail:
          '找到了！麵包板同一欄的 A1、B1、C1、D1、E1 五個孔位底部夾著同一條磷青銅導電夾片，因此電阻僅 0.12Ω，蜂鳴器立刻長鳴！',
        inspectorLogs: ['[BEEP GAME] A1 ↔ E1 同屬第 1 欄左半部 5 孔導電條 -> 導通鳴叫 (0.12Ω 🔊)！'],
      };
    }

    if (isPair('BB_A1', 'BB_F1') || isPair('BB_E1', 'BB_F1')) {
      return {
        lcdMainText: 'OL',
        lcdUnit: 'Ω',
        lcdSubText: 'SILENT · SPLIT BY CENTER RAVINE',
        isNegative: false,
        isBeep: false,
        isOverload: true,
        isDangerAlert: false,
        isFuseBlown: alreadyBlown,
        ledGlowIntensity: 0,
        statusTone: 'warn',
        statusTitle: '🔇 不會響 (OL 開路)：中央凹槽 (Center Channel) 將左右兩側完全隔離！',
        statusDetail:
          '麵包板正中央的凹槽把每一欄切分成「A~E」與「F~J」兩段獨立的 5 孔銅片！因此 E1 與 F1 之間是不導通的，這正是為了讓 IC 晶片或四腳按鈕跨接在中央凹槽兩側時不會自短路。',
        inspectorLogs: ['[BEEP GAME] 跨過中央凹槽 (A~E vs F~J) -> 內部斷開絕緣 (OL 不響)。'],
      };
    }

    if (isPair('BB_A1', 'BB_A2') || isPair('BB_E1', 'BB_A2') || isPair('BB_F1', 'BB_A2')) {
      return {
        lcdMainText: 'OL',
        lcdUnit: 'Ω',
        lcdSubText: 'SILENT · DIFFERENT COLUMNS ISOLATED',
        isNegative: false,
        isBeep: false,
        isOverload: true,
        isDangerAlert: false,
        isFuseBlown: alreadyBlown,
        ledGlowIntensity: 0,
        statusTone: 'warn',
        statusTitle: '🔇 不會響 (OL 開路)：相鄰的不同欄 (第 1 欄 vs 第 2 欄) 彼此完全絕緣！',
        statusDetail:
          '新手最常犯的錯就是把元件兩隻腳插在「同一排 (A1 與 B1)」造成短路，或是把要接在一起的線插在「隔壁欄 (A1 與 A2)」導致斷路！記住：同欄 5 孔相通，不同欄絕緣。',
        inspectorLogs: ['[BEEP GAME] 第 1 欄與第 2 欄之間有塑膠隔板絕緣 -> 開路 (OL 不響)。'],
      };
    }

    if (isPair('WIRE_GOOD_L', 'WIRE_GOOD_R')) {
      return {
        lcdMainText: '0.15',
        lcdUnit: 'Ω',
        lcdSubText: '🔊 BEEP! GOOD JUMPER WIRE',
        isNegative: false,
        isBeep: mode === 'CONT',
        isOverload: false,
        isDangerAlert: false,
        isFuseBlown: alreadyBlown,
        ledGlowIntensity: 0,
        statusTone: 'ok',
        statusTitle: '🔊 嗶—！藍色杜邦線測試正常 (0.15 Ω 良導體)',
        statusDetail: '這條藍色杜邦線內部銅芯完好無損，壓接頭接觸良好，可以放心插上麵包板使用！',
        inspectorLogs: ['[WIRE TEST] 藍色杜邦線兩端阻值 0.15Ω -> 良品 (GOOD) 🔊！'],
      };
    }

    if (isPair('WIRE_BAD_L', 'WIRE_BAD_R')) {
      if (suspectState === 1) {
        return {
          lcdMainText: 'OL',
          lcdUnit: 'Ω',
          lcdSubText: '🚨 SILENT! BROKEN WIRE FOUND!',
          isNegative: false,
          isBeep: false,
          isOverload: true,
          isDangerAlert: false,
          isFuseBlown: alreadyBlown,
          ledGlowIntensity: 0,
          statusTone: 'ok',
          statusTitle: '🎯 抓到了！黃色嫌疑杜邦線顯示「OL 不響」——內部銅芯已經斷裂！',
          statusDetail:
            'Gavin Jackson 教材實戰金句：「Find the broken jumper wire by testing several. Mark the bad one with tape or throw it away. This saves hours later!」廉價杜邦線常在黑色塑膠殼壓接處內部斷芯，外表完全看不出來，唯有三用電表導通檔能一秒揭穿它！',
          inspectorLogs: [
            '[FAULT FOUND!] 黃色嫌疑杜邦線兩端量測為 OL (無限大歐姆，蜂鳴器不響) -> 判定為內部斷路故障線！',
          ],
        };
      } else if (suspectState === 2) {
        return {
          lcdMainText: mode === 'CONT' ? '85.4' : '85.4',
          lcdUnit: 'Ω',
          lcdSubText: '⚠️ HIGH R (85Ω) · NO BEEP (>30Ω)',
          isNegative: false,
          isBeep: false,
          isOverload: false,
          isDangerAlert: false,
          isFuseBlown: alreadyBlown,
          ledGlowIntensity: 0,
          statusTone: 'warn',
          statusTitle: '⚠️ 壓接處氧化接觸不良：阻值高達 85.4 Ω（超過 30Ω 門檻故不響）',
          statusDetail:
            '正常 20cm 杜邦線電阻應小於 0.5Ω。這條線雖然沒完全斷開，但壓接端子嚴重氧化導致高達 85Ω 的接觸電阻，若拿去接大電流感測器會造成嚴重壓降！',
          inspectorLogs: ['[WIRE TEST] 黃色杜邦線接觸電阻高達 85.4Ω (>30Ω 不發聲) -> 建議淘汰。'],
        };
      } else {
        return {
          lcdMainText: '0.14',
          lcdUnit: 'Ω',
          lcdSubText: '🔊 BEEP! REPLACED WITH GOOD WIRE',
          isNegative: false,
          isBeep: mode === 'CONT',
          isOverload: false,
          isDangerAlert: false,
          isFuseBlown: alreadyBlown,
          ledGlowIntensity: 0,
          statusTone: 'ok',
          statusTitle: '🔊 嗶—！更換後的杜邦線已恢復正常導通 (0.14 Ω)',
          statusDetail: '換上新的杜邦線後阻值僅 0.14Ω，清脆嗶聲代表線路暢通！',
          inspectorLogs: ['[WIRE TEST] 更換良品杜邦線後阻值 0.14Ω 🔊。'],
        };
      }
    }

    return {
      lcdMainText: 'OL',
      lcdUnit: 'Ω',
      lcdSubText: 'OPEN CIRCUIT (NOT CONNECTED)',
      isNegative: false,
      isBeep: false,
      isOverload: true,
      isDangerAlert: false,
      isFuseBlown: alreadyBlown,
      ledGlowIntensity: 0,
      statusTone: 'neutral',
      statusTitle: '兩探棒所在位置彼此不導通 (OL)',
      statusDetail: '這兩個測試點之間沒有金屬路徑相連。試著測試「孔位 A1 ↔ 孔位 E1」或「嫌疑線(左) ↔ 嫌疑線(右)」！',
      inspectorLogs: [`[CONT] ${redPointId} 與 ${blackPointId} 之間為開路 (OL)。`],
    };
  }

  // --------------------------------------------------------------------------
  // LESSON 5: DIODE & LED POLARITY TEST
  // --------------------------------------------------------------------------
  if (lesson.id === 'diode-led-polarity') {
    const ledType = simValues['ledColorType'] ?? 0;
    const ledSpecs = [
      { name: '紅光 LED (Red)', vf: 1.92, hex: '#ef4444' },
      { name: '黃光 LED (Yellow)', vf: 2.04, hex: '#eab308' },
      { name: '綠光 LED (Green)', vf: 2.18, hex: '#10b981' },
      { name: '藍光 LED (Blue)', vf: 3.16, hex: '#3b82f6' },
      { name: '白光 LED (White)', vf: 3.26, hex: '#f8fafc' },
    ];
    const currentLed = ledSpecs[ledType] || ledSpecs[0];

    if (mode === 'OHM' || mode === 'CONT') {
      return {
        lcdMainText: 'OL',
        lcdUnit: 'Ω',
        lcdSubText: 'TEST V TOO LOW · USE DIODE ➔| MODE!',
        isNegative: false,
        isBeep: false,
        isOverload: true,
        isDangerAlert: false,
        isFuseBlown: alreadyBlown,
        ledGlowIntensity: 0,
        statusTone: 'warn',
        statusTitle: '為什麼電阻檔/導通檔量 LED 顯示 OL？請切換至【➔| 二極體檔】！',
        statusDetail:
          '一般電阻檔 (Ω) 的內部測試電壓僅約 0.3V~0.9V，不足以跨越二極體 (0.65V) 或 LED (1.9V~3.3V) 的 PN 接面導通門檻！測量 LED 與二極體必須轉到專用的【➔| 二極體測試檔】。',
        inspectorLogs: ['[MODE HINT] 電阻檔測試電壓過低無法導通 LED，請轉至 ➔| 二極體檔。'],
      };
    }

    if (mode !== 'DIODE') {
      return {
        lcdMainText: '0.00',
        lcdUnit: 'V',
        lcdSubText: 'SWITCH DIAL TO ➔| (DIODE MODE)',
        isNegative: false,
        isBeep: false,
        isOverload: false,
        isDangerAlert: false,
        isFuseBlown: alreadyBlown,
        ledGlowIntensity: 0,
        statusTone: 'warn',
        statusTitle: '請將電表旋鈕轉至粉紅色【➔| (二極體測試檔)】',
        statusDetail: '二極體檔會由電表內部提供約 1.5mA 恆流源來點亮 LED 並直接讀出順向導通壓降 Vf！',
        inspectorLogs: ['[HINT] 請切換旋鈕至 ➔| (DIODE) 檔。'],
      };
    }

    // Forward-biased LED: Red on LED_ANODE, Black on LED_CATHODE
    if (redPointId === 'LED_ANODE' && blackPointId === 'LED_CATHODE') {
      return {
        lcdMainText: currentLed.vf.toFixed(2),
        lcdUnit: 'V',
        lcdSubText: `➔| FORWARD BIAS · LED GLOWING!`,
        isNegative: false,
        isBeep: false,
        isOverload: false,
        isDangerAlert: false,
        isFuseBlown: alreadyBlown,
        ledGlowIntensity: 0.95,
        statusTone: 'ok',
        statusTitle: `💡 ${currentLed.name} 順向導通微亮！順向壓降 Vf = ${currentLed.vf.toFixed(2)} V`,
        statusDetail: `紅探棒接長腳陽極 (+)、黑探棒接短腳陰極 (-)，電表送出的 1.5mA 測試電流成功點亮畫面上的 LED！這證明此 LED 功能完好，且需要至少 ${currentLed.vf.toFixed(2)}V 電壓才能導通發光。`,
        inspectorLogs: [
          `[DIODE] ${currentLed.name} 順向偏壓 (Anode+ ➔ Cathode-)`,
          `[DIODE] 實測順向壓降 Vf = ${currentLed.vf.toFixed(2)} V (LED 微亮點亮成功！)`,
        ],
      };
    }

    // Reverse-biased LED: Red on LED_CATHODE, Black on LED_ANODE
    if (redPointId === 'LED_CATHODE' && blackPointId === 'LED_ANODE') {
      return {
        lcdMainText: 'OL',
        lcdUnit: 'V',
        lcdSubText: '➔| REVERSE BIAS (BLOCKED)',
        isNegative: false,
        isBeep: false,
        isOverload: true,
        isDangerAlert: false,
        isFuseBlown: alreadyBlown,
        ledGlowIntensity: 0,
        statusTone: 'ok',
        statusTitle: '🛑 LED 逆向偏壓截止 (OL)：紅探棒在短腳 (-)、黑探棒在長腳 (+)',
        statusDetail:
          '二極體與 LED 只允許電流由陽極 (+) 流向陰極 (-)。當紅黑探棒反接時，PN 接面空乏區變寬阻斷電流，LED 不亮且顯示 OL。請點擊【🔄 對調紅黑探棒】即可點亮它！',
        inspectorLogs: ['[DIODE] LED 逆向偏壓截止 (Reverse Biased -> OL)。'],
      };
    }

    // Forward-biased 1N4148 Silicon Diode
    if (redPointId === 'DIODE_ANODE' && blackPointId === 'DIODE_CATHODE') {
      return {
        lcdMainText: '0.648',
        lcdUnit: 'V',
        lcdSubText: '➔| SILICON DIODE FORWARD OK',
        isNegative: false,
        isBeep: false,
        isOverload: false,
        isDangerAlert: false,
        isFuseBlown: alreadyBlown,
        ledGlowIntensity: 0,
        statusTone: 'ok',
        statusTitle: '✅ 1N4148 矽二極體順向導通：順向壓降 Vf = 0.648 V',
        statusDetail:
          '標準矽二極體（如 1N4148、1N4007）的順向導通壓降約為 0.6V ~ 0.7V。紅探棒接無色環端 (+)、黑探棒接有色環條紋端 (-) 時順利導通！',
        inspectorLogs: ['[DIODE] 1N4148 矽二極體順向壓降 Vf = 0.648 V (正常)。'],
      };
    }

    if (redPointId === 'DIODE_CATHODE' && blackPointId === 'DIODE_ANODE') {
      return {
        lcdMainText: 'OL',
        lcdUnit: 'V',
        lcdSubText: '➔| SILICON DIODE REVERSE BLOCKED',
        isNegative: false,
        isBeep: false,
        isOverload: true,
        isDangerAlert: false,
        isFuseBlown: alreadyBlown,
        ledGlowIntensity: 0,
        statusTone: 'ok',
        statusTitle: '🛑 1N4148 矽二極體逆向截止 (OL)：色環端阻擋逆向電流',
        statusDetail: '印有色環的一端為陰極 (-)。當紅探棒接陰極、黑探棒接陽極時呈現高阻抗截止狀態 (OL)，代表二極體沒有被擊穿短路！',
        inspectorLogs: ['[DIODE] 1N4148 矽二極體逆向測試 OL (無漏電或擊穿，正常)。'],
      };
    }

    return {
      lcdMainText: 'OL',
      lcdUnit: 'V',
      lcdSubText: '➔| OPEN LOOP',
      isNegative: false,
      isBeep: false,
      isOverload: true,
      isDangerAlert: false,
      isFuseBlown: alreadyBlown,
      ledGlowIntensity: 0,
      statusTone: 'neutral',
      statusTitle: '請將紅黑探棒接在同一顆 LED 或同一顆二極體的兩腳上',
      statusDetail: '上方 LED 與下方 1N4148 二極體為兩顆獨立元件，請測量同一顆元件的陽極 (+) 與陰極 (-)。',
      inspectorLogs: ['[OPEN] 探棒跨在不同元件上 (OL)。'],
    };
  }

  // --------------------------------------------------------------------------
  // LESSON 6: CAPACITANCE & SAFE DISCHARGE
  // --------------------------------------------------------------------------
  if (lesson.id === 'capacitance-safe-discharge') {
    const capNom = simValues['capNominalUf'] ?? 10;
    const isDischarged = (simValues['capDischarged'] ?? 1) === 1;

    if (!isDischarged) {
      if (mode === 'DCV') {
        return {
          lcdMainText: '11.84',
          lcdUnit: 'V',
          lcdSubText: '⚠️ RESIDUAL CHARGE DETECTED!',
          isNegative: redPointId === 'CAP_NEG',
          isBeep: false,
          isOverload: false,
          isDangerAlert: false,
          isFuseBlown: alreadyBlown,
          ledGlowIntensity: 0,
          statusTone: 'warn',
          statusTitle: '⚡ 直流電壓檔檢測：電容內部仍殘留 11.84 V 電荷！',
          statusDetail:
            '好習慣！用直流電壓檔 (DCV) 可以安全看出電容裡面還存有 11.84V 殘餘電壓。請開啟下方「⚡ 已使用 1kΩ 電阻完成安全放電」開關將電荷放光後，再切換至電容檔 (⊣⊢) 量容量！',
          inspectorLogs: ['[DCV] 偵測到電容殘餘電壓 11.84V！請先透過 1kΩ 電阻放電。'],
        };
      }

      return {
        lcdMainText: 'DISC!',
        lcdUnit: 'ERR',
        lcdSubText: '💥 CHARGED CAP (11.8V)! DISCHARGE FIRST!',
        isNegative: false,
        isBeep: true,
        isOverload: true,
        isDangerAlert: true,
        isFuseBlown: alreadyBlown,
        ledGlowIntensity: 0,
        statusTone: 'danger',
        statusTitle: '⚠️ 危險！電容器尚未放電 (殘留 11.8V)，直接用電容檔量測會燒毀電表！',
        statusDetail:
          'Gavin Jackson 教材 Step 7 強調：「Capacitors store charge, so discharge large ones first by placing a 1KΩ resistor across the leads for 5 seconds.」請先點擊下方或畫布上的【⚡ 使用 1kΩ 電阻安全放電】按鈕！',
        inspectorLogs: [
          '[CAP DANGER] 電容殘留 11.8V 高壓電荷，禁止直接以電容檔量測！請先執行 1kΩ 放電。',
        ],
      };
    }

    if (mode !== 'CAP') {
      return {
        lcdMainText: mode === 'OHM' || mode === 'DIODE' || mode === 'CONT' ? 'OL' : '0.00',
        lcdUnit: mode === 'DCV' ? 'V' : '',
        lcdSubText: 'CAP DISCHARGED (0.00V) · USE ⊣⊢ MODE',
        isNegative: false,
        isBeep: false,
        isOverload: mode === 'OHM' || mode === 'DIODE' || mode === 'CONT',
        isDangerAlert: false,
        isFuseBlown: alreadyBlown,
        ledGlowIntensity: 0,
        statusTone: 'warn',
        statusTitle: '電容已安全放電完畢 (0.00V)，請將旋鈕轉至紫色【⊣⊢ (電容檔)】測量容量',
        statusDetail: '完美的直流電容對直流電而言是開路 (OL)，必須使用專用的【⊣⊢ 電容檔】透過充放電時間常數測出 µF / nF 值。',
        inspectorLogs: ['[CAP] 電容殘餘電壓 0.00V，請切換至 ⊣⊢ (CAP) 檔。'],
      };
    }

    const isReversed = redPointId === 'CAP_NEG' && blackPointId === 'CAP_POS';
    const isPolarized = capNom >= 1;
    const measuredVal =
      capNom === 0.1
        ? '102.4'
        : capNom === 10
        ? '10.3'
        : capNom === 100
        ? '98.6'
        : '974';
    const unitStr = capNom === 0.1 ? 'nF' : 'µF';

    return {
      lcdMainText: measuredVal,
      lcdUnit: unitStr,
      lcdSubText:
        isReversed && isPolarized
          ? '⚠️ ELECTROLYTIC POLARITY REVERSED'
          : `AUTO CAP · NOMINAL ${capNom === 0.1 ? '100nF (0.1µF)' : capNom + 'µF'}`,
      isNegative: false,
      isBeep: false,
      isOverload: false,
      isDangerAlert: false,
      isFuseBlown: alreadyBlown,
      ledGlowIntensity: 0,
      statusTone: isReversed && isPolarized ? 'warn' : 'ok',
      statusTitle:
        isReversed && isPolarized
          ? `⚠️ 電解電容極性反接提醒（實測 ${measuredVal} ${unitStr}，建議紅接長腳 +、黑接白條紋 -）`
          : `✅ 成功量測已放電電容：${measuredVal} ${unitStr}（標稱 ${capNom} µF）`,
      statusDetail:
        isReversed && isPolarized
          ? '鋁質電解電容具有極性（白色條紋短腳為負極 -）。測量時將紅探棒接正極 (+)、黑探棒接負極 (-) 可避免逆向漏電流造成的讀數偏差。'
          : `電容已透過 1kΩ 電阻安全放電。實測值 ${measuredVal} ${unitStr} 落在電解電容標準 ±20% 出廠容許誤差範圍內，判定為良品！`,
      inspectorLogs: [
        `[CAP] 放電狀態=已完成 (0.0V) | 標稱值=${capNom}µF -> 實測=${measuredVal} ${unitStr}`,
      ],
    };
  }

  // --------------------------------------------------------------------------
  // LESSON 7: SERIES CURRENT & OHM'S LAW
  // --------------------------------------------------------------------------
  if (lesson.id === 'series-current-ohms-law') {
    const vSupply = simValues['supplyVolts'] ?? 5.0;
    const rOhms = simValues['seriesResistor'] ?? 220;
    const vLed = 2.0; // Red LED Vf
    const vResistor = Math.max(0, vSupply - vLed);
    const currentMa = +((vResistor / rOhms) * 1000).toFixed(2);
    const powerResistorMw = +(vResistor * currentMa).toFixed(1);

    // Check if probes are bridging the series break points SER_BREAK_A and SER_BREAK_B
    if (isPair('SER_BREAK_A', 'SER_BREAK_B')) {
      if (mode === 'DCMA' || mode === 'DC10A') {
        const isReversed = redPointId === 'SER_BREAK_B' && blackPointId === 'SER_BREAK_A';
        const displayStr =
          mode === 'DC10A' ? (currentMa / 1000).toFixed(3) : currentMa.toFixed(2);
        const unitStr = mode === 'DC10A' ? 'A' : 'mA';
        const glow = Math.min(1, Math.max(0.25, currentMa / 20));

        return {
          lcdMainText: displayStr,
          lcdUnit: unitStr,
          lcdSubText: isReversed
            ? 'SERIES CURRENT (REVERSED -)'
            : `IN SERIES OK · P_R=${powerResistorMw}mW`,
          isNegative: isReversed,
          isBeep: false,
          isOverload: false,
          isDangerAlert: false,
          isFuseBlown: alreadyBlown,
          ledGlowIntensity: glow,
          statusTone: currentMa > 25 ? 'warn' : 'ok',
          statusTitle: `✅ 串聯電流測量成功：I = ${isReversed ? '-' : ''}${displayStr} ${unitStr}（LED 已導通點亮！）`,
          statusDetail: `完美串聯！電流從 +${vSupply.toFixed(1)}V 流出 → 經 ${rOhms}Ω 電阻 (壓降 ${vResistor.toFixed(1)}V) → 從【斷開點 A】流入電表內部 → 從【斷開點 B】流出點亮紅光 LED (Vf=2.0V) → 回到 GND。符合歐姆定律 I = (${vSupply.toFixed(1)}V - 2.0V) / ${rOhms}Ω = ${currentMa} mA！`,
          inspectorLogs: [
            `[SERIES mA] 歐姆定律驗證：I = (${vSupply.toFixed(1)}V - 2.0V) / ${rOhms}Ω = ${currentMa} mA`,
            `[POWER] 電阻發熱功率 P = U_R × I = ${vResistor.toFixed(1)}V × ${currentMa}mA = ${powerResistorMw} mW (安全 < 250mW)`,
          ],
        };
      }

      if (mode === 'DCV') {
        const isReversed = redPointId === 'SER_BREAK_B';
        return {
          lcdMainText: vSupply.toFixed(2),
          lcdUnit: 'V',
          lcdSubText: 'OPEN BREAK VOLTAGE (LED OFF)',
          isNegative: isReversed,
          isBeep: false,
          isOverload: false,
          isDangerAlert: false,
          isFuseBlown: alreadyBlown,
          ledGlowIntensity: 0,
          statusTone: 'warn',
          statusTitle: `為什麼 LED 不亮且量到 ${vSupply.toFixed(2)}V？因為電表目前在「電壓檔 (DCV)」！`,
          statusDetail:
            '這題超級經典！當你把電表轉在「電壓檔 (DCV)」串聯進斷開的缺口時，因為電壓檔內阻高達 10MΩ（幾乎不讓電流通過），所以 LED 完全不會亮，且全部的電源電壓都會跨在這個斷開缺口上！請將旋鈕轉至【mA⎓ (直流毫安培檔)】讓電流通過電表！',
          inspectorLogs: [
            '[TEACHING MOMENT] 電壓檔 (10MΩ 高內阻) 串聯接入缺口 -> 迴路電流 ≈ 0.0003mA -> LED 不亮，請改轉 mA⎓ 檔！',
          ],
        };
      }
    }

    // Probing other points in Lesson 7
    if (mode === 'DCV') {
      if (isPair('SER_VCC_5V', 'SER_GND') || isPair('SER_BREAK_A', 'SER_GND')) {
        const isRev = redPointId === 'SER_GND';
        return {
          lcdMainText: vSupply.toFixed(2),
          lcdUnit: 'V',
          lcdSubText: 'SUPPLY VOLTAGE (CIRCUIT OPEN)',
          isNegative: isRev,
          isBeep: false,
          isOverload: false,
          isDangerAlert: false,
          isFuseBlown: alreadyBlown,
          ledGlowIntensity: 0,
          statusTone: 'ok',
          statusTitle: `直流電源電壓量測：${isRev ? '-' : '+'}${vSupply.toFixed(2)} V（要測電流請轉 mA⎓ 並接斷開點 A ↔ B）`,
          statusDetail: '因為斷開點 A 與 B 尚未接通，迴路沒有電流，因此電阻右端 (斷開點 A) 對 GND 電位等於電源電壓。',
          inspectorLogs: [`[DCV] 實測開路電源電壓 ${vSupply.toFixed(2)}V。`],
        };
      }
    }

    // Dangerous semi-parallel current probe: e.g. SER_BREAK_A to SER_GND (bypasses LED, only resistor in series)
    if ((mode === 'DCMA' || mode === 'DC10A') && isPair('SER_BREAK_A', 'SER_GND')) {
      const shortMa = +((vSupply / rOhms) * 1000).toFixed(2);
      return {
        lcdMainText: shortMa.toFixed(2),
        lcdUnit: 'mA',
        lcdSubText: '⚠️ BYPASSED LED TO GND!',
        isNegative: redPointId === 'SER_GND',
        isBeep: false,
        isOverload: false,
        isDangerAlert: false,
        isFuseBlown: alreadyBlown,
        ledGlowIntensity: 0,
        statusTone: 'warn',
        statusTitle: `⚠️ 探棒直接從電阻後接到了 GND（旁路了 LED，電流升至 ${shortMa} mA）`,
        statusDetail:
          `这まさに UniRegensburg Tutorial 1 的思考題：「Dial in Current and attach red probe to resistor, black probe to negative side of power source. What do you measure?」此時電流直接從電阻經電表流回 GND（跳過了 LED 的 2V 壓降），因此電流變成 I = ${vSupply}V / ${rOhms}Ω = ${shortMa} mA，且 LED 不會亮！請將黑探棒改接【斷開點 B (LED端)】！`,
        inspectorLogs: [
          `[UNIRG EXERCISE] 電阻直連電表回 GND (跳過 LED) -> I = ${vSupply}V / ${rOhms}Ω = ${shortMa} mA。`,
        ],
      };
    }

    return {
      lcdMainText: '0.00',
      lcdUnit: mode === 'DCMA' ? 'mA' : 'V',
      lcdSubText: 'CONNECT PROBES TO BREAK A & B',
      isNegative: false,
      isBeep: false,
      isOverload: false,
      isDangerAlert: false,
      isFuseBlown: alreadyBlown,
      ledGlowIntensity: 0,
      statusTone: 'neutral',
      statusTitle: '請將旋鈕轉至【mA⎓】，紅探棒接「斷開點 A」、黑探棒接「斷開點 B」完成串聯',
      statusDetail: '串聯測電流時，必須讓電表成為迴路的一部份（把斷開的 A 與 B 橋接起來），電流才會流過電表並點亮 LED。',
      inspectorLogs: ['[HINT] 請將紅黑探棒接於 SER_BREAK_A 與 SER_BREAK_B。'],
    };
  }

  // --------------------------------------------------------------------------
  // LESSON 8: CIRCUIT VOLTAGE DROP & TROUBLESHOOTING
  // --------------------------------------------------------------------------
  if (lesson.id === 'circuit-voltage-drop') {
    const btnClosed = (simValues['buttonClosed'] ?? 1) === 1;
    const fault = simValues['faultMode'] ?? 0; // 0=normal, 1=bad switch open, 2=open LED

    if (mode !== 'DCV') {
      return {
        lcdMainText: mode === 'OHM' || mode === 'CONT' ? 'ERR' : '0.00',
        lcdUnit: '',
        lcdSubText: 'USE DCV (V⎓) FOR LIVE CIRCUIT',
        isNegative: false,
        isBeep: mode === 'OHM' || mode === 'CONT',
        isOverload: mode === 'OHM' || mode === 'CONT',
        isDangerAlert: mode === 'OHM' || mode === 'CONT',
        isFuseBlown: alreadyBlown,
        ledGlowIntensity: btnClosed && fault === 0 ? 0.9 : 0,
        statusTone: mode === 'OHM' || mode === 'CONT' ? 'danger' : 'warn',
        statusTitle: '帶電電路巡檢請使用【V⎓ (直流電壓檔)】！',
        statusDetail: '電路目前連接著 5.0V 電源，切勿使用電阻檔或導通檔；使用直流電壓檔 (V⎓) 即可在不拆開任何零件的情況下診斷全電路！',
        inspectorLogs: ['[HINT] 請切換至 V⎓ (DCV) 檔進行帶電壓降診斷。'],
      };
    }

    // Compute node voltages relative to NODE_GND (0V)
    // Fault 0 (Normal):
    //   If button closed: VCC=5.00V, SW_OUT=5.00V, MID=2.00V, GND=0.00V (LED ON)
    //   If button open:   VCC=5.00V, SW_OUT=0.00V, MID=0.00V, GND=0.00V (LED OFF)
    // Fault 1 (Switch oxidized open even when pressed):
    //   VCC=5.00V, SW_OUT=0.00V, MID=0.00V, GND=0.00V (LED OFF)
    // Fault 2 (LED open-circuit / cold solder joint):
    //   If button closed: VCC=5.00V, SW_OUT=5.00V, MID=5.00V (no current through R -> 0V drop across R!), GND=0.00V (LED OFF)
    const switchActuallyConducts = btnClosed && fault !== 1;
    const ledConducts = switchActuallyConducts && fault === 0;

    const nodeV: Record<string, number> = {
      NODE_VCC: 5.0,
      NODE_SW_OUT: switchActuallyConducts ? 5.0 : 0.0,
      NODE_MID: !switchActuallyConducts ? 0.0 : fault === 2 ? 5.0 : 2.0,
      NODE_GND: 0.0,
    };

    const vRed = nodeV[redPointId] ?? 0;
    const vBlack = nodeV[blackPointId] ?? 0;
    const diff = +(vRed - vBlack).toFixed(2);
    const isNeg = diff < 0;
    const absStr = Math.abs(diff).toFixed(2);

    let diagNote = '';
    if (isPair('NODE_SW_OUT', 'NODE_MID')) {
      diagNote = ledConducts
        ? '跨接 220Ω 電阻兩端：實測電阻吃掉 3.00V 壓降 (V_R = I × R = 13.6mA × 220Ω = 3.00V)！'
        : fault === 2 && switchActuallyConducts
        ? '🔍 診斷線索：220Ω 電阻兩端壓降竟然是 0.00V！根據 V=I×R，代表完全沒有電流流過電阻（下游 LED 開路）！'
        : '目前迴路未導通（電流為 0），因此電阻兩端沒有壓降 (0.00V)。';
    } else if (isPair('NODE_MID', 'NODE_GND')) {
      diagNote = ledConducts
        ? '跨接紅光 LED 兩端：實測 LED 順向導通壓降 V_LED = 2.00V，與電阻的 3.00V 相加剛好等於電源 5.00V (KVL)！'
        : fault === 2 && switchActuallyConducts
        ? '🎯 抓到故障點！TP3 對 GND 電壓飆升到 5.00V 但 LED 卻不亮，證明 5V 已經順利通過按鈕與電阻到達 TP3，是 LED 本身斷路或虛焊！'
        : 'TP3 對地為 0.00V，代表上游（按鈕開關）沒有把 5V 送過來。';
    } else if (isPair('NODE_VCC', 'NODE_SW_OUT')) {
      diagNote = !switchActuallyConducts
        ? '跨接於斷開的按鈕兩端：全部 5.00V 電源壓降都落在斷開的開關上！' +
          (fault === 1 && btnClosed ? ' 🎯 抓到故障 A：雖然手已經按住按鈕，按鈕兩端卻還有 5.00V 壓降（TP2 為 0V），證明按鈕內部彈片氧化斷路！' : '')
        : '按鈕已按下導通，開關本身電阻趨近 0Ω，因此跨壓為 0.00V。';
    } else {
      diagNote = `節點電位差 V(${redPointId}) [${vRed.toFixed(2)}V] - V(${blackPointId}) [${vBlack.toFixed(2)}V] = ${diff.toFixed(2)}V。`;
    }

    return {
      lcdMainText: absStr,
      lcdUnit: 'V',
      lcdSubText: ledConducts
        ? 'KVL: 5.0V = 3.0V(R) + 2.0V(LED)'
        : fault !== 0
        ? `TROUBLESHOOTING FAULT #${fault}`
        : 'BUTTON OPEN (CIRCUIT IDLE)',
      isNegative: isNeg,
      isBeep: false,
      isOverload: false,
      isDangerAlert: false,
      isFuseBlown: alreadyBlown,
      ledGlowIntensity: ledConducts ? 0.95 : 0,
      statusTone: 'ok',
      statusTitle: `🔎 節點壓降實測：${diff >= 0 ? '+' : ''}${diff.toFixed(2)} V DC`,
      statusDetail: diagNote,
      inspectorLogs: [
        `[NODE MAP] TP1(+5V)=${nodeV.NODE_VCC}V | TP2(按鈕後)=${nodeV.NODE_SW_OUT}V | TP3(LED陽極)=${nodeV.NODE_MID}V | TP4(GND)=0V`,
        `[PROBE] ${diagNote}`,
      ],
    };
  }

  // --------------------------------------------------------------------------
  // LESSON 9: AC MAINS VOLTAGE & SAFETY
  // --------------------------------------------------------------------------
  if (lesson.id === 'ac-mains-safety') {
    const mainsV = simValues['mainsRegion'] ?? 115;

    if (mode === 'OHM' || mode === 'CONT' || mode === 'DIODE' || mode === 'CAP') {
      return {
        lcdMainText: 'ERR!',
        lcdUnit: 'HV!',
        lcdSubText: '💥 DANGER! AC MAINS IN Ω MODE!',
        isNegative: false,
        isBeep: true,
        isOverload: true,
        isDangerAlert: true,
        isFuseBlown: alreadyBlown,
        ledGlowIntensity: 0,
        statusTone: 'danger',
        statusTitle: '💥 極度危險！嚴禁使用電阻/導通/二極體/電容檔插入家用交流插座！',
        statusDetail:
          '家用插座帶有 110V/220V 高壓交流電，若轉在電阻或導通檔插進插座，高壓會直接擊穿電表內部保護元件甚至引發電表炸裂！測量插座請務必先轉至黃色【V~ (交流電壓檔)】！',
        inspectorLogs: [
          '[CRITICAL SAFETY] 嚴禁以非電壓檔位接觸 AC 市電插座！請立即切換至 V~ (ACV)。',
        ],
      };
    }

    if (mode === 'DCV') {
      return {
        lcdMainText: '0.02',
        lcdUnit: 'V',
        lcdSubText: '⚠️ FALSE ZERO! SWITCH TO ACV (V~)!',
        isNegative: false,
        isBeep: true,
        isOverload: false,
        isDangerAlert: true,
        isFuseBlown: alreadyBlown,
        ledGlowIntensity: 0,
        statusTone: 'danger',
        statusTitle: '⚠️ 致命假零值警報：用「直流檔 (V⎓)」量交流電會顯示 ~0.0V！',
        statusDetail:
          `插座明明帶有 ${mainsV}V 交流高壓，為什麼顯示 0.02V？因為 60Hz 交流電每秒正負交替 60 次，直流電壓檔 (DCV) 取平均值後正負半週剛好互相抵銷為 0！若因此誤以為插座沒電而徒手觸碰會立刻觸電！請將旋鈕轉至【V~ (交流電壓檔)】！`,
        inspectorLogs: [
          `[FALSE ZERO WARNING] 以 DCV 測量 ${mainsV}V 60Hz 交流電 -> 正負半週平均抵銷顯示 0.02V！請改用 V~ (ACV)。`,
        ],
      };
    }

    // ACV mode
    if (isPair('AC_HOT', 'AC_NEUTRAL') || isPair('AC_HOT', 'AC_GND')) {
      const reading = isPair('AC_HOT', 'AC_NEUTRAL')
        ? (mainsV + 0.4).toFixed(1)
        : (mainsV + 0.1).toFixed(1);
      const peakV = Math.round(mainsV * 1.414);

      return {
        lcdMainText: reading,
        lcdUnit: 'V~',
        lcdSubText: `TRUE RMS · 60Hz (Vp=${peakV}V)`,
        isNegative: false, // AC never shows negative polarity sign!
        isBeep: false,
        isOverload: false,
        isDangerAlert: false,
        isFuseBlown: alreadyBlown,
        ledGlowIntensity: 0,
        statusTone: 'ok',
        statusTitle: `⚡ 交流電壓實測：${reading} V~ (60Hz True-RMS，無正負極之分)`,
        statusDetail: `火線 (短孔 L) 與 ${isPair('AC_HOT', 'AC_NEUTRAL') ? '水線 (長孔 N)' : '接地孔 (圓孔 E)'} 之間實測為 ${reading}V AC（瞬間正弦波峰值高達 ±${peakV}V）。注意：對調紅黑探棒讀數完全相同，不會出現負號！`,
        inspectorLogs: [
          `[ACV] True-RMS 實測 = ${reading} V~ (60Hz) | 峰值 V_peak = ±${peakV} V`,
          `[SAFETY] 紅探棒位於 VΩmA 孔，符合 CAT II / CAT III 絕緣安全規範。`,
        ],
      };
    }

    if (isPair('AC_NEUTRAL', 'AC_GND')) {
      return {
        lcdMainText: '0.3',
        lcdUnit: 'V~',
        lcdSubText: 'NEUTRAL TO EARTH (<2V OK)',
        isNegative: false,
        isBeep: false,
        isOverload: false,
        isDangerAlert: false,
        isFuseBlown: alreadyBlown,
        ledGlowIntensity: 0,
        statusTone: 'ok',
        statusTitle: '水線 (長孔 N) 對 接地孔 (圓孔 E)：0.3 V~ (配電正常)',
        statusDetail:
          '在正常家庭配電箱中，中性線（水線 N）與接地線（E）在總匯流排處相連，因此兩者之間電位差極小（通常 < 2V AC）。這也是電工師傅用三用電表分辨哪一孔是火線、哪一孔是水線的標準方法！',
        inspectorLogs: ['[ACV] 水線 (N) ↔ 接地 (E) = 0.3 V~，確認長孔為中性線。'],
      };
    }
  }

  return {
    lcdMainText: '0.00',
    lcdUnit: '',
    lcdSubText: 'READY',
    isNegative: false,
    isBeep: false,
    isOverload: false,
    isDangerAlert: false,
    isFuseBlown: alreadyBlown,
    ledGlowIntensity: 0,
    statusTone: 'neutral',
    statusTitle: '請選擇測試點',
    statusDetail: '點擊畫布上的測試點移動紅黑探棒。',
    inspectorLogs: [],
  };
}
