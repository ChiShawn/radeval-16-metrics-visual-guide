const runtimeNotes = {
  "bleu": {
    llm: false,
    verdict: "非 LLM｜純規則式 n-gram 指標",
    model: "沒有神經模型。使用套件內的 COCO-style BleuScorer，直接計數連續 n-gram。",
    weights: "沒有模型 checkpoint。RadEval adapter 固定 n=4；BLEU-4 對 1～4-gram 採等權幾何平均（每階 1/4），並套 brevity penalty。",
    prompt: "不適用：不呼叫生成模型，因此沒有 system prompt、user prompt 或解碼參數。",
    fixed: "CPU；預設 BLEU-4。detailed=True 另算 BLEU-1/2/3。adapter 沒有暴露 n 供 RadEval(metrics={...}) 改寫。",
    install: "pip install radeval",
    sampleRef: "mild cardiomegaly with small effusion",
    sampleHyp: "mild cardiomegaly",
    metricConfig: "[\"bleu\"]",
    sources: [["adapter", "radeval/metrics/bleu/adapter.py"], ["計分器", "radeval/metrics/bleu/bleu_scorer.py"]]
  },
  "rouge": {
    llm: false,
    verdict: "非 LLM｜規則式重疊指標",
    model: "沒有神經模型。使用 google rouge_score 的 RougeScorer。",
    weights: "沒有 checkpoint 或可學習權重。固定 rouge1、rouge2、rougeL，use_stemmer=True；RadEval 取各自的 fmeasure。",
    prompt: "不適用：沒有 prompt，也不會連網推論。",
    fixed: "CPU；對每一筆取 ROUGE F1，再做算術平均。它不是頁面文字常說的純 recall。",
    install: "pip install radeval",
    sampleRef: "mild cardiomegaly with small effusion",
    sampleHyp: "mild cardiomegaly",
    metricConfig: "[\"rouge\"]",
    sources: [["adapter", "radeval/metrics/rouge/adapter.py"]]
  },
  "bertscore": {
    llm: false,
    verdict: "非 LLM｜通用 Transformer encoder",
    model: "Hugging Face checkpoint：distilbert-base-uncased；取第 5 層 contextual token embeddings。它只編碼，不生成文字。",
    weights: "首次執行由 Transformers 下載 DistilBERT 權重；BERTScore baseline TSV 隨套件內附。固定 rescale_with_baseline=True、idf=False、batch_size=64、nthreads=4。",
    prompt: "不適用：輸入直接 tokenize 成 token embeddings，沒有 chat template 或自然語言提示詞。",
    fixed: "模型與層數由 adapter 寫死；RadEval 公開介面目前不接受 model_type／num_layers 覆寫。裝置由 BERTScore scorer 自動選擇。",
    install: "pip install radeval",
    sampleRef: "No pleural effusion.",
    sampleHyp: "Pleural effusion.",
    metricConfig: "[\"bertscore\"]",
    sources: [["adapter", "radeval/metrics/bertscore/adapter.py"], ["scorer", "radeval/metrics/bertscore/bertscore.py"], ["checkpoint", "https://huggingface.co/distilbert/distilbert-base-uncased"]]
  },
  "radeval-bertscore": {
    llm: false,
    verdict: "非 LLM｜放射領域 Transformer encoder",
    model: "Hugging Face checkpoint：IAMJB/RadEvalModernBERT；RadEval 固定取第 22 層做 BERTScore token 對齊。",
    weights: "首次執行下載 IAMJB/RadEvalModernBERT 權重。固定 use_fast_tokenizer=True、rescale_with_baseline=False；不另外載入 score regression 權重。",
    prompt: "不適用：這是 encoder similarity，不是會遵循指令的生成式 LLM。",
    fixed: "模型、num_layers=22 與不做 baseline rescaling 都由 adapter 固定，公開 RadEval 設定目前不能改。",
    install: "pip install radeval",
    sampleRef: "Mild cardiomegaly.",
    sampleHyp: "The cardiac silhouette is mildly enlarged.",
    metricConfig: "[\"radeval_bertscore\"]",
    sources: [["adapter", "radeval/metrics/radevalbertscore/adapter.py"], ["checkpoint", "https://huggingface.co/IAMJB/RadEvalModernBERT"]]
  },
  "f1chexbert": {
    llm: false,
    verdict: "非 LLM｜BERT 多標籤分類器",
    model: "bert-base-uncased backbone + 13 個四分類 head 與 No Finding head；checkpoint 是 StanfordAIMI/RRG_scorers 的 chexbert.pth。",
    weights: "模型權重自 Hugging Face 下載到 appdirs 的 chexbert cache。batch_size=64；adapter 內部 F1CheXbert 預設 device=\"cuda\"。計分是標籤 F1，沒有 prompt 權重。",
    prompt: "不適用：報告直接送入 tokenizer／分類 head；模型輸出每個 CheXpert condition 的狀態。",
    fixed: "重要：公開 adapter 沒暴露 device。CPU-only 環境若預設初始化失敗，需直接建立 F1CheXbert(device=\"cpu\")，或在有 CUDA 的環境跑。",
    install: "pip install radeval",
    sampleRef: "Mild cardiomegaly. No pulmonary edema.",
    sampleHyp: "Mild cardiomegaly. No pulmonary edema.",
    metricConfig: "[\"f1chexbert\"]",
    sources: [["adapter", "radeval/metrics/f1chexbert/adapter.py"], ["模型載入", "radeval/metrics/f1chexbert/f1chexbert.py"], ["權重倉庫", "https://huggingface.co/StanfordAIMI/RRG_scorers"]]
  },
  "f1radbert-ct": {
    llm: false,
    verdict: "非 LLM｜CT 多標籤分類器",
    model: "Hugging Face checkpoint：IAMJB/RadBERT-CT；AutoModelForSequenceClassification 對 18 個 CT findings 輸出 logits。",
    weights: "下載 RadBERT-CT checkpoint。固定 sigmoid(logit) > 0.5、batch_size=16、max_length=512；若 18 類全未亮，程式再衍生第 19 欄 No finding。",
    prompt: "不適用：沒有自然語言 prompt；報告經 tokenizer 後直接分類。",
    fixed: "device 預設 cuda，但程式偵測不到 CUDA 時會 fallback CPU。公開 adapter 沒暴露 threshold／batch_size。",
    install: "pip install radeval",
    sampleRef: "Small pleural effusion with adjacent atelectasis.",
    sampleHyp: "Small pleural effusion with adjacent atelectasis.",
    metricConfig: "[\"f1radbert_ct\"]",
    sources: [["adapter", "radeval/metrics/f1Radbert_ct/adapter.py"], ["分類器", "radeval/metrics/f1Radbert_ct/f1Radbert_ct.py"], ["checkpoint", "https://huggingface.co/IAMJB/RadBERT-CT"]]
  },
  "radgraph": {
    llm: false,
    verdict: "非 LLM｜實體／關係抽取模型",
    model: "RadGraph 0.1.18 相容推論核心；adapter 固定 model_type=\"radgraph-xl\"、reward_level=\"all\"。模型抽取 entity、label 與 relation graph。",
    weights: "從 StanfordAIMI/RRG_scorers 下載 radgraph-xl.tar.gz，解到 appdirs 的 radgraph/0.1.18/radgraph-xl cache；archive 內含 config、vocabulary、weights.th。",
    prompt: "不適用：這是資訊抽取模型，報告不是以 system/user message 送入。",
    fixed: "裝置自動選 CUDA:0，否則 CPU。輸出 simple／partial／complete 三個 reward level；RadEval adapter 不提供 model_type 覆寫。",
    install: "pip install radeval",
    sampleRef: "Small left pleural effusion.",
    sampleHyp: "Left pleural effusion.",
    metricConfig: "[\"radgraph\"]",
    sources: [["adapter", "radeval/metrics/_radgraph_adapter.py"], ["模型下載／cache", "radeval/metrics/radgraph/_vendor/core.py"], ["權重倉庫", "https://huggingface.co/StanfordAIMI/RRG_scorers"]]
  },
  "ratescore": {
    llm: false,
    verdict: "非 LLM｜NER + 醫療語意 encoder",
    model: "兩個 checkpoint：Angelakeke/RaTE-NER-Deberta 做醫療實體辨識；FremyCompany/BioLORD-2023-C 產生實體語意向量。",
    weights: "除兩組模型權重外，預設 affinity_matrix=\"long\"：內嵌 5×5 實體型別權重矩陣，neg_weight=0.8716553966489615。這些不是使用者 prompt。",
    prompt: "不適用：先用 medspaCy 切句、NER 圈實體，再以 BioLORD cosine 與型別 affinity 加權。",
    fixed: "use_gpu=None 時自動選 GPU；batch_size=1。任一側抽不到實體時，原始實作直接給 0.5。公開 adapter 不暴露 long／short matrix 切換。",
    install: "pip install radeval",
    sampleRef: "Mild cardiomegaly.",
    sampleHyp: "The heart is mildly enlarged.",
    metricConfig: "[\"ratescore\"]",
    sources: [["adapter", "radeval/metrics/RaTEScore/adapter.py"], ["模型與 affinity", "radeval/metrics/RaTEScore/scorer.py"], ["計分", "radeval/metrics/RaTEScore/utils.py"]]
  },
  "radgraph-radcliq": {
    llm: false,
    verdict: "非 LLM｜RadGraph 結構 F1",
    model: "使用原版 model_type=\"radgraph\"，不是 F1RadGraph 卡片使用的 radgraph-xl；目的是重現 RadCliQ-v1 的子分數。",
    weights: "從 StanfordAIMI/RRG_scorers 下載 radgraph.tar.gz。計分固定為 (entity_f1 + relation_f1) / 2，兩部分各 0.5。",
    prompt: "不適用：沒有 LLM prompt；兩份報告各自抽 graph，再做 exact set overlap。",
    fixed: "entity set 使用 (tokens, label)；relation set 使用 (source, target, relation type)。公開 adapter 不暴露 model_type。",
    install: "pip install radeval",
    sampleRef: "Small left pleural effusion.",
    sampleHyp: "Left pleural effusion.",
    metricConfig: "[\"radgraph_radcliq\"]",
    sources: [["adapter", "radeval/metrics/radgraph_radcliq/adapter.py"], ["計分器", "radeval/metrics/radgraph_radcliq/radgraph_radcliq.py"], ["權重倉庫", "https://huggingface.co/StanfordAIMI/RRG_scorers"]]
  },
  "radcliq": {
    llm: false,
    verdict: "非 LLM｜四特徵線性 composite",
    model: "組合 RadGraph(original)、distilroberta-base BERTScore、CheXbert report embedding cosine、BLEU-2；沒有生成式 judge。",
    weights: "先以 μ=[0.53792312,0.61757256,0.76479421,0.44738335]、σ=[0.30282584,0.22430938,0.25394391,0.29892717] 標準化；係數=[−0.377083683,−0.370300100,−0.252616218,4.31504841e−12]，bias=2.46655256e−10。",
    prompt: "不適用：四個子模型／規則直接產生數值特徵，再乘固定回歸係數。",
    fixed: "BERTScore 固定 distilroberta-base、layer 5、IDF=True（IDF 由本次 refs 建立）、baseline rescaling=True。per_sample 是線性輸出；aggregate 是 1 / mean(per_sample)，方向不可混用。",
    install: "pip install radeval",
    sampleRef: "No pleural effusion.",
    sampleHyp: "Pleural effusion.",
    metricConfig: "[\"radcliq\"]",
    sources: [["adapter", "radeval/metrics/RadCliQv1/adapter.py"], ["係數與子模型", "radeval/metrics/RadCliQv1/radcliq.py"]]
  },
  "srrbert": {
    llm: false,
    verdict: "非 LLM｜句子級 BERT 多標籤分類器",
    model: "checkpoint：StanfordAIMI/SRR-BERT-Leaves-with-Statuses；tokenizer：microsoft/BiomedVLP-CXR-BERT-general；內建 mapping 共 163 個 leaf-with-status labels。",
    weights: "Hugging Face 下載 classifier checkpoint；label mapping 隨 radeval 套件附帶。固定 sigmoid > 0.5、batch_size=4、max_length=512。",
    prompt: "不適用：先用 NLTK punkt_tab 切句，每句分類，再用 OR（np.any）合併成整份報告標籤。",
    fixed: "初始化會下載 NLTK punkt_tab。裝置自動選 CUDA／CPU。公開 adapter 固定 model_type=leaves_with_statuses，不能由 metrics config 改成 upper。",
    install: "pip install radeval",
    sampleRef: "Small left pleural effusion. No pneumothorax.",
    sampleHyp: "No pneumothorax. Small left pleural effusion.",
    metricConfig: "[\"srrbert\"]",
    sources: [["adapter", "radeval/metrics/SRRBert/adapter.py"], ["分類器", "radeval/metrics/SRRBert/srr_bert.py"], ["checkpoint", "https://huggingface.co/StanfordAIMI/SRR-BERT-Leaves-with-Statuses"]]
  },
  "temporal": {
    llm: false,
    verdict: "非 LLM｜Stanza NER + 固定關鍵詞",
    model: "Stanza English radiology NER package；processors 使用 tokenize=default、ner=radiology，再和程式內 KEYWORDS 聯集。",
    weights: "初始化呼叫 stanza.download('en', package='radiology', processors={'ner':'radiology'}) 下載 NER 權重。沒有 learned score weights；集合交集直接算 P/R/F1。",
    prompt: "不適用：沒有自然語言 prompt。時間／變化詞由固定 KEYWORDS（new、stable、worsening、resolved…）與 NER 找出。",
    fixed: "兩側都沒有 temporal entities 時回 1.0；reference 空、candidate 非空時回 epsilon=1e−10。這個 1.0 表示『都未提』，不等於抓到時間資訊。",
    install: "pip install radeval",
    sampleRef: "The left pleural effusion is stable.",
    sampleHyp: "There is a new left pleural effusion.",
    metricConfig: "[\"temporal\"]",
    sources: [["adapter", "radeval/metrics/f1temporal/adapter.py"], ["關鍵詞與 F1", "radeval/metrics/f1temporal/f1temporal.py"]]
  },
  "green": {
    llm: true,
    verdict: "是 LLM｜本機 Hugging Face causal LM",
    model: "adapter 固定 StanfordAIMI/GREEN-radllama2-7b；AutoModelForCausalLM，CUDA 用 float16、CPU 用 float32，最多自動分到 8 張 GPU。",
    weights: "首次執行下載完整 7B checkpoint。batch_size=8、max_length=2048、do_sample=False；不是 API 模型。計分常數沒有另訓練，程式由輸出計數 M/(M+ΣE_sig)。",
    prompt: "實際 user prompt 由 make_prompt() 產生：先將 reference 與 candidate 各截到 300 words，要求列出 6 類 clinically significant errors、同樣 6 類 insignificant errors、matched findings，並嚴格使用 [Explanation]／[Clinically Significant Errors]／[Clinically Insignificant Errors]／[Matched Findings] 區段。chat template 使用 <|user|> 與 <|assistant|>。",
    fixed: "RadEval 的 GreenMetric 不接受 model_name／cpu／num_gpus 設定；要保持套件公開流程就使用固定 7B 模型。CPU 可跑但會非常慢且佔大量 RAM。",
    install: "pip install radeval",
    sampleRef: "Mild pulmonary edema.",
    sampleHyp: "Severe pulmonary edema.",
    metricConfig: "[\"green\"]",
    sources: [["adapter", "radeval/metrics/green_score/adapter.py"], ["推論設定", "radeval/metrics/green_score/green.py"], ["完整 prompt", "radeval/metrics/green_score/utils.py"], ["checkpoint", "https://huggingface.co/StanfordAIMI/GREEN-radllama2-7b"]]
  },
  "mammo-green": {
    llm: true,
    verdict: "是 LLM｜OpenAI 或 Gemini API judge",
    model: "RadEval adapter 預設 model_name=\"gpt-4o-mini\"，名稱以 gemini 開頭時自動切 Gemini provider；可改 gpt-4o、gpt-5.x、gemini-2.5-*。",
    weights: "沒有下載本地 checkpoint，也沒有 learned scalar weights。temperature=0.0、max_output_tokens=8192、max_concurrent=50；分數固定為 M/(M+六類 significant errors)。",
    prompt: "System prompt 指定乳攝專科規則、BI-RADS、density、laterality/location、multiplicity、recommendation 與禁止 prior-comparison 等判準，並要求只回固定 JSON。實際 user message 完整格式是：REFERENCE_REPORT:\\n{ref}\\n\\nGENERATED_REPORT:\\n{hyp}。六個 error keys 為 false_finding、missing_finding、mischaracterization、wrong_location_laterality、incorrect_birads、incorrect_breast_density。",
    fixed: "需 pip install \"radeval[api]\"。OpenAI 用 OPENAI_API_KEY；Gemini 用 GEMINI_API_KEY 或 GOOGLE_API_KEY。adapter 只暴露 model_name 與 max_concurrent，provider 由 model 名稱判斷。",
    install: "pip install \"radeval[api]\"",
    sampleRef: "Scattered density. Benign calcifications. BI-RADS 2.",
    sampleHyp: "Heterogeneously dense breasts. Suspicious calcifications. BI-RADS 4.",
    metricConfig: "{\"mammo_green\": {\"model_name\": \"gpt-4o-mini\", \"max_concurrent\": 10}}",
    constructorArgs: ["openai_api_key=os.environ[\"OPENAI_API_KEY\"]"],
    sources: [["adapter", "radeval/metrics/green_score/adapter.py"], ["完整 system prompt", "radeval/metrics/green_score/mammo_green.py"]]
  },
  "crimson": {
    llm: true,
    verdict: "是 LLM｜預設本機 MedGemma；可切 OpenAI",
    model: "預設 provider=\"hf\"、checkpoint=rajpurkarlab/medgemma-4b-it-crimson；若 provider=\"openai\" 且未指定 model，預設 gpt-5.2。",
    weights: "HF：bfloat16、device_map=auto、可用時 Flash Attention 2、do_sample=False、上限 8192 new tokens。計分權重：urgent=1、actionable_not_urgent=0.5、not_actionable_not_urgent=0.25、benign_expected=0；significant attribute=0.5、negligible=0。",
    prompt: "System message 精確為『You are an expert radiology evaluator that assesses the accuracy of radiology reports.』User prompt 分兩步：抽取兩側所有 positive findings 並標 clinical_significance／ID；再配對並輸出 false、missing、attribute errors 的 JSON。預設 MedGemma 是已針對不含長 guidelines 的版本訓練，因此程式會自動 include_guidelines=False；OpenAI 路徑會包含完整 guidelines。",
    fixed: "HF 不需 API key；OpenAI 需 radeval[api] 與 OPENAI_API_KEY。OpenAI 固定 temperature=0、seed=42、response_format=json_object。公開 adapter 可設定 provider、model_name、batch_size、max_concurrent、cache_dir。",
    install: "pip install radeval  # 預設 HF；OpenAI 路徑改裝 radeval[api]",
    sampleRef: "Mild pulmonary edema.",
    sampleHyp: "Severe pulmonary edema.",
    metricConfig: "{\"crimson\": {\"provider\": \"hf\"}}",
    sources: [["adapter", "radeval/metrics/crimson/adapter.py"], ["模型／解碼／權重", "radeval/metrics/crimson/crimson.py"], ["完整 prompt 組件", "radeval/metrics/crimson/prompt_parts.py"], ["預設 checkpoint", "https://huggingface.co/rajpurkarlab/medgemma-4b-it-crimson"]]
  },
  "radfact-ct": {
    llm: true,
    verdict: "是 LLM｜OpenAI API 多階段 judge",
    model: "僅支援 OpenAI provider；RadEval adapter 預設 model_name=\"gpt-4o-mini\"。不是本地 NLI checkpoint。",
    weights: "不下載本地權重，也沒有 learned regression coefficient。固定 temperature=0.0、filter_negatives=False、max_concurrent=50；計分是 entailment 計數的 P/R/F1。",
    prompt: "不是一個 prompt，而是 2～3 段 few-shot pipeline：① report_to_phrases_system.txt 把 CT 報告拆 atomic phrases；② filter_negatives=True 時用 negative_filtering_system.txt 移除 negative/normal phrases；③ nli_system.txt 對每個 hypothesis 做雙向 entailment。每段都插入套件附帶的 *_examples.json few-shot 對話，並要求 JSON 或 YAML 結構化輸出。",
    fixed: "需 pip install \"radeval[api]\" 與 OPENAI_API_KEY。RadFact +/- 是 filter_negatives=False；RadFact+ 才是 True。aggregate 輸出 0～100，per_sample 輸出 0～1，使用時要先統一尺度。",
    install: "pip install \"radeval[api]\"",
    sampleRef: "Acute appendicitis. No abscess.",
    sampleHyp: "Acute appendicitis with an abscess.",
    metricConfig: "{\"radfact_ct\": {\"model_name\": \"gpt-4o-mini\", \"filter_negatives\": False, \"max_concurrent\": 10}}",
    constructorArgs: ["openai_api_key=os.environ[\"OPENAI_API_KEY\"]"],
    sources: [["adapter", "radeval/metrics/radfact_ct/adapter.py"], ["pipeline", "radeval/metrics/radfact_ct/radfact_ct.py"], ["拆句 prompt", "radeval/metrics/radfact_ct/prompts/ct/report_to_phrases_system.txt"], ["NLI prompt", "radeval/metrics/radfact_ct/prompts/ct/nli_system.txt"], ["負句 prompt", "radeval/metrics/radfact_ct/prompts/ct/negative_filtering_system.txt"]]
  }
};

