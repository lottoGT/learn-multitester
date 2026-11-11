# 📟 Learn Multimeter — 三用電表互動式圖像化學習工作台

<p align="center">
  <a href="./README.md"><strong>🇹🇼 繁體中文</strong></a> ·
  <a href="./README.en.md"><strong>🇺🇸 English</strong></a> ·
  <a href="./README.ja.md"><strong>🇯🇵 日本語</strong></a> ·
  <a href="./README.ko.md"><strong>🇰🇷 한국어</strong></a>
</p>

<p align="center">
  <a href="https://lottogt.github.io/learn-multitester/">
    <img src="https://img.shields.io/badge/%F0%9F%9A%80_Live_Demo-%E9%BB%9E%E6%AD%A4%E7%9B%B4%E6%8E%A5%E9%96%8B%E5%95%9F%E7%B7%9A%E4%B8%8A%E4%B8%89%E7%94%A8%E9%9B%BB%E8%A1%A8-f59e0b?style=for-the-badge" alt="Live Demo" />
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
> ### 🤖 免責與創作聲明 (Vibe Coding Disclaimer)
> - **🇹🇼 中文**：本專案 **100% 完全由 Google Antigravity 以 Vibe Coding 方式自動生成**，純供本人自學三用電表（萬用表）量測操作與基礎電子學使用——**本人其實一竅不通** 😄！歡迎拿去邊看邊練習轉檔位與搭探棒，但實際拿電表量測真實電路（特別是家用 110V/220V 交流插座與串聯測電流）前，請務必再次確認旋鈕檔位與紅探棒插孔，燒保險絲或燒錶本人不負責任喔！
> - **🇺🇸 English**: This project was **100% Vibe Coded using Google Antigravity** for my own personal Digital Multimeter (DMM) learning—**I actually have no idea what I'm doing!** 😄 Feel free to play with the interactive multimeter dial and probes in your browser, but please double-check your dial mode and probe jacks before probing live hardware or AC mains!
> - **🇯🇵 日本語**：このプロジェクトは個人的なデジタルマルチメータ（テスター）学習のために **Google Antigravity の Vibe Coding で100%自動生成されたもの** であり、**作者本人は全くの素人（ちんぷんかんぷん）です** 😄！ブラウザ上で自由にダイヤル切替やプローブ操作を練習できますが、実機やコンセントを測定する前は必ずレンジと端子位置を再確認してください。
> - **🇰🇷 한국어**: 이 프로젝트는 개인적인 디지털 멀티미터(테스터기) 학습을 위해 **Google Antigravity의 Vibe Coding으로 100% 제작**되었으며, **사실 제작자 본인은 아무것도 모르는 초보자입니다** 😄! 웹에서 자유롭게 다이얼 모드와 리드봉 측정을 연습해 보실 수 있지만, 실제 회로나 전원을 측정하기 전에는 반드시 모드와 단자 위치를 다시 확인해 주세요!

---

## 🌐 線上直接玩 (Online Interactive Multimeter Workbench)

