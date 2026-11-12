# 📟 Learn Multimeter — 인터랙티브 디지털 멀티미터(테스터기) 학습 워크벤치

<p align="center">
  <a href="./README.md"><strong>🇹🇼 繁體中文</strong></a> ·
  <a href="./README.en.md"><strong>🇺🇸 English</strong></a> ·
  <a href="./README.ja.md"><strong>🇯🇵 日本語</strong></a> ·
  <a href="./README.ko.md"><strong>🇰🇷 한국어</strong></a>
</p>

<p align="center">
  <a href="https://lottogt.github.io/learn-multitester/">
    <img src="https://img.shields.io/badge/%F0%9F%9A%80_Live_Demo-%EC%98%A8%EB%9D%BC%EC%9D%B8_%EB%A9%80%ED%8B%B0%EB%AF%B8%ED%84%B0_%EC%8B%A4%ED%96%89-f59e0b?style=for-the-badge" alt="Live Demo" />
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
> ### 🤖 면책 및 제작 성명 (Vibe Coding Disclaimer)
> 이 프로젝트는 개인적인 디지털 멀티미터(테스터기) 학습을 위해 **Google Antigravity의 Vibe Coding으로 100% 제작**되었으며, **사실 제작자 본인은 아무것도 모르는 초보자입니다** 😄! 웹에서 자유롭게 다이얼 모드 전환과 적색(+)/흑색(-) 프로브 측정을 연습해 보실 수 있지만, 실제 회로나 AC 전원을 측정하기 전에는 반드시 모드와 단자 위치를 다시 확인해 주세요!

---

## 🌐 온라인 워크벤치 바로가기

👉 **[https://lottogt.github.io/learn-multitester/](https://lottogt.github.io/learn-multitester/)**

---

## 🙏 감사의 글 및 참고한 GitHub 프로젝트 (Credits & References)

본 프로젝트의 커리큘럼과 실습 예제는 다음 오픈소스 전자공학 교재 프로젝트를 참고하여 제작되었습니다. 훌륭한 자료를 공유해 주신 원저작자분들께 깊이 감사드립니다:

1. **[gavinjackson/electronics-lessons](https://github.com/gavinjackson/electronics-lessons)** — 원저자: **Gavin Jackson**
   - 참고 자료: [`phase-0/01-multimeter-mastery.md`](https://github.com/gavinjackson/electronics-lessons/blob/main/phase-0/01-multimeter-mastery.md), [`phase-0-01-multimeter-mastery.svg`](https://github.com/gavinjackson/electronics-lessons/blob/main/images/schematics/phase-0-01-multimeter-mastery.svg)
   - 반영 내용: **FNIRSI DMT-99** 멀티미터 기반 UI, 배터리 및 MB-102 브레드보드 전원(5V/3.3V) 측정, 4색띠 저항 판독, 도통 부저를 활용한 브레드보드 찾기 게임(The Beep Game) 및 내부 단선 점퍼선 색출, 1kΩ 저항을 이용한 전해 커패시터 안전 방전, 다이오드 모드(`➔|`)를 이용한 LED 순방향 전압($V_f$) 및 미세 점등 테스트.

2. **[UniRegensburg/SWH](https://github.com/UniRegensburg/SWH)** — 원저자: **독일 레겐스부르크 대학교 미디어인포매틱스 그룹 (*Sketching with Hardware*)**
   - 참고 자료: [`EN/tutorials/pdf/Tutorial 1: Electricity, Multimeter.pdf`](https://github.com/UniRegensburg/SWH/blob/master/EN/tutorials/pdf/Tutorial%201:%20Electricity,%20Multimeter.pdf)
   - 반영 내용: 멀티미터 측정 황금 규칙 표(병렬 vs 직렬, 전원 인가 가능 여부), 옴의 법칙($R = U/I$) 및 저항 발열 전력($P = U \times I$), 가변저항(Potentiometer) 핀별 저항 변화와 인체 저항 병렬 오차 실험, 버튼+220Ω+LED 회로의 직렬 전류 측정.

3. **[lottoGT/learn-esp32](https://github.com/lottoGT/learn-esp32)** & **[DuRuofu/ESP32-Guide](https://github.com/DuRuofu/ESP32-Guide)**
   - 반영 내용: 인터랙티브 학습 워크벤치 아키텍처 및 반응형 모바일 UI/UX.
