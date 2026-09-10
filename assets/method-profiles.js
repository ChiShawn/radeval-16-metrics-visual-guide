// Shared method passports for the cartoon and technical editions.
const metricMethodProfiles = {
  "bleu": {
    "key": "bleu",
    "adapter": "BleuMetric",
    "method": "COCO-style BLEU-4",
    "methodDetail": "連續 1～4-gram 修正精確率的等權幾何平均，再乘 brevity penalty。",
    "kind": "規則式字面指標",
    "models": [
      "BleuScorer(n=4)｜無神經模型"
    ],
    "llms": [],
    "flow": [
      "原文字串只以空白切 token",
      "累計並截頂 1～4-gram 命中",
      "以 corpus 統計算 BLEU-4"
    ],
    "outputs": "bleu；detailed 另有 bleu_1 / bleu_2 / bleu_3",
    "source": "radeval/metrics/bleu/adapter.py"
  },
  "rouge": {
    "key": "rouge",
    "adapter": "RougeMetric",
    "method": "ROUGE-1 / ROUGE-2 / ROUGE-L F1",
    "methodDetail": "用 unigram、bigram 與 longest common subsequence 的 precision/recall 合成 F-measure。",
    "kind": "規則式字面指標",
    "models": [
      "google rouge_score.RougeScorer｜Porter stemmer"
    ],
    "llms": [],
    "flow": [
      "上游 tokenizer 小寫、處理標點並 stemming",
      "分別計算 ROUGE-1／2／L",
      "逐筆取 F1 後做算術平均"
    ],
    "outputs": "rouge1 / rouge2 / rougeL",
    "source": "radeval/metrics/rouge/adapter.py"
  },
  "bertscore": {
    "key": "bertscore",
    "adapter": "BertScoreMetric",
    "method": "BERTScore token alignment F1",
    "methodDetail": "以 contextual token embedding 的最大 cosine 配對，計算 P/R/F1 並做 baseline rescaling。",
    "kind": "Transformer encoder 相似度",
    "models": [
      "distilbert-base-uncased｜layer 5",
      "套件內附英文 baseline TSV"
    ],
    "llms": [],
    "flow": [
      "DistilBERT 將兩側文字編碼成 token 向量",
      "每個 token 尋找另一側最大 cosine",
      "平均 P/R/F1 並做 baseline rescaling"
    ],
    "outputs": "bertscore",
    "source": "radeval/metrics/bertscore/adapter.py"
  },
  "radeval-bertscore": {
    "key": "radeval_bertscore",
    "adapter": "RadEvalBertScoreMetric",
    "method": "Radiology-domain BERTScore",
    "methodDetail": "沿用 BERTScore max-cosine 對齊，換成放射領域 ModernBERT，且不做 baseline rescaling。",
    "kind": "放射領域 Transformer encoder",
    "models": [
      "IAMJB/RadEvalModernBERT｜layer 22"
    ],
    "llms": [],
    "flow": [
      "領域 tokenizer 編碼兩側報告",
      "以第 22 層做 token max-cosine 對齊",
      "輸出每筆 F1，再做平均"
    ],
    "outputs": "radeval_bertscore",
    "source": "radeval/metrics/radevalbertscore/adapter.py"
  },
  "f1chexbert": {
    "key": "f1chexbert",
    "adapter": "F1CheXbertMetric",
    "method": "CheXbert label agreement / F1",
    "methodDetail": "先預測 14 個 CheXpert conditions，依 rrg 規則二值化，再計 corpus F1 或逐筆標籤一致比例。",
    "kind": "BERT 多標籤分類器",
    "models": [
      "bert-base-uncased backbone",
      "StanfordAIMI/RRG_scorers｜chexbert.pth"
    ],
    "llms": [],
    "flow": [
      "兩側各自預測 14 個四態標籤",
      "positive＋uncertain 合併為 1",
      "計 5 類／14 類 micro、macro、weighted F1"
    ],
    "outputs": "6 個 aggregate F1 keys；per_sample 為 f1chexbert_sample_acc_5 / f1chexbert_sample_acc_all",
    "source": "radeval/metrics/f1chexbert/adapter.py"
  },
  "f1radbert-ct": {
    "key": "f1radbert_ct",
    "adapter": "F1RadbertCTMetric",
    "method": "RadBERT-CT multi-label agreement",
    "methodDetail": "將兩份 CT 報告各自分類成 18 findings，門檻化後衍生 No finding，再比較 19 欄。",
    "kind": "CT Transformer 多標籤分類器",
    "models": [
      "IAMJB/RadBERT-CT"
    ],
    "llms": [],
    "flow": [
      "兩側分別輸出 18 個 sigmoid 機率",
      "以嚴格 >0.5 門檻化並衍生 No finding",
      "計 accuracy 與 micro／macro／weighted F1"
    ],
    "outputs": "f1radbert_ct_accuracy / micro_f1 / macro_f1 / weighted_f1；per_sample 為 f1radbert_ct_sample_acc",
    "source": "radeval/metrics/f1Radbert_ct/adapter.py"
  },
  "radgraph": {
    "key": "radgraph",
    "adapter": "RadGraphMetric",
    "method": "F1RadGraph three-level reward",
    "methodDetail": "先抽取放射實體、狀態與關係圖，再用 simple／partial／complete 三種規則比較。",
    "kind": "實體／關係抽取模型",
    "models": [
      "RadGraph 0.1.18 core",
      "StanfordAIMI/RRG_scorers｜radgraph-xl.tar.gz"
    ],
    "llms": [],
    "flow": [
      "radgraph-xl 對兩側產生 graph",
      "按三種 reward level 比對 entity／relation",
      "逐筆 reward 分別做平均"
    ],
    "outputs": "radgraph_simple / radgraph_partial / radgraph_complete",
    "source": "radeval/metrics/_radgraph_adapter.py"
  },
  "ratescore": {
    "key": "ratescore",
    "adapter": "RaTEScoreMetric",
    "method": "RaTEScore entity-aware alignment",
    "methodDetail": "NER 先圈醫療實體，再用 BioLORD embedding、實體型別 affinity 與雙向最佳配對計分。",
    "kind": "NER＋醫療語意 encoder",
    "models": [
      "Angelakeke/RaTE-NER-Deberta",
      "FremyCompany/BioLORD-2023-C",
      "內附 affinity_matrix=long"
    ],
    "llms": [],
    "flow": [
      "DeBERTa NER 抽取兩側醫療實體與型別",
      "BioLORD 建立每個實體向量",
      "雙向 top-1 cosine 加型別權重後合成分數"
    ],
    "outputs": "ratescore",
    "source": "radeval/metrics/RaTEScore/adapter.py"
  },
  "radgraph-radcliq": {
    "key": "radgraph_radcliq",
    "adapter": "RadGraphRadCliQMetric",
    "method": "RadCliQ-compatible graph F1",
    "methodDetail": "用原版 RadGraph 抽取 graph，分別計 entity-set F1 與 relation-set F1，再各半平均。",
    "kind": "RadGraph 結構相似度",
    "models": [
      "StanfordAIMI/RRG_scorers｜radgraph.tar.gz（original）"
    ],
    "llms": [],
    "flow": [
      "原版 radgraph 分別抽取兩側 graph",
      "各算 entity F1 與 relation F1",
      "兩個 F1 以 0.5 / 0.5 平均"
    ],
    "outputs": "radgraph_radcliq",
    "source": "radeval/metrics/radgraph_radcliq/adapter.py"
  },
  "radcliq": {
    "key": "radcliq",
    "adapter": "RadCliQMetric",
    "method": "RadCliQ-v1 learned composite",
    "methodDetail": "將四個子指標標準化後輸入固定線性迴歸；逐筆 raw 與 aggregate 倒數方向不同。",
    "kind": "多模型線性組合",
    "models": [
      "RadGraph original",
      "distilroberta-base BERTScore",
      "CheXbert report embedding",
      "BLEU-2",
      "固定 μ／σ／linear coefficients"
    ],
    "llms": [],
    "flow": [
      "計 RadGraph、BERTScore-IDF、SEmb、BLEU-2",
      "依訓練統計 μ／σ 標準化",
      "線性組合得 raw；aggregate=1/mean(raw)"
    ],
    "outputs": "radcliq_v1",
    "source": "radeval/metrics/RadCliQv1/adapter.py"
  },
  "srrbert": {
    "key": "srrbert",
    "adapter": "SRRBertMetric",
    "method": "SRR-BERT sentence-to-report labels",
    "methodDetail": "逐句預測 finding＋status 多標籤，再以 OR 合併成 163 維報告向量後比較。",
    "kind": "句子級 BERT 多標籤分類器",
    "models": [
      "StanfordAIMI/SRR-BERT-Leaves-with-Statuses",
      "microsoft/BiomedVLP-CXR-BERT-general tokenizer"
    ],
    "llms": [],
    "flow": [
      "NLTK punkt_tab 將報告切句",
      "每句預測 163 個 finding/status 開關",
      "逐欄 OR 成報告向量並計 P/R/F1"
    ],
    "outputs": "srrbert_weighted_f1 / weighted_precision / weighted_recall；detailed 加 label_scores",
    "source": "radeval/metrics/SRRBert/adapter.py"
  },
  "temporal": {
    "key": "temporal",
    "adapter": "TemporalF1Metric",
    "method": "Temporal keyword-set F1",
    "methodDetail": "以 Stanza radiology NER 與固定 temporal keyword regex 找變化詞，再對集合算 F1。",
    "kind": "NER＋規則集合指標",
    "models": [
      "Stanza English radiology NER package",
      "程式內 KEYWORDS"
    ],
    "llms": [],
    "flow": [
      "清理文字並跑 Stanza NER",
      "與固定 new／stable／worsening 等 keyword 聯集",
      "對兩側 temporal sets 計逐筆 F1 再平均"
    ],
    "outputs": "temporal_f1",
    "source": "radeval/metrics/f1temporal/adapter.py"
  },
  "green": {
    "key": "green",
    "adapter": "GreenMetric",
    "method": "GREEN error-count reward",
    "methodDetail": "本地生成式模型先依六類臨床錯誤產生分析，再由程式解析 M 與重大錯誤數計分。",
    "kind": "本地生成式 LLM judge",
    "models": [
      "AutoModelForCausalLM"
    ],
    "llms": [
      "StanfordAIMI/GREEN-radllama2-7b"
    ],
    "flow": [
      "把 reference／candidate 填進固定評審格式",
      "LLM 輸出 explanation、六類錯誤與 matched findings",
      "parser 計算 M / (M + ΣE_sig)"
    ],
    "outputs": "green；detailed 加 green_std",
    "source": "radeval/metrics/green_score/adapter.py"
  },
  "mammo-green": {
    "key": "mammo_green",
    "adapter": "MammoGreenMetric",
    "method": "MammoGREEN structured error-count judge",
    "methodDetail": "API LLM 依乳攝專用六類錯誤輸出 JSON，再由程式驗證 schema 並計 M/(M+E)。",
    "kind": "外部 API LLM judge",
    "models": [
      "供應商託管模型｜不下載 checkpoint"
    ],
    "llms": [
      "OpenAI gpt-4o-mini（RadEval adapter 預設）",
      "或名稱以 gemini 開頭的 Gemini 模型"
    ],
    "flow": [
      "送出乳攝 reference／candidate 與專用 system prompt",
      "LLM 回傳固定 JSON 錯誤分類",
      "Pydantic 驗證後由程式計分"
    ],
    "outputs": "mammo_green；detailed 加 mammo_green_std",
    "source": "radeval/metrics/green_score/adapter.py"
  },
  "crimson": {
    "key": "crimson",
    "adapter": "CrimsonMetric",
    "method": "CRIMSON severity-weighted finding score",
    "methodDetail": "LLM 抽取、配對 findings 並判 clinical significance；純程式再依嚴重度與屬性權重計分。",
    "kind": "本地或 API LLM judge＋加權公式",
    "models": [
      "HF 本地預設或 OpenAI API"
    ],
    "llms": [
      "rajpurkarlab/medgemma-4b-it-crimson（預設）",
      "OpenAI gpt-5.2（provider=openai 且未指定 model）"
    ],
    "flow": [
      "LLM 抽 positive findings、ID、配對與錯誤 JSON",
      "依 urgent／actionable／benign 與 attribute 類型加權",
      "程式計算 (−1, 1] 的 CRIMSON"
    ],
    "outputs": "crimson；detailed 加 crimson_std",
    "source": "radeval/metrics/crimson/adapter.py"
  },
  "radfact-ct": {
    "key": "radfact_ct",
    "adapter": "RadFactCTMetric",
    "method": "RadFact-CT bidirectional atomic entailment",
    "methodDetail": "API LLM 先拆 CT atomic phrases，再讓每個 candidate/reference phrase 做雙向 entailment。",
    "kind": "多階段外部 API LLM judge",
    "models": [
      "OpenAI API｜不下載本地 checkpoint"
    ],
    "llms": [
      "OpenAI gpt-4o-mini（RadEval adapter 預設）"
    ],
    "flow": [
      "LLM 將兩側 CT 報告拆成 atomic phrases",
      "Candidate→Reference 判 entailment 得 precision",
      "Reference→Candidate 判 entailment 得 recall，再算 F1"
    ],
    "outputs": "radfact_ct_precision / radfact_ct_recall / radfact_ct_f1",
    "source": "radeval/metrics/radfact_ct/adapter.py"
  }
};

