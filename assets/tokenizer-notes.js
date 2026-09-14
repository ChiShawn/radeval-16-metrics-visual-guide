// Tokenizer roles audited against RadEval d412dc2. No model is run by this page.
const tokenizerNotes = {
  bleu: {
    name: "Python str.split()：空白切詞，沒有模型 tokenizer",
    role: "切出的片段就是計分單位。1～4-gram、命中次數與長度懲罰都用這份 token 清單。",
    flow: ["原始報告", "按空白切開", "直接數 n-gram"],
    example: "確定結果：No effusion. → [No] [effusion.]；No effusion → [No] [effusion]。句點黏在詞上，因此後一個 token 不相同。",
    detail: "不自動小寫、不移除 a／the／no、不做 stemming。連續空白會合併成切分邊界；一個英文詞不一定等於其他模型的一個 token。",
    source: "radeval/metrics/bleu/bleu_scorer.py"
  },
  rouge: {
    name: "rouge_score 的預設 DefaultTokenizer＋Porter stemming",
    role: "先把文字正規化成用於字面比對的 token，再算 unigram、bigram 與最長共同子序列的 P/R/F1。",
    flow: ["報告小寫、處理非英數符號", "切詞並做 stemming", "數重疊後算 F1"],
    example: "預設規則下：No effusion. 與 no effusion 的標點／大小寫差異會被消除；The effusion 的 the 仍是 token。",
    detail: "adapter 設 use_stemmer=True；不是刪除 stopwords。英文 [a-z0-9] 導向的預設處理不適合直接評中文。Stemming 是詞幹規則，不代表理解同義詞或否定。tokenizer 來自外部 rouge_score 套件，重現時也要固定其版本。",
    source: "radeval/metrics/rouge/adapter.py"
  },
  bertscore: {
    name: "distilbert-base-uncased 對應 tokenizer（WordPiece）",
    role: "把報告轉成子詞 ID，供 DistilBERT 產生上下文向量；這些子詞的向量又是雙向最佳配對的計分單位。",
    flow: ["報告 → 子詞 ID", "第 5 層 token 向量", "max-cosine 配對 → F1"],
    example: "No effusion 與 Effusion：no 會進入模型，但不會自動觸發『臨床相反必須零分』。effusion 是否拆成多個子詞，應以實際 tokenizer 輸出確認。",
    detail: "uncased tokenizer 會做小寫等正規化；a／the 與標點並非一律刪除。BERTScore 排除特殊邊界 token 的計分權重並遮罩 padding；輸入依 tokenizer.model_max_length 截斷。idf=False 不會自動降低常見詞權重。",
    source: "radeval/metrics/bertscore/_vendor/utils.py"
  },
  "radeval-bertscore": {
    name: "AutoTokenizer：IAMJB/RadEvalModernBERT，use_fast_tokenizer=True",
    role: "使用領域 checkpoint 的詞彙表與切分設定，把報告送進 ModernBERT；切出的 token 向量在第 22 層做 BERTScore 配對。",
    flow: ["領域 tokenizer → IDs", "ModernBERT 第 22 層", "token 相似度 → F1"],
    example: "cardiomegaly 與 enlarged cardiac silhouette：先各自切成模型 token，語意相近與否由 encoder 向量決定；tokenizer 本身不把兩句翻譯成同一疾病。",
    detail: "AutoTokenizer 是載入器名稱，不能據此猜它用 WordPiece 或 BPE。精確子詞、大小寫正規化與上限要讀該 checkpoint 的 tokenizer 設定；fast 表示實作路徑，不代表醫療理解更好。仍有 model_max_length 截斷。",
    source: "radeval/metrics/radevalbertscore/adapter.py"
  },
  f1chexbert: {
    name: "BertTokenizer：bert-base-uncased（WordPiece）",
    role: "替疾病分類器準備 input_ids 與 attention_mask。真正拿來比較的是 14／5 個疾病標籤，不是兩份報告的 token 命中率。",
    flow: ["報告 → BERT 子詞", "CheXbert 分類、二值化", "比較疾病標籤"],
    example: "No pulmonary edema：no 會保留供模型判斷陰性，但是否判對是分類器的責任。a／the 可能影響上下文，卻不各自占一格疾病分數。",
    detail: "uncased 正規化；padding=True、truncation=True、max_length=512（模型 token，包含特殊 token）。報告尾端若被截斷，模型看不到尾端 finding；不是『512 個英文單字』。",
    source: "radeval/metrics/_chexbert_base.py"
  },
  "f1radbert-ct": {
    name: "AutoTokenizer：IAMJB/RadBERT-CT",
    role: "將 CT 報告編成模型輸入；分類器產生 18 個機率，衍生 No finding 後比較 19 欄。token 數不是 finding 數。",
    flow: ["CT 報告 → IDs", "18 個分類機率 → 19 欄", "標籤一致性／F1"],
    example: "Pleural effusion and atelectasis 即使被切成很多子詞，最後仍可能對應 effusion、atelectasis 兩個陽性 finding。",
    detail: "使用 checkpoint 配套詞彙表；不應任意換成 GPT tokenizer。程式固定 padding=True、truncation=True、max_length=512；a／the、no 和標點先經 tokenizer，不由 F1 公式逐字判分。大小寫細節取決於 checkpoint 設定。",
    source: "radeval/metrics/f1Radbert_ct/f1Radbert_ct.py"
  },
  radgraph: {
    name: "兩層：RadGraph-XL 的 NLTK wordpunct_tokenize＋模型 archive 的 Transformer token indexer",
    role: "第一層建立報告詞／標點的位置，供實體 span 定位；第二層把這些詞編成模型子詞。模型抽完後，reward 比較實體文字、標籤與關係。",
    flow: ["詞／標點與位置索引", "子詞編碼 → 抽實體／關係", "graph tuples → reward"],
    example: "Small left effusion. 的句點可成為獨立位置；模型若將 small 抽成修飾實體，它才會出現在對應 graph reward 中，不是每個標點都直接加減分。",
    detail: "XL 先做專屬文字正規化，再做 wordpunct 切分；不要用 BLEU 的空白 token 假冒 graph 的 token。底層 tokenizer 由下載 archive 的 config 決定，adapter 名稱本身不足以證明完整 backbone／詞彙表版本。",
    source: "radeval/metrics/radgraph/_vendor/utils.py"
  },
  ratescore: {
    name: "三段：medspaCy 切句；RaTE-NER-Deberta tokenizer；BioLORD-2023-C tokenizer",
    role: "切句決定 NER 的輸入段落；第一套模型 tokenizer 協助標記並還原醫療實體；第二套把抽到的每個實體編成 BioLORD 向量供配對。",
    flow: ["切句 → DeBERTa 子詞標記", "還原 entity 字串", "BioLORD 編碼 entity → 配對"],
    example: "The heart is enlarged.：先找出模型認定的實體，再把實體送進第二套 tokenizer。兩次 tokenize 的對象不同，一次是句子，一次是實體。",
    detail: "第一套 AutoTokenizer 來自 Angelakeke/RaTE-NER-Deberta，NER max_length=512；第二套來自 FremyCompany/BioLORD-2023-C，entity max_length=30。兩處都會截斷。a／the 不會各自算重疊分，但可能影響 NER；不得將 NER 子詞直接當最終 entity。",
    source: "radeval/metrics/RaTEScore/score.py"
  },
  "radgraph-radcliq": {
    name: "原版 RadGraph 的 regex／空白切分＋archive 配套 Transformer token indexer",
    role: "前處理建立實體 span 的詞序位置，模型子詞負責抽圖；最終分別比較 entity set 和 relation set，兩個 F1 各半平均。",
    flow: ["原版 RadGraph 前處理", "模型子詞 → graph", "entity F1＋relation F1"],
    example: "small 漏掉後，是否少一個 entity 或一條 relation，取決於抽出的圖；不能用『少一個 tokenizer token』直接推導扣分。",
    detail: "原版以 regex 隔開指定標點後 split()；不等同 XL 的 wordpunct 流程。重現 RadCliQ 相容結果時，前處理、archive 與 reward 都要一起固定。",
    source: "radeval/metrics/radgraph/_vendor/utils.py"
  },
  radcliq: {
    name: "四路：RadGraph 原版；distilroberta-base tokenizer；CheXbert BertTokenizer；BLEU str.split()",
    role: "沒有一套共用 tokenizer。四條支線各自從原始文字產生 graph 分數、BERTScore、報告 embedding cosine 與 BLEU-2，再由線性模型合成。",
    flow: ["同一份報告分四路", "各自 tokenize／計子分數", "標準化＋固定線性組合"],
    example: "effusion. 在 BLEU 支線是黏著句點的一塊；RoBERTa 支線用 byte-level BPE；CheXbert 用 WordPiece。四路 token 數可以不同。",
    detail: "RadGraph 有詞位置與模型子詞兩層；RoBERTa 有 add_prefix_space 的處理且 BERTScore 使用 IDF；CheXbert 以 512 token 上限取報告向量；BLEU 只按空白。不能先用 GPT tokenizer 統一切好再送入四路，這會改變原方法。",
    source: "radeval/metrics/RadCliQv1/radcliq.py"
  },
  srrbert: {
    name: "兩層：NLTK sent_tokenize（punkt_tab）＋BertTokenizer（BiomedVLP-CXR-BERT-general）",
    role: "第一層切成句子，決定每次分類的單位；第二層把一句轉成 BERT 子詞 ID。逐句的 163 個標籤最後以 OR 合併。",
    flow: ["報告 → 句子", "每句 → 子詞 → 163 標籤", "OR 合併報告標籤"],
    example: "No edema. Stable cardiomegaly. 通常先分成兩句，各自分類後 OR。句點在這裡可能改變分句邊界，不能視為一定無關。",
    detail: "NLTK 句子不是 BERT token。每句 add_special_tokens=True、padding=True、truncation=True、max_length=512；截斷是逐句發生。縮寫與異常標點會影響分句；a／the／no 仍交給分類器，F1 比的是標籤。",
    source: "radeval/metrics/SRRBert/srr_bert.py"
  },
  temporal: {
    name: "Stanza tokenize=default＋radiology NER；另有 temporal keyword regex",
    role: "Stanza tokenizer 建立詞與句子邊界供 NER 找時間實體；regex 另外從清理後文字找關鍵詞。合併後比的是時間詞集合。",
    flow: ["清理文字 → Stanza tokenize／NER", "聯集 regex 時間詞", "集合 F1"],
    example: "Stable cardiomegaly. vs New cardiomegaly.：目標是 stable／new 的時間集合，並非所有詞和句點的 token 重疊。",
    detail: "Stanza 的 tokenize 是 NLP 前處理；不要套用 GPT 子詞數來解讀。a／the 不會自動成為 temporal 計分項。否定與時間詞的組合仍可能被 keyword 規則誤判，tokenizer 不負責推理。",
    source: "radeval/metrics/f1temporal/f1temporal.py"
  },
  green: {
    name: "AutoTokenizer：StanfordAIMI/GREEN-radllama2-7b；另有報告空白長度裁切",
    role: "先把評審 Prompt 套上程式指定 chat template，再編碼供 LLM 生成分析；最後 decode 成文字，交給錯誤計數 parser。tokenizer 本身不數臨床錯誤。",
    flow: ["報告／Prompt → chat template → IDs", "LLM 生成 → decode", "解析 M、E → 分數"],
    example: "No effusion. 連同六類錯誤規則一起進 Prompt。最後分數看 matched findings 與 errors，不是看模型用了幾個 token。",
    detail: "左側 padding、pad_token=eos_token、attention_mask；tokenization 會依 max_length 截斷。程式另有 split() 的報告長度裁切，那是空白片段數，與 LLM token 數不同。此生成路徑使用 max_length，要留意輸入與生成空間。",
    source: "radeval/metrics/green_score/green.py"
  },
  "mammo-green": {
    name: "API 服務端的模型 tokenizer；RadEval 不在本機載入 GPT／Gemini tokenizer",
    role: "服務端把 system Prompt 與兩份報告編碼，產生回答後轉回文字；RadEval 驗證 JSON 並計六類錯誤。API token usage 是用量，不是評分。",
    flow: ["messages → 服務端 tokenizer", "LLM → JSON 文字", "schema 驗證 → M/(M+E)"],
    example: "BI-RADS 2 → BI-RADS 4：數字怎麼切由模型 tokenizer 決定；是否算 BI-RADS 錯誤由 LLM 判讀與 JSON 欄位決定。",
    detail: "原版沒有指定本地 tiktoken 來評分，也沒有先刪除 a／the。換 gpt-oss 地端服務時，應由 server 使用 gpt-oss 的 tokenizer 與 chat template；不能保留另一模型的 token IDs。實際 context 上限與 max_completion_tokens 相容性需核對服務端。",
    source: "radeval/metrics/green_score/mammo_green.py"
  },
  crimson: {
    name: "HF：medgemma-4b-it-crimson pipeline 配套 tokenizer；API：服務端 tokenizer",
    role: "將 finding 抽取／配對 Prompt 編成 LLM 輸入，並還原生成文字。clinical significance、attribute errors 由模型輸出與程式權重處理，不由子詞長度決定。",
    flow: ["Prompt → 配套 tokenizer", "LLM 抽取／配對 JSON", "臨床權重 → CRIMSON"],
    example: "mild → severe：即使兩詞 token 數相同，也可能形成嚴重度錯誤；w=0.5 是臨床權重，不是 tokenizer 的權重。",
    detail: "地端 pipeline 使用 checkpoint 的 tokenizer，程式改成 left padding；API 路徑不在 RadEval 本地 tokenize。換模型要連同 tokenizer／chat template 檢查。8192 new tokens 是生成預算，不等於可輸入 8192 個英文詞。",
    source: "radeval/metrics/crimson/crimson.py"
  },
  "radfact-ct": {
    name: "各次 API 請求使用服務端 tokenizer；單一影像發現敘述拆解是 LLM 任務",
    role: "tokenizer 將各階段 messages 轉成模型輸入；LLM 才負責把報告拆成 atomic phrases，再判每個 phrase 是否受支持。phrase 是計分對象，token 是模型讀取單位。",
    flow: ["tokenize Prompt → LLM 拆事實", "再次 tokenize → 雙向 entailment", "解析 JSON／YAML → P/R/F1"],
    example: "Effusion and atelectasis. 可由 LLM 拆成兩個事實；這不是 tokenizer 切出兩個 token。每個事實本身通常又包含多個模型 token。",
    detail: "拆事實、選用的陰性過濾、NLI 各有 Prompt 與 few-shot 範例；每次請求都重新編碼。JSON／YAML parser 不是 tokenizer。接 gpt-oss 時服務端須正確分開 reasoning 與 final content；格式解析失敗不能當成臨床不支持。公開 Prompt 位於 prompts/ct。",
    source: "radeval/metrics/radfact_ct/radfact_ct.py"
  }
};