function pythonUsage(note) {
  const lines = [];
  if (note.constructorArgs) lines.push("import os");
  lines.push("from radeval import RadEval", "");
  lines.push(`refs = [${JSON.stringify(note.sampleRef)}]`);
  lines.push(`hyps = [${JSON.stringify(note.sampleHyp)}]`, "");
  lines.push("evaluator = RadEval(");
  lines.push(`    metrics=${note.metricConfig},`);
  (note.constructorArgs || []).forEach((arg) => lines.push(`    ${arg},`));
  lines.push("    per_sample=False,", "    detailed=True,", ")");
  lines.push("scores = evaluator(refs=refs, hyps=hyps)", "print(scores)");
  return lines.join("\n");
}

function escapeHtml(value) {
  return String(value).replace(/[&<>\"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;",
    "\"": "&quot;", "'": "&#039;"
  })[char]);
}

function renderRuntimeSheet(note, sourceRoot) {
  const code = pythonUsage(note);
  const sources = note.sources.map(([label, target]) => {
    const url = target.startsWith("http") ? target : `${sourceRoot}${target}`;
    return `<a href="${url}" target="_blank" rel="noreferrer">${label} ↗</a>`;
  }).join("");
  return `
    <div class="runtime-verdict">
      <span class="runtime-badge ${note.llm ? "llm" : "non-llm"}">${note.llm ? "LLM" : "非 LLM"}</span>
      <strong>${note.verdict}</strong>
    </div>
    <div class="runtime-grid">
      <section class="runtime-fact"><h4>實際模型／演算法</h4><p>${note.model}</p></section>
      <section class="runtime-fact"><h4>模型權重＋計分權重</h4><p>${note.weights}</p></section>
      <section class="runtime-fact"><h4>執行時固定設定</h4><p>${note.fixed}</p></section>
      <section class="runtime-fact"><h4>安裝指令</h4><p><code>${escapeHtml(note.install)}</code></p></section>
    </div>
    <details class="prompt-details" ${note.llm ? "open" : ""}>
      <summary>${note.llm ? "實際 Prompt／訊息格式" : "為什麼沒有 Prompt"}</summary>
      <pre>${escapeHtml(note.prompt)}</pre>
    </details>
    <div class="code-panel">
      <div class="code-head"><strong>最小可執行 Python</strong><button class="copy-code" type="button" data-copy-code aria-live="polite">複製程式</button></div>
      <pre><code>${escapeHtml(code)}</code></pre>
    </div>
    <div class="runtime-sources">${sources}</div>`;
}


function renderExecutionPrimer() {
  return "<div>\n            <h3>先分清楚兩種「權重」</h3>\n            <p><strong>模型權重</strong>是 Hugging Face／Stanza 下載的 checkpoint；<strong>計分權重</strong>是 threshold、回歸係數或臨床嚴重度常數。兩版的每個指標都會分開寫。一般指標只需基本套件；OpenAI／Gemini 裁判要安裝 API extra 並提供金鑰。RadEval 2.2.2 要求 Python ≥ 3.11。</p>\n          </div>\n          <div class=\"install-lines\">\n            <div class=\"install-line\"><code>pip install radeval</code></div>\n            <div class=\"install-line\"><code>pip install \"radeval[api]\"</code> <small>（LLM API 指標）</small></div>\n          </div>";
}

function bindRuntimeCopy(container) {
  container.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-copy-code]");
    if (!button || !container.contains(button)) return;
    const code = button.closest(".code-panel").querySelector("code").textContent;
    try {
      await navigator.clipboard.writeText(code);
      button.textContent = "已複製 ✓";
      window.setTimeout(() => { button.textContent = "複製程式"; }, 1400);
    } catch (error) {
      button.textContent = "請手動選取";
    }
  });
}