function methodEscape(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;",
    '"': "&quot;", "'": "&#039;"
  })[character]);
}

function methodModelLabel(profile) {
  const names = profile.llms.length ? profile.llms : profile.models;
  if (names.length <= 2) {
    return names.join(" · ");
  }
  return `${names.slice(0, 2).join(" · ")} · +${names.length - 2}`;
}

function renderMethodPassport(id, sourceRoot) {
  const profile = metricMethodProfiles[id];
  if (!profile) {
    return '<p class="boundary-status">這個指標尚未建立 Method 護照。</p>';
  }
  const modelItems = profile.models.map((name) =>
    `<li>${methodEscape(name)}</li>`).join("");
  const llmContent = profile.llms.length
    ? `<ul>${profile.llms.map((name) =>
        `<li>${methodEscape(name)}</li>`).join("")}</ul>`
    : "<p>不適用：不是生成式 LLM，不使用自然語言 Prompt。</p>";
  return `<section class="method-passport" aria-label="${methodEscape(profile.method)} Method 護照">
    <div class="method-passport-head">
      <div><small>RADEVAL METHOD</small><h3>${methodEscape(profile.method)}</h3><p>${methodEscape(profile.methodDetail)}</p></div>
      <span class="method-kind">${methodEscape(profile.kind)}</span>
    </div>
    <div class="method-identifiers">
      <div><small>RadEval key</small><code>${methodEscape(profile.key)}</code></div>
      <div><small>Adapter class</small><code>${methodEscape(profile.adapter)}</code></div>
    </div>
    <ol class="method-flow">${profile.flow.map((step, index) =>
      `<li><span>${index + 1}</span>${methodEscape(step)}</li>`).join("")}</ol>
    <div class="method-model-grid">
      <section><h4>使用的模型／規則</h4><ul>${modelItems}</ul></section>
      <section><h4>LLM 名稱</h4>${llmContent}</section>
    </div>
    <div class="method-output"><strong>實際輸出：</strong><code>${methodEscape(profile.outputs)}</code></div>
    <a class="method-source" href="${sourceRoot}${profile.source}" target="_blank" rel="noreferrer">核對 adapter 原始碼 ↗</a>
  </section>`;
}

