# 📟 Learn Multimeter — インタラクティブ・デジタルマルチメータ学習ワークベンチ

<p align="center">
  <a href="./README.md"><strong>🇹🇼 繁體中文</strong></a> ·
  <a href="./README.en.md"><strong>🇺🇸 English</strong></a> ·
  <a href="./README.ja.md"><strong>🇯🇵 日本語</strong></a> ·
  <a href="./README.ko.md"><strong>🇰🇷 한국어</strong></a>
</p>

<p align="center">
  <a href="https://lottogt.github.io/learn-multitester/">
    <img src="https://img.shields.io/badge/%F0%9F%9A%80_Live_Demo-%E3%82%AA%E3%83%B3%E3%83%A9%E3%82%A4%E3%83%B3%E3%83%86%E3%82%B9%E3%82%BF%E3%83%BC%E3%82%92%E9%96%8B%E3%81%8F-f59e0b?style=for-the-badge" alt="Live Demo" />
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
> ### 🤖 免責事項 (Vibe Coding Disclaimer)
> このプロジェクトは個人的なデジタルマルチメータ（テスター）学習のために **Google Antigravity の Vibe Coding で100%自動生成されたもの** であり、**作者本人は全くの素人（ちんぷんかんぷん）です** 😄！ブラウザ上で自由にダイヤル切替や赤・黒プローブの当て方を練習できますが、実機や家庭用コンセントを測定する前は必ずダイヤル位置とジャック接続を再確認してください。

---

## 🌐 ブラウザで今すぐ試す

👉 **[https://lottogt.github.io/learn-multitester/](https://lottogt.github.io/learn-multitester/)**

---

## 🙏 謝辞と参考・引用した GitHub プロジェクト (Credits & References)

本プロジェクトのカリキュラムおよび回路演習は、以下の素晴らしいオープンソース教材を参考に作成されました。原作者の皆様に心より感謝申し上げます：

1. **[gavinjackson/electronics-lessons](https://github.com/gavinjackson/electronics-lessons)**（著者：**Gavin Jackson** 氏）
   - 参照ファイル：[`phase-0/01-multimeter-mastery.md`](https://github.com/gavinjackson/electronics-lessons/blob/main/phase-0/01-multimeter-mastery.md)、[`phase-0-01-multimeter-mastery.svg`](https://github.com/gavinjackson/electronics-lessons/blob/main/images/schematics/phase-0-01-multimeter-mastery.svg)
   - 内容：**FNIRSI DMT-99** マルチメータをモデルにした電池測定、MB-102 電源モジュール確認、カラーコード抵抗、導通モードによるブレッドボード探索ゲーム（The Beep Game）と断線ジャンパー線の発見、1kΩ抵抗によるコンデンサの安全放電、ダイオードモードでの LED 順方向電圧 ($V_f$) と微発光テスト。

2. **[UniRegensburg/SWH](https://github.com/UniRegensburg/SWH)**（著者：**レーゲンスブルク大学 メディア情報学グループ — *Sketching with Hardware***）
   - 参照ファイル：[`EN/tutorials/pdf/Tutorial 1: Electricity, Multimeter.pdf`](https://github.com/UniRegensburg/SWH/blob/master/EN/tutorials/pdf/Tutorial%201:%20Electricity,%20Multimeter.pdf)
   - 内容：測定の黄金ルール表（並列 vs 直列、通電可否）、オームの法則 ($R = U/I$) と電力計算 ($P = U \times I$)、可変抵抗（ポテンショメータ）と人体抵抗の影響、ボタン＋220Ω＋LED 回路の直列電流測定。

3. **[lottoGT/learn-esp32](https://github.com/lottoGT/learn-esp32)** & **[DuRuofu/ESP32-Guide](https://github.com/DuRuofu/ESP32-Guide)**
   - 内容：インタラクティブ学習ワークベンチの UI/UX 設計およびモバイル対応レイアウト。
