# RSVP Chunking Reader Pro

> 一款專為非英語母語者（ESL）與需要大量閱讀原文書的大學生打造的 Chrome 擴充功能。結合 **自然語言處理 (NLP)** 斷句與 **RSVP (快速循序視覺呈現)** 技術，讓你以光速讀懂長難句。

## 為什麼要做這個專案？

「大三閱讀原文書看到快猝死，所以我寫了個程式逼自己一分鐘看 400 字。」

身為學生，每天要面對海量的原文 Paper 或是國外新聞稿。當遇到複雜的超長合併句，常常因為大腦轉不過來而卡住。
這款工具透過演算法，把落落長的文章按照人類大腦好吸收的「意群 (Chunks)」切開，並強制你的眼睛聚焦在螢幕中央，**防分心、降低認知負擔、還能順便學單字發音！**

## 核心功能 (Features)

1. **網頁直接速讀 (Speed Read RSVP)**
   - 選取任何網頁段落，按下快捷鍵進入專屬暗黑劇院模式。
   - 文字會照著自然語法斷成的「意群」依序播放。
   - 支援 `空白鍵` 暫停，左右方向鍵調整進度。
2. **網頁原地斷句 (In-Page Chunking)**
   - 不喜歡切換視窗？直接選取複雜段落，原位自動加上 `[ ]` 括號畫出語法單位，一眼看穿句子結構。
3. **突破 PDF 限制 (Pasteboard Reader)**
   - 內建專屬的獨立工作區。無論是加密學校 PDF 或是無法反白的網頁，只要複製貼上，一鍵轉換閱讀！
   - 支援 ☀️/🌙 蘋果級深淺色主題切換。
4. **滑鼠懸停即時字典 (Instant Dictionary)**
   - 閱讀暫停時，將滑鼠停留在單字上，秒彈出英英解釋與詞性。
   - 點擊該單字鎖定字卡，自動播放 **母語人士真人發音**。

## 快捷鍵與操作

| 功能 | 快捷鍵 (Windows) | 操作情境 |
| :--- | :--- | :--- |
| **啟動 RSVP 劇院模式** | `Ctrl + Shift + S` | 選取網頁文字後按下 |
| **原地意群斷句** | `Ctrl + Shift + E` | 選取網頁文字後按下 |
| **設定介面** | 點擊右上角 `擴充功能圖案` | 調整 WPM（每分鐘閱讀字數）、Chunk Size（每組斷句長度） |

---

## 安裝方式 (Installation)

1. 下載或 Clone 本專案：
   ```bash
   git clone https://github.com/chenjia0510/rsvp-chunking-reader.git
   ```
2. 開啟 Chrome 瀏覽器，在網址列輸入 `chrome://extensions/`。
3. 開啟右上角的 **「開發人員模式 (Developer mode)」**。
4. 點擊左上角 **「載入未封裝項目 (Load unpacked)」**。
5. 選擇本專案的根目錄資料夾，安裝完成！

## 技術框架 (Tech Stack)
* **Vanilla JavaScript (ES6+)** - 最輕量與極致的效能
* **Compromise.js** - 離線自然語言處理 (NLP) 斷句演算法
* **Free Dictionary API** - 提供即時音標、發音與英文釋義
* **CSS3 Glassmorphism** - 時髦的深色毛玻璃主題 (Dark Theme)

## 贊助與支持
如果這個小工具幫你順利 Pass 了期末考、或是讓你讀 Paper 的時間少了一半，歡迎請我喝杯咖啡！

[![Ko-fi](https://img.shields.io/badge/Ko--fi-F16061?style=for-the-badge&logo=ko-fi&logoColor=white)](https://ko-fi.com/chenjia0510)

*(有興趣的開發者歡迎 Fork 本專案，一起讓英文閱讀變得更簡單！)*