function renderTokenizerNote(id, sourceRoot) {
  const note = tokenizerNotes[id];
  if (!note) return "";
  return `<section class="tokenizer-lesson" aria-label="Tokenizer 在這個指標的角色">
    <h4>✂ Tokenizer 在這裡做什麼？</h4>
    <p class="tokenizer-definition">Tokenizer 是把文字切成處理單位的工具；模型 tokenizer 還會將片段轉成詞彙表中的 ID。一個 token 不一定是一個字或英文單字，也不等於一個疾病或單一影像發現敘述。</p>
    <p><strong>使用哪一套：</strong>${methodEscape(note.name)}</p>
    <p><strong>在這個指標的工作：</strong>${methodEscape(note.role)}</p>
    <ol class="method-flow">${note.flow.map((step, i) => `<li><span>${i + 1}</span>${methodEscape(step)}</li>`).join("")}</ol>
    <p class="tokenizer-example"><strong>跟著例子看：</strong>${methodEscape(note.example)}</p>
    <p><strong>實際使用要注意：</strong>${methodEscape(note.detail)}</p>
    <p class="tokenizer-definition">子詞＝詞的一部分；ID＝詞彙表編號；padding＝批次補齊；attention mask＝標記補齊位置；truncation＝超長裁切；chat template＝對話角色格式；decode＝ID 還原文字。切分範例若未標「確定結果」，不代表已實跑該模型。</p>
    <a class="method-source" href="${sourceRoot}${note.source}" target="_blank" rel="noreferrer">核對 tokenizer／前處理原始碼 ↗</a>
  </section>`;
}
