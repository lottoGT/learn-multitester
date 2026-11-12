# 📟 Learn Multimeter — Interactive Visual Digital Multimeter Workbench

<p align="center">
  <a href="./README.md"><strong>🇹🇼 繁體中文</strong></a> ·
  <a href="./README.en.md"><strong>🇺🇸 English</strong></a> ·
  <a href="./README.ja.md"><strong>🇯🇵 日本語</strong></a> ·
  <a href="./README.ko.md"><strong>🇰🇷 한국어</strong></a>
</p>

<p align="center">
  <a href="https://lottogt.github.io/learn-multitester/">
    <img src="https://img.shields.io/badge/%F0%9F%9A%80_Live_Demo-Launch_Interactive_Multimeter-f59e0b?style=for-the-badge" alt="Live Demo" />
  </a>
  <a href="https://github.com/gavinjackson/electronics-lessons">
    <img src="https://img.shields.io/badge/Reference-gavinjackson%2Felectronics--lessons-06b6d4?style=for-the-badge" alt="electronics-lessons" />
  </a>
  <a href="https://github.com/UniRegensburg/SWH/blob/master/EN/tutorials/pdf/Tutorial%201:%20Electricity,%20Multimeter.pdf">
    <img src="https://img.shields.io/badge/Reference-UniRegensburg%2FSWH_Tutorial_1-3b82f6?style=for-the-badge" alt="UniRegensburg SWH" />
  </a>
</p>

---

> [!IMPORTANT]
> ### 🤖 Vibe Coding Disclaimer
> - **🇺🇸 English**: This project was **100% Vibe Coded using Google Antigravity** for my own personal Digital Multimeter (DMM) learning—**I actually have no idea what I'm doing!** 😄 Feel free to play with the interactive rotary dial and test probes in your browser, but please double-check your dial mode and banana jacks before probing real circuits or AC mains!
> - **🇹🇼 中文**：本專案 **100% 完全由 Google Antigravity 以 Vibe Coding 方式自動生成**，純供本人自學三用電表操作使用——**本人其實一竅不通** 😄！實際量測真實電路前請務必再次確認旋鈕檔位與紅黑探棒插孔！

---

## 🌐 Play Online in Your Browser

👉 **Launch Workbench: [https://lottogt.github.io/learn-multitester/](https://lottogt.github.io/learn-multitester/)**

---

## 🙏 Credits & Referenced GitHub Repositories

This interactive workbench builds upon the curriculum, exercises, and safety rules from the following open-source repositories. Full credit and gratitude go to the original authors:

1. **[gavinjackson/electronics-lessons](https://github.com/gavinjackson/electronics-lessons)** by **Gavin Jackson**
   - **Referenced Materials**:
     - [`phase-0/01-multimeter-mastery.md`](https://github.com/gavinjackson/electronics-lessons/blob/main/phase-0/01-multimeter-mastery.md) (*Phase Zero, Lesson 1: Multimeter Mastery*)
     - [`images/schematics/phase-0-01-multimeter-mastery.svg`](https://github.com/gavinjackson/electronics-lessons/blob/main/images/schematics/phase-0-01-multimeter-mastery.svg)
     - *Phase 1: Ohm's Law & Basic Circuits (Lessons 1.1 – 1.4)*
   - **What We Adapted**: Modeled the virtual multimeter after the **FNIRSI DMT-99**, including household battery polarity checks, MB-102 breadboard 5V/3.3V power rail verification, 4-band resistor color code matching, **The Breadboard Continuity "Beep Game"**, hunting down broken "suspect" jumper wires, safe capacitor discharging with a `1kΩ` resistor, and testing LED polarity & forward voltage ($V_f$) glow in Diode mode (`➔|`).

2. **[UniRegensburg/SWH](https://github.com/UniRegensburg/SWH)** by the **Media Informatics Group, University of Regensburg (*Sketching with Hardware*)**
   - **Referenced Materials**:
     - [`EN/tutorials/pdf/Tutorial 1: Electricity, Multimeter.pdf`](https://github.com/UniRegensburg/SWH/blob/master/EN/tutorials/pdf/Tutorial%201:%20Electricity,%20Multimeter.pdf)
     - [`EN/tutorials/docx/Tutorial 1: Electricity, Multimeter.docx`](https://github.com/UniRegensburg/SWH/blob/master/EN/tutorials/docx/Tutorial%201:%20Electricity,%20Multimeter.docx)
   - **What We Adapted**: The Golden Rule reference table (*"What? Parallel or in Series? Can the circuit be plugged in?"*), Ohm's Law ($R = U/I$) and power dissipation ($P = U \times I \le 0.25\text{W}$), LED non-ohmic behavior and $V_f$ reference table, human body parallel resistance effects, potentiometer wiper resistance, and series current measurement in a `5V + Push Button + 220Ω + LED` circuit.

3. **[lottoGT/learn-esp32](https://github.com/lottoGT/learn-esp32)** & **[DuRuofu/ESP32-Guide](https://github.com/DuRuofu/ESP32-Guide)**
   - **Referenced Materials**: Sister workbench UI/UX layout, responsive mobile camera presets, and offline `standalone.html` bundling.

---

## ✨ Key Features

- **Interactive Rotary Digital Multimeter (FNIRSI DMT-99 / Classic DMM style)**: Switch across 9 dial modes (`OFF`, `V⎓`, `V~`, `Ω`, `🔊`, `➔|`, `⊣⊢`, `mA⎓`, `10A⎓`), toggle `HOLD` & `LCD Backlight`, and move the Red Probe plug between `VΩmA` and `10A MAX` banana jacks.
- **Interactive Red (+) & Black (-) Test Probes**: Click any test point on the target device diagram to place probes, or click **Swap Polarity (`🔄`)** to observe negative voltage readings (`-1.58V`) and reverse-biased diode blocking (`OL`).
- **Real WebAudio Continuity Beep (`🔊`)**: Play Gavin Jackson's *"Breadboard Beep Game"* and hunt down internal broken jumper wires with real-time audio feedback.
- **Blown Fuse & Mistake Simulator**: Safely experience what happens when you accidentally connect a multimeter in current mode (`mA`/`10A`) in parallel across a voltage source, measure resistance on a live circuit, touch both resistor leads with your fingers (`~300kΩ` body resistance in parallel), or forget to discharge a capacitor with a `1kΩ` resistor!
