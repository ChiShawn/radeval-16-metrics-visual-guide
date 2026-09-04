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
- `assets/operational-pitfalls.js`：16 項共 66 個實戰避坑條目、
  8 項通用檢查，以及 Linux／RTX 5090 的待執行驗收程式
- `assets/metric-details.css`：共用技術說明的樣式
- `assets/four-rooms-cartoon-v3.png`：四個評估房間總覽
- `assets/metric-cartoons/`：16 種指標的卡通教學圖

本倉庫是教學整理，不是 RadEval 官方專案。

更新模型、權重、Prompt 或邊界規則時，請修改上述共用資料，
並確認兩版均可開啟全部 16 項。教學頁不會呼叫模型或傳送報告；
程式範例仍需另備對應環境、模型權重與 API 金鑰。

## 實戰核對範圍

避坑章節依固定 RadEval commit
`d412dc2da7df92f72d0b7128aee57b0237ec1b9a` 的公開入口、
16 項 adapter 及相關 scorer／parser 整理。
每條包含風險、建議處理、驗收項目與原始碼位置；
兩版使用同一份資料。

本次無模型局部測試涵蓋 wrapper 空輸入、參數 signature、
BLEU 短句、GREEN 缺段解析、RadGraph–RadCliQ 空關係集合、
RadFact 拆句失敗／單側空集合。
未實跑神經模型、外部 LLM API 或使用者的 Linux／RTX 5090。
SRRBert 逐筆計算依 helper 原始碼核對，不等同標準 sample F1。
上游 known-good 環境與本機驗收分開標示，不宣稱已通過部署認證。
