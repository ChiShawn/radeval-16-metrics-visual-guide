// Shared teaching additions, edition 2026.09.14.
function renderLearningOverview() {
  const rows = [
    ["BLEU / ROUGE", "切出文字片段，不需神經模型", "字面重疊與連續片段"],
    ["BERTScore / RadEval-BERTScore", "將 token 編成上下文向量", "兩側 token 的向量相似度"],
    ["F1CheXbert / F1RadBERT-CT", "整份報告 → 多個疾病／finding 狀態", "疾病標籤的一致性"],
    ["F1RadGraph / RadGraph–RadCliQ", "抽出實體、狀態與關係", "兩張圖的實體／關係"],
    ["RaTEScore", "先抽醫療實體，再將實體編成向量", "實體相似度與型別權重"],
    ["RadCliQ-v1", "計算四個子指標，再線性組合", "標準化後的四路訊號"],
    ["SRR-BERT", "逐句分類後 OR 合併 163 個標籤", "報告層級標籤"],
    ["Temporal F1", "NER 與規則抽時間變化詞", "時間詞集合"],
    ["GREEN / MammoGREEN", "LLM 列配對 findings 與分類錯誤", "程式解析後的配對／錯誤數"],
    ["CRIMSON", "LLM 抽取配對與臨床重要性", "程式套用臨床及屬性權重"],
    ["RadFact-CT", "LLM 拆小敘述，再逐項查支持關係", "雙向支持比例 P／R／F1"]
  ];
  return `<details class="boundary-primer">
    <summary>文字變成數字之後，16 個工具各自在做什麼？</summary>
    <div class="tokenizer-lesson">
      <p>神經模型的常見流程是：<strong>文字 → tokenizer → token IDs → embedding／模型 → 任務結果 → 計分公式</strong>。Token ID 只是詞彙表編號；編號大小不代表嚴重度，編號接近也不表示意思接近。Embedding 是模型使用的向量表示，encoder 再結合上下文處理它。</p>
      <p>並非每個工具都使用不同 tokenizer；有些共用同一套，有些有多套。BLEU、ROUGE 只要切出文字片段就能統計，不必經過模型。Tokenizer 準備輸入，模型完成分類／抽取／判斷，公式才把結果變成分數。</p>
      <div class="learning-table"><table><caption>16 項指標的分工</caption><thead><tr><th scope="col">工具</th><th scope="col">模型／演算法的工作</th><th scope="col">公式比較什麼</th></tr></thead><tbody>${rows.map(row => `<tr>${row.map(cell => `<td>${methodEscape(cell)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>
    </div>
  </details>`;
}

function renderMetricLearning(id, sourceRoot) {
  if (id === "f1chexbert") {
    return `<section class="tokenizer-lesson">
      <h4>CheXbert 的 14 類：一份報告可以同時有多個結果</h4>
      <p>它讀完整份報告，分別判斷 14 個狀況欄位。不是把每個 token 分到 14 類，也不是整份報告只能選一類。</p>
      <p class="tokenizer-example">教學例：<strong>Mild cardiomegaly. No pulmonary edema.</strong><br>若模型判讀正確：Cardiomegaly＝陽性、Edema＝陰性。這些是分類結果，不是 tokenizer 直接給出的答案。</p>
      <ol class="method-flow"><li><span>1</span>BertTokenizer 將全文編成 IDs 與 attention mask；no 仍保留。</li><li><span>2</span>BERT 處理上下文，13 個四態 head 加 1 個 No Finding 二態 head 分別分類。</li><li><span>3</span>RadEval 將 positive／uncertain 合成 1，negative／未提及合成 0，再比較兩份報告。</li></ol>
      <p>13 個一般欄位區分陽性、陰性、不確定、未提及；No Finding 的 head 是例外。逐筆輸出是標籤相同的比例，跨資料集才算 micro／macro／weighted F1。若只有 Edema 一欄不同，14 欄逐筆相同比例為 13/14，而非整份歸零。</p>
      <a class="method-source" href="${sourceRoot}radeval/metrics/f1chexbert/f1chexbert.py" target="_blank" rel="noreferrer">13＋1 分類 heads 與 checkpoint 原始碼 ↗</a>
    </section>`;
  }
  if (id === "radfact-ct") {
    const promptRoot = `${sourceRoot}radeval/metrics/radfact_ct/prompts/ct/`;
    return `<section class="tokenizer-lesson">
      <h4>「單一影像發現敘述」是什麼？</h4>
      <p>把一句話拆成<strong>可以逐項核對的小敘述</strong>。例如「左側有少量胸水，另外還有肺不張」可拆成「左側有少量胸水」與「有肺不張」。若模型只寫第一項，第二項就是漏寫。</p>
      <p>常見英文 atomic fact 被直譯為「原子事實」；這裡的 RadFact-CT 使用 atomic finding phrases／Report to Phrases。本教材改用「單一影像發現敘述」。Atomic 借指單一可核對的意思，不是物理原子，也不是拆成單字。稱為 fact 不代表已證實為真；模型產生的敘述也可能錯誤。</p>
      <p class="tokenizer-example">本卡範例的 Reference：① Acute appendicitis. ② No abscess.<br>Candidate：① Acute appendicitis. ② An abscess.<br>第一項互相支持；第二項否定相反。若拆句與判讀如上，雙向支持比例各為 1/2，逐筆 F1＝0.50。這是教學條件，不是模型實測。</p>
      <p>左／右、少量／大量、沒有、時間變化都會改變敘述意思，拆解時需保留相關資訊。實際拆分仍由 Prompt 與 LLM 決定。</p>
      <h4>Prompt 有公開，而且包含示範答案</h4>
      <ul>${[
        ["拆解報告", "report_to_phrases"],
        ["陰性過濾（filter_negatives=True 才使用）", "negative_filtering"],
        ["判斷另一份報告是否支持（NLI）", "nli"]
      ].map(([label, name]) => `<li>${label}：<a href="${promptRoot}${name}_system.txt" target="_blank" rel="noreferrer">system prompt</a> ＋ <a href="${promptRoot}${name}_examples.json" target="_blank" rel="noreferrer">few-shot 範例</a></li>`).join("")}</ul>
      <p>完整請求＝system prompt＋程式補上的格式要求＋few-shot 對話＋當次報告。只複製一個 txt 不等於重現全部流程。拆解回傳 JSON；NLI 回傳 YAML，由 parser 讀取後再計分。</p>
      <a class="method-source" href="${sourceRoot}radeval/metrics/radfact_ct/radfact_ct.py" target="_blank" rel="noreferrer">核對 Prompt 組裝與解析 ↗</a>
    </section>`;
  }
  return "";
}

function renderLocalJudgeGuide(id, sourceRoot) {
  if (!["mammo-green", "radfact-ct"].includes(id)) return "";
  const key = id === "mammo-green" ? "mammo_green" : "radfact_ct";
  const config = `metrics:\n  ${key}:\n    model_name: "YOUR_SERVED_MODEL_ID"\n    max_concurrent: 2\n${id === "radfact-ct" ? "    filter_negatives: false\n" : ""}output:\n  mode: "per_sample"`;
  return `<section class="tokenizer-lesson">
    <h4>自己的地端 gpt-oss-120b 可以接嗎？</h4>
    <p><strong>可以走 OpenAI-compatible API 路徑，是否直接相容仍需實測。</strong>「OpenAI provider」在這裡表示 client 呼叫格式；實際請求位置由 endpoint 決定。它沒有直接載入 Hugging Face 模型的入口，但可連接已部署的地端模型服務。</p>
    <ol>
      <li>服務須提供 <code>/v1/chat/completions</code>；先以 <code>/v1/models</code> 確認實際 served model ID，名稱不一定正好叫 gpt-oss-120b。</li>
      <li>啟動評分程式前，在該 process 設定 <code>OPENAI_BASE_URL</code> 為你的服務 API 根網址（通常以 <code>/v1</code> 結尾），並設定 <code>OPENAI_API_KEY</code> 為地端服務自己的金鑰。只有服務不驗證金鑰時，才使用非空占位值；不需要購買 OpenAI 金鑰。</li>
      <li>將下列 YAML 的 model ID 換成實際值，存為設定檔，用 RadEval.from_config 載入。兩種模態應分開執行：MammoGREEN 只用乳攝報告；RadFact-CT 只用 CT 報告。</li>
    </ol>
    <pre class="local-config"><code>${methodEscape(config)}</code></pre>
    <p>MammoGREEN 的 provider 偵測是「名稱以 gemini 開頭 → Gemini；其餘 → OpenAI」，不是只接受 gpt 開頭。RadFact-CT 固定走 OpenAI client，async 流程還會另建 client；環境變數須在所有 client 建立前設定。</p>
    <p><strong>相容性驗收：</strong>服務接受 temperature，MammoGREEN 還需接受 max_completion_tokens；回答須在 choices[0].message.content，格式符合 JSON／YAML parser。gpt-oss 的 tokenizer 與 chat template 由服務端處理，reasoning 不應混入要解析的 final 內容。先用少量合成報告驗證否定、左右、遺漏、格式錯誤與截斷，再增加並行；2 是保守起點，不是效能保證。</p>
    <p>同一 process 的 OPENAI_BASE_URL 會影響其他 OpenAI SDK client；不要混跑預期送雲端的模型。先確認實際目的地再送真實報告。RadEval 未知模型的費用估算會套預設費率，不能當地端真實成本。更換 judge 後記錄模型版本、量化、Prompt 與解碼設定，標為「${key}／judge=gpt-oss-120b」；不能假設與 gpt-4o-mini 的分數等價。</p>
    <p class="tokenizer-definition">依原始碼與 SDK 行為推導；未連接你的 server，也未驗證它的模型品質。先固定並核對實際安裝的 openai SDK 版本。</p>
    <div class="runtime-sources"><a href="${sourceRoot}radeval/metrics/_llm_base.py" target="_blank" rel="noreferrer">RadEval client 初始化</a><a href="${sourceRoot}radeval/metrics/_llm.py" target="_blank" rel="noreferrer">請求參數與費用估算</a><a href="https://github.com/openai/openai-python/blob/v2.15.0/src/openai/_client.py" target="_blank" rel="noreferrer">SDK 環境變數依據（v2.15.0）</a></div>
  </section>`;
}
