# RadEval 16 指標互動圖文教材

給零基礎讀者與團隊內訓使用的 RadEval 16 指標圖文講義。
每張指標卡以卡通圖、共同範例、計算式與原始碼位置說明原理，
並區分字面、語意、臨床與專科評審四種評估視角。

## 使用方式

直接以瀏覽器開啟 `index.html`。這是純前端靜態教材，
不需要安裝套件或啟動後端服務。

## 資料來源

指標定義與程式行為依據
[jbdel/RadEval](https://github.com/jbdel/RadEval) 原始碼與文件核對。

## 內容說明

- `index.html`：零基礎卡通故事版
- `technical.html`：公式、代入計算與實作 caveat 完整技術版
- 兩版的每個指標都可直接查模型類型、checkpoint、計分權重、
  Prompt／原始碼、執行範例與精細計分規則，不需切換版本。
- `assets/metric-details.js`：兩版共用的 16 項實作資料與程式範例
- `assets/edge-cases.js`：兩版共用的專屬邊界規則及 8 組例句對照
- `assets/metric-details.css`：共用技術說明的樣式
- `assets/four-rooms-cartoon-v3.png`：四個評估房間總覽
- `assets/metric-cartoons/`：16 種指標的卡通教學圖

本倉庫是教學整理，不是 RadEval 官方專案。

更新模型、權重、Prompt 或邊界規則時，請修改上述共用資料，
並確認兩版均可開啟全部 16 項。教學頁不會呼叫模型或傳送報告；
程式範例仍需另備對應環境、模型權重與 API 金鑰。