function renderRadEvalMethodMap(sourceRoot) {
  return `<section class="radeval-method-map" aria-labelledby="radevalMethodTitle">
    <div class="method-map-intro"><p class="eyebrow">RADEVAL ORCHESTRATOR METHOD</p><h3 id="radevalMethodTitle">RadEval 本身不發明第 17 個分數</h3><p>它負責選擇並初始化 adapter、把同一批 refs／hyps 交給指定指標，最後合併各自的輸出。16 種 Method 仍保留各自的分詞、模型、Prompt、尺度與聚合方式。</p></div>
    <ol class="orchestrator-flow">
      <li><span>1</span><strong>選 Method</strong><small>metrics 必須顯式列出；None 不會自動跑全部</small></li>
      <li><span>2</span><strong>查 registry</strong><small>key → adapter class，僅匯入被選中的依賴</small></li>
      <li><span>3</span><strong>依序 compute</strong><small>每個 adapter 仍用自己的 batch／API 並行規則</small></li>
      <li><span>4</span><strong>合併 dict</strong><small>回傳各自的 key；不會自動平均成單一總分</small></li>
    </ol>
    <div class="orchestrator-modes"><code>per_sample=False</code><span>aggregate</span><code>per_sample=True</code><span>逐筆列表；通常優先於 detailed</span><code>detailed=True</code><span>部分指標增加 breakdown</span></div>
    <a class="method-source" href="${sourceRoot}radeval/radeval.py" target="_blank" rel="noreferrer">核對 RadEval orchestrator 原始碼 ↗</a>
  </section>`;
}