👉 **直接點擊開啟：[https://lottogt.github.io/learn-multitester/](https://lottogt.github.io/learn-multitester/)**  
*(免安裝任何軟體、免下載，電腦與手機瀏覽器點開即可直接轉動三用電表旋鈕、切換紅黑探棒正負極、聽導通蜂鳴聲、或挑戰防燒錶測驗！)*

---

## ✨ 核心功能 (Features)

| 功能模組 | 說明 |
| :--- | :--- |
| **📟 中央全圖形互動三用電表** | 內建擬真數位三用電表（參考 **FNIRSI DMT-99** 與經典旋鈕電表），支援點擊轉動 9 大檔位（`OFF`、`V⎓`、`V~`、`Ω`、`🔊`、`➔\|`、`⊣⊢`、`mA⎓`、`10A⎓`）、`HOLD` 讀數鎖定、`💡 背光`、以及切換底部三個香蕉插孔（`10A`、`COM`、`VΩmA`）。 |
| **🔴⚫ 正負極探棒自由搭接與對調** | 點擊右側設備圖上的任意測試點（Test Points）即可移動紅探棒 (`+`) 與黑探棒 (`-`)，並提供 **「🔄 正負極對調」** 按鈕，讓你親眼觀察直流電壓反接出現負號 (`-1.58V`)、二極體逆向截止 (`OL`) 的真實表現。 |
| **🔊 真實 WebAudio 導通蜂鳴器** | 在導通蜂鳴檔 (`🔊`) 進行麵包板 5 孔尋線遊戲（The Beep Game）或測試杜邦線好壞時，低於 `30Ω` 會同步觸發畫面聲波與瀏覽器原生蜂鳴器音效。 |
| **💥 防燒錶與燒保險絲震撼模擬** | 完整重現新手最常犯的致命錯誤：**「誤用電流檔 (`mA`/`10A`) 直接並聯電源」**、**「紅探棒插在 `10A` 孔去量電壓」**、**「電路未斷電就量電阻」**、**「電容未放電就直接量測」** 與 **「雙手捏住電阻腳造成人體電阻並聯誤差」**！ |
| **🏛️ 雙教材黃金守則與測驗模式** | 完整對齊 [gavinjackson/electronics-lessons](https://github.com/gavinjackson/electronics-lessons) 與德國雷根斯堡大學 [UniRegensburg/SWH Tutorial 1](https://github.com/UniRegensburg/SWH/blob/master/EN/tutorials/pdf/Tutorial%201:%20Electricity,%20Multimeter.pdf) 教材，支援「⚡ 自由轉檔搭探棒測驗模式」與網址分享。 |

---

## 📚 收錄的 9 大經典量測範例 (Included Lessons)

1. **`Lesson 01 · 電池與極性判別 (DCV)`**：測量 AA 1.5V、9V 方型電池、18650 鋰電池與 CR2032，體驗紅黑探棒反接負號 (`-`) 與新舊電量判讀。
2. **`Lesson 02 · 麵包板電源模組 (DCV)`**：測量 USB 5V 與 MB-102 麵包板電源模組上下軌（5.0V / 3.3V 跳帽切換與開關測試）。
3. **`Lesson 03 · 色碼電阻與可變電阻 (Ω)`**：四環色碼電阻辨識（`220Ω` ~ `1MΩ`）、`B10K` 三腳可變電阻滑臂 (`Pin1-Pin2-Pin3`) 旋鈕變化、斷電量測鐵律與手指並聯人體電阻 (`~300kΩ`) 誤差實驗。
4. **`Lesson 04 · 導通蜂鳴尋線遊戲 (🔊)`**：Gavin Jackson 經典「The Beep Game」麵包板 5 孔暗線尋跡 + 抓出外表完好但內部斷芯的「嫌疑杜邦線 (Suspect Jumper Wire)」。
5. **`Lesson 05 · 二極體與 LED 點亮測試 (➔|)`**：判別紅/黃/綠/藍/白光 LED 長短腳正負極，實測順向壓降 $V_f$（`1.9V ~ 3.26V`）並直接微亮畫面上的 LED，以及 `1N4148` 矽二極體單向導通測試。
6. **`Lesson 06 · 電容測量與安全放電 (⊣⊢)`**：測量 `0.1µF`、`10µF`、`1000µF` 電容，實作「先用 1kΩ 電阻跨接放電 5 秒」再量測的安全標準程序。
7. **`Lesson 07 · 串聯電流與歐姆定律 (mA⎓)`**：把電路剪開 **串聯 (In Series)** 量測 `5V + 220Ω + LED` 迴路電流（驗證 $I = (U - V_f)/R$ 與發熱功率 $P = U \times I$），並演練誤並聯電源燒斷保險絲。
8. **`Lesson 08 · 帶電電路壓降診斷 (DCV)`**：用單探棒對地巡檢與跨壓量測驗證克希荷夫電壓定律 ($5\text{V} = 3\text{V}_R + 2\text{V}_{\text{LED}}$)，無須拆件秒抓按鈕氧化斷路與 LED 虛焊故障。
9. **`Lesson 09 · 交流電壓與大電流插孔 (V~ / 10A)`**：家用 `110V/220V 60Hz` 插座火線 (短孔 L) / 水線 (長孔 N) / 接地 (圓孔 E) 量測、為什麼用 DCV 量 AC 會顯示致命假零值 (`0.0V`)、以及 `10A` 插孔防呆。

---

## 🛠️ 本機執行與後續擴充 (Local Setup & Extending)

### 1. 本機啟動
- **免安裝直接開**：下載本專案後，直接用瀏覽器打開 [`standalone.html`](./standalone.html) 即可離線使用全部功能。
- **Mac 一鍵啟動**：雙擊執行 [`啟動學習工作台.command`](./啟動學習工作台.command)。
- **開發者模式**：
  ```bash
  npm install
  npm run dev
  ```

### 2. 如何新增更多待測設備範例？
所有量測課程與測試點座標皆集中在 [`src/data/lessons.ts`](./src/data/lessons.ts)，電表物理模擬邏輯位於 [`src/utils/simulator.ts`](./src/utils/simulator.ts)。修改後執行 `npm run build` 並 `git push`，GitHub Actions 就會自動發布至 GitHub Pages！
