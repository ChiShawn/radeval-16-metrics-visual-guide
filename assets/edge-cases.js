/* Teaching notes audited against RadEval d412dc2; not a replacement scorer. */
const boundaryCases = [
  {
    title: "意思相反，不代表其他詞都不算分",
    ref: "mild pulmonary edema", cand: "severe pulmonary edema",
    tokens: "BLEU：R=[mild | pulmonary | edema]；H=[severe | pulmonary | edema]",
    result: "BLEU-1 ≈ 2/3；ROUGE-1：P=R=2/3，F1≈0.667。",
    why: "只有 mild／severe 不命中，另外兩詞仍命中。字面指標沒有『臨床相反，整句判零』規則；兩句僅 3 詞，不能拿 BLEU-4 的近零結果證明它懂反義。"
  },
  {
    title: "刪掉 no，仍可能留下高分",
    ref: "no pleural effusion", cand: "pleural effusion",
    tokens: "BLEU：R=[no | pleural | effusion]；H=[pleural | effusion]",
    result: "BLEU-1：p₁=1、BP=exp(−0.5)，分數≈0.607；ROUGE-1：P=1、R=2/3，F1=0.800。",
    why: "Candidate 寫出的兩詞全有對上，但把最重要的否定漏掉了。no／not／without 不是可隨意刪除的『無意義詞』。"
  },
  {
    title: "句尾一個句點：BLEU 和 ROUGE 不一樣",
    ref: "pleural effusion.", cand: "pleural effusion",
    tokens: "BLEU：R=[pleural | effusion.]；H=[pleural | effusion]。ROUGE 前處理後兩側相同（再做 stemming）。",
    result: "BLEU-1 ≈ 0.500；ROUGE-1 F1=1.000。",
    why: "BLEU 只有 str.split()，句點黏在詞尾；ROUGE 將非 a–z／0–9 的連續字元換成空白。不是所有指標都先去標點。"
  },
  {
    title: "a 換成 the：功能詞也佔計分位置",
    ref: "a small pleural effusion", cand: "the small pleural effusion",
    tokens: "BLEU：R=[a | small | pleural | effusion]；H=[the | small | pleural | effusion]",
    result: "BLEU-1 ≈ 0.750；BLEU-4≈0；ROUGE-1 F1=0.750，ROUGE-2 F1≈0.667。",
    why: "兩者都沒有 stopword removal。a／the 不命中；small pleural 與 pleural effusion 兩個 bigram 命中，但唯一的 4-gram 不同。"
  },
  {
    title: "只改大小寫，也可能改分數",
    ref: "Mild edema", cand: "mild edema",
    tokens: "BLEU：[Mild | edema] ≠ [mild | edema]；ROUGE 先 lower()，再做 stemming。",
    result: "BLEU-1 ≈ 0.500；ROUGE-1 F1=1.000。",
    why: "這裡說的是 RadEval 此版本的實作，不是所有 BLEU 工具。其他套件或使用者事先清洗後，結果可能不同。"
  },
  {
    title: "一直重複相同詞，不會一直加分",
    ref: "pleural effusion", cand: "pleural effusion effusion",
    tokens: "Reference 的 effusion 只有 1 次；Candidate 寫 2 次，最多配到 1 次。",
    result: "BLEU-1 ≈ 2/3；ROUGE-1：P=2/3、R=1，F1=0.800。",
    why: "BLEU 採 clipped count；ROUGE n-gram overlap 也受兩側出現次數限制。多寫的詞會增加分母，不是免費加分。"
  },
  {
    title: "詞一樣、順序不同：看你選哪個階數",
    ref: "left pleural effusion", cand: "pleural effusion left",
    tokens: "unigram 3/3 相同；共同 bigram 只有 pleural effusion（1/2）；LCS 長度=2。",
    result: "BLEU-1≈1；BLEU-2≈0.707；ROUGE-1 F1=1、ROUGE-2 F1=0.5、ROUGE-L F1≈0.667。",
    why: "ROUGE-1 不看順序，ROUGE-2 看相鄰詞對，ROUGE-L 看順序但允許中間跳過詞。不能把三者都叫『同一個 ROUGE 分數』。"
  },
  {
    title: "逗點左右有沒有空白，也影響 BLEU",
    ref: "pleural, effusion", cand: "pleural , effusion",
    tokens: "BLEU：R=[pleural, | effusion]；H=[pleural | , | effusion]。ROUGE 兩側均轉為同一組詞幹。",
    result: "BLEU-1 ≈ 1/3；ROUGE-1 F1=1.000。",
    why: "逗點黏著詞時算同一 token；被空白分開時，逗點自己就是 token。換行與多個空白會被 split() 當分隔符，但不會自動移除標點。"
  }
];

const edgeCaseNotes = {
  bleu: {
    rows: [
      ["反義／否定", "只做完全相同的 n-gram 配對。mild≠severe，但共同詞照算；no 是普通 token，沒有特別加重或整句歸零機制。"],
      ["a／the 等功能詞", "全部保留，與疾病詞一樣參與計數、長度與 n-gram 組合；兩側相同可命中，不同會影響分子及連續片段。"],
      ["標點／大小寫", "precook() 只有 s.split()。不 lower、不去標點、不做詞幹化；effusion.≠effusion，Mild≠mild。"],
      ["順序／重複", "同一 token 的重複命中被 reference 次數截頂；高階 n-gram 必須連續、順序一致。短於 4 tokens，即使整句完全相同，BLEU-4 也可能近零。"]
    ],
    example: "本頁主例刻意直接輸入小寫、無句點的 mild cardiomegaly with small effusion / mild cardiomegaly，才有 p₁=1。這是示例字串的選擇，不是 RadEval 自動幫你清洗。",
    sources: ["radeval/metrics/bleu/bleu_scorer.py", "radeval/metrics/bleu/bleu.py"]
  },
  rouge: {
    rows: [
      ["反義／否定", "stem 不同即不命中，但其餘共同詞照算。沒有反義詞字典或否定邏輯；no 與 without 也不會自動視為同義。"],
      ["a／the 等功能詞", "不刪 stopwords。a、the、with、no 都可能進分子與分母；功能詞不等於被忽略。"],
      ["標點／大小寫", "預設 tokenizer 先小寫，再把非 [a-z0-9] 換成空白；use_stemmer=True，長度>3 的詞做 Porter stemming。這不是語意理解；中文、符號和小數點也會受此規則影響。"],
      ["順序／重複", "ROUGE-1 看詞頻重疊；ROUGE-2 看連續詞對；ROUGE-L 看 LCS。標點去除後可跨原句界形成相鄰詞，adapter 用 rougeL 而非 rougeLsum。"]
    ],
    example: "pleural effusion. / pleural effusion 的 ROUGE-1 F1=1；a small pleural effusion / the small pleural effusion 的 ROUGE-1 F1=0.75。兩者都是 F1，不是 recall。",
    sources: ["radeval/metrics/rouge/adapter.py", "https://github.com/google-research/google-research/blob/master/rouge/tokenize.py"]
  },
  bertscore: {
    rows: [
      ["反義／否定", "向量相似度不是邏輯真值；反義詞可能因相似上下文而接近。no 消失不會觸發固定扣分，高分仍可能臨床相反。"],
      ["a／the 等功能詞", "不做 stopword removal。idf=False 時一般 tokenizer token 權重為 1（再正規化）；CLS／SEP 權重設 0，padding 不算。a／the 不是預設 0 分。"],
      ["標點／大小寫", "依 distilbert-base-uncased tokenizer 切 WordPiece；標點通常成為 token，uncased 會正規化大小寫。token 是子詞，不保證一個英文單字剛好一格。"],
      ["順序／重複", "上下文編碼會受詞序影響；最佳配對不是一對一，也不採 BLEU clipped count。可多個 candidate token 選同一 reference token；重複詞仍影響平均。"]
    ],
    example: "不能在沒跑模型時說 mild→severe 固定扣 0.2。需保存 tokenizer、layer、baseline rescaling 與版本；本頁未對這些新例子實跑 encoder。",
    sources: ["radeval/metrics/bertscore/_vendor/scorer.py", "radeval/metrics/bertscore/_vendor/utils.py"]
  },
  "radeval-bertscore": {
    rows: [
      ["反義／否定", "領域 encoder 仍只提供相似度；沒有保證相反就零分或負分的邏輯規則。"],
      ["a／the 等功能詞", "不刪 stopwords；預設 idf=False，一般 token 參與對齊與平均，不因詞看起來不重要就排除。"],
      ["標點／大小寫", "由 IAMJB/RadEvalModernBERT 自己的 tokenizer 決定，不能套用 DistilBERT uncased 或 ROUGE 去標點的規則。RadEval adapter 沒另加清洗。"],
      ["順序／重複", "保留 BERTScore 的上下文編碼與多對一 max-cosine；不是逐字命中或一對一扣分。輸入太長會受到 tokenizer 的截斷設定限制。"]
    ],
    example: "逗點或 a／the 改動可能改變子詞與上下文；是否幾乎不影響分數必須實跑，不能承諾完全不計分。",
    sources: ["radeval/metrics/radevalbertscore/radevalbertscore.py", "radeval/metrics/bertscore/_vendor/scorer.py", "radeval/metrics/bertscore/_vendor/utils.py"]
  },
  f1chexbert: {
    rows: [
      ["反義／否定", "先預測狀態再二值化；rrg 模式把 class 1（positive）與 3（uncertain）合併為 1，其餘為 0。因此陽性與不確定可能完全同分，陰性與未提及也可能同分。"],
      ["a／the 等功能詞", "仍進 BERT 輸入，但不各自得分。只要最後二值標籤不變，這個指標的結果就不變。"],
      ["標點／大小寫", "bert-base-uncased tokenizer 處理標點及大小寫；沒有另刪 stopwords。每份報告 max_length=512，後段可能被截掉。"],
      ["逐筆到底怎麼算", "本版 adapter 取 base.forward() 最後兩項：逐筆相同二值標籤數／14 或／5，不是 exact-match。若只差 1/14 格，sample_acc_all=13/14≈0.929。"]
    ],
    example: "教學條件：若只有 Edema 一格由 0→1，其餘相同，all=13/14、5-condition=4/5。這是給定標籤後的確定計算，不是宣稱模型必然只改一格。",
    sources: ["radeval/metrics/f1chexbert/adapter.py", "radeval/metrics/_chexbert_base.py"]
  },
  "f1radbert-ct": {
    rows: [
      ["反義／否定", "取決於模型是否改變 18 個 finding 的 sigmoid 機率並跨過 >0.5。mild／severe 常屬同一 finding 類，沒有獨立嚴重度欄，不能保證扣分。"],
      ["a／the 等功能詞", "輸入保留，由分類器吸收上下文；不直接按字計分。19 欄標籤相同即同分。"],
      ["標點／大小寫", "使用 RadBERT-CT tokenizer，不做共用去標點清洗；512 token 截斷，標點可能影響分類輸出。"],
      ["邊界／逐筆", "門檻是嚴格 >0.5，剛好 0.5 不亮。per_sample 為 19 欄 exact-match，錯一格即 0；與 CheXbert 的逐欄比例不同。無 finding 時另外衍生 No finding。"]
    ],
    example: "不要把『模型仍判 effusion=1』理解成它確認了 left/right、mild/severe 都正確。分類標籤本身沒有保留這些細節。",
    sources: ["radeval/metrics/f1Radbert_ct/f1Radbert_ct.py", "radeval/metrics/f1Radbert_ct/adapter.py"]
  },
  radgraph: {
    rows: [
      ["反義／否定", "抽出的 entity label（如 present／absent／uncertain）或 modifier／relation 不同才影響配對；只翻一個詞不會自動讓整張 graph 歸零。"],
      ["a／the 等功能詞", "會進抽取模型，但只有被抽入計分 entity／relation 的內容才直接比對；沒有每個 a 各一分的規則。"],
      ["標點／大小寫", "radgraph-xl 先以 wordpunct_tokenize 分開標點。reward 的 simple／partial 保留 entity 字串；complete 只在有 relation 的分支 lower()，因此不能說全流程都忽略大小寫。"],
      ["順序／重複", "reward 用 set 去重，不依原句序排列加分；但詞序、標點可影響上游 graph。精確 entity token 配對不會自動接受所有同義詞。"]
    ],
    example: "small effusion→large effusion：effusion 核心 entity 可能仍命中，modifier 不同；究竟損失多少須先得到實際 graph，再分 simple／partial／complete 算。",
    sources: ["radeval/metrics/radgraph/_vendor/utils.py", "radeval/metrics/radgraph/_vendor/rewards.py"]
  },
  ratescore: {
    rows: [
      ["反義／否定", "不是相反即 0。先由 NER 分出 DISEASE／NON-DISEASE 等型別；特定相反型別配對乘 neg_weight，再與 cosine、affinity 合成，仍可能得正分。"],
      ["a／the 等功能詞", "不做整份報告的 stopword 計分；主要比抽出的醫療 entity。功能詞仍可能改變 NER 或 entity span。"],
      ["標點／大小寫", "先 medspaCy 切句，再由 NER 與 BioLORD tokenizer 處理；不能假定去掉句點或改大小寫就完全等價。"],
      ["配對／空結果", "逐 entity 找 top-1 cosine 搭檔，非一對一配對；任一側沒有 entity 時直接 0.5。0.5 不代表模型確認『半對』。"]
    ],
    example: "否定衝突不是固定扣 1 分：long matrix 的 neg_weight≈0.871655 是乘數，而且僅在 NER 型別落入程式指定 neg_class 時套用。",
    sources: ["radeval/metrics/RaTEScore/scorer.py", "radeval/metrics/RaTEScore/utils.py"]
  },
  "radgraph-radcliq": {
    rows: [
      ["反義／否定", "entity 以 (tokens, label) 精確配對；relation 連同兩端 entity 與 relation type 比對。否定讓 label 改變時會失配，但其他 entity 可照樣得分。"],
      ["a／the 等功能詞", "不直接逐字計分；由原版 RadGraph 抽出的 entity／relation 才進集合。"],
      ["標點／大小寫", "原版 radgraph 用自己的正則插入標點分隔；集合抽取這一層不額外 lower()。不能照搬 radgraph-xl 的前處理假設。"],
      ["順序／重複", "使用 set 去重；entity F1 與 relation F1 各占一半。兩個 relation sets 都空時 relation F1=0，並不特判為 1。"]
    ],
    example: "即使 entity F1=1，若兩邊都沒有 relation，這版公式會得到 (1+0)/2=0.5。這不是『有一半 finding 寫錯』。",
    sources: ["radeval/metrics/radgraph_radcliq/radgraph_radcliq.py", "radeval/metrics/radgraph/_vendor/utils.py"]
  },
  radcliq: {
    rows: [
      ["反義／否定", "沒有單一反義扣分開關；變化經 RadGraph、BERTScore、CheXbert embedding 與 BLEU-2，再乘回歸係數。不能直接把某字換掉就說減幾分。"],
      ["a／the 等功能詞", "BLEU-2 子分數保留；BERTScore 子分數使用依本次 refs 算的 IDF。出現在全部 reference 文件的 token，其 IDF=log((N+1)/(N+1))=0；這是資料驅動，不是 stopword 清單。"],
      ["標點／大小寫", "四條分支各有不同 tokenizer／前處理，沒有統一的忽略規則。BERTScore 分支是 distilroberta-base，不是單獨 BERTScore 卡的 DistilBERT。"],
      ["批次／尺度", "換一組 refs 會改 IDF，因此同一 pair 放在不同評估集合可能改分數。per_sample 是 raw 線性分數；aggregate=1/mean(raw)，不是其算術平均。"]
    ],
    example: "單一 reference 時，所有出現在該 reference 的 token 都可能是零 IDF，需檢查數值是否 finite；不要用一筆樣本推估整個 composite 的穩定性。",
    sources: ["radeval/metrics/RadCliQv1/radcliq.py", "radeval/metrics/bertscore/_vendor/utils.py"]
  },
  srrbert: {
    rows: [
      ["反義／否定", "先預測 finding×status labels；只有狀態標籤真的改變才影響分數。它不是比對 mild／severe 字串的反義詞表。"],
      ["a／the 等功能詞", "送進句子分類器，但不逐字計分；若合併後的 163-label 向量不變，結果相同。"],
      ["標點／大小寫", "有編號清理與 NLTK 切句；句點會影響句子邊界，所以不能先無條件刪掉。每句 max_length=512。"],
      ["順序／重複", "各句的二值輸出用 OR 合併；若句子預測不變，換句序或重複相同句子不增加標籤。但互相矛盾的兩句也可能使不同 status 同時亮起，OR 不會自動解決矛盾。"]
    ],
    example: "任一句亮，整份報告就亮；『多講一次』不加倍。句內重排可能改模型預測，不能套用這個不變性。",
    sources: ["radeval/metrics/SRRBert/srr_bert.py"]
  },
  temporal: {
    rows: [
      ["反義／否定", "只比抽到的時間關鍵詞集合：stable≠new，improved≠worsening。no change 仍會命中 change；不處理否定作用範圍，也不查變化屬於哪個 finding。"],
      ["a／the 等功能詞", "只要不在 KEYWORDS，就不直接計分；a／the 不在集合裡，no 也不在。這不代表臨床上可以刪掉 no。"],
      ["標點／大小寫", "regex 比對前小寫，以 word boundary 配固定關鍵詞；clean_text 處理換行、底線、連字號。NER 結果也需過 KEYWORDS 過濾。"],
      ["順序／重複", "set 去重，stable 出現 3 次仍算一種；stable／stability 雖語意近，仍是兩個不同字串。兩邊沒關鍵詞回 1.0；只檢查變化詞不代表理解時間推理。"]
    ],
    example: "R='no change'，H='change'：兩側集合都只有 {change}，可得約 1。R='stable'，H='stability'：沒有集合交集，即使意思相近也近零。",
    sources: ["radeval/metrics/f1temporal/f1temporal.py"]
  },
  green: {
    rows: [
      ["反義／否定", "LLM 按六類錯誤判定；mild→severe 可屬 severity error，no→有可能改 finding 是否存在。是否 significant、數幾次不能只從字串硬定。"],
      ["a／the 等功能詞", "送進 prompt，但不逐詞計分。prompt 要聚焦 clinical findings 而非 writing style；非重大措辭差異不進 E_sig。"],
      ["標點／大小寫", "make_prompt 先 split() 再以空白 join，會折疊空白但保留標點和大小寫；標點仍可能改語意或輸出判定。"],
      ["長度／數字", "每份報告先只留 300 words；模型 max_length=2048 是總長限制，不是 2048 new tokens。若否定詞或後段 finding 被截掉，模型根本沒看見完整報告。"]
    ],
    example: "『只是句點不同』通常不應是臨床重大錯誤，但不能保證 LLM 的兩次判定完全相同；先查解析出的 M 與各類 E，不只看最後分數。",
    sources: ["radeval/metrics/green_score/utils.py", "radeval/metrics/green_score/green.py"]
  },
  "mammo-green": {
    rows: [
      ["反義／否定", "按乳攝 prompt 判斷 finding、描述、laterality、BI-RADS、density；benign negative 有特殊規則，不是出現 no 就算一個 false finding。"],
      ["a／the 等功能詞", "完整報告進 prompt；措辭／格式差異若無臨床影響屬 insignificant，不進主分母。沒有刪 stopwords 步驟。"],
      ["標點／數字", "標點本身不是固定扣分項，但若改變 lesion count、位置、BI-RADS 等語意就可能算。BI-RADS 2→4 不可當成一般數字改動忽略。"],
      ["重複／額外細節", "prompt 排除 redundant narrative，且有 multiplicity cap、錯誤優先序及避免重複計罰規則；不可機械地數錯詞個數。"]
    ],
    example: "同一 lesion 的數目或過度具體位置不一定產生新的 finding；完整 system prompt 決定是 false、missing 還是 mischaracterization。實際數字要跑所選模型。",
    sources: ["radeval/metrics/green_score/mammo_green.py"]
  },
  crimson: {
    rows: [
      ["反義／否定", "只抽 abnormal／positive findings。mild→severe 可能是 matched finding 的 attribute error；從 no effusion 變成 effusion 可能是新增 positive finding。兩者不是相同計罰位置。"],
      ["a／the 等功能詞", "不逐字計分，也不先刪 stopwords。無臨床影響的 attribute error 若判為 negligible，權重=0。"],
      ["標點／數字", "沒有『標點一律忽略』硬規則；測量、certainty、laterality、temporal 都可成 attribute error。3 cm→1.5 cm 不是可隨意正規化的格式差。"],
      ["匹配／重複", "同一 ref_id 的 matched credit 只加一次；同一 finding 的不同 attribute issues 可分開列出。正常敘述不進 positive finding 清單，分母也不是總詞數。"]
    ],
    example: "分數進負值區的關鍵是 weighted false findings 超過 correct credit，不是任何反義詞都自動負分。missing 透過未取得 credit 反映，不再把它重複減一次。",
    sources: ["radeval/metrics/crimson/prompt_parts.py", "radeval/metrics/crimson/crimson.py"]
  },
  "radfact-ct": {
    rows: [
      ["反義／否定", "每個 atomic phrase 查 entailment；contradiction 與 neutral 都屬不被支持。其他 phrase 仍可得分，不是整份報告一票否決。"],
      ["a／the 等功能詞", "整句進 LLM，最後按 phrase 計數，不逐字算分。同義改寫能否 entail 要由 judge 判定。"],
      ["標點／句界", "拆句本身也是 LLM 步驟：一句有多個 findings 要拆開；相互依賴的連續句可能一起處理。標點可能改 phrase 清單與分母。"],
      ["陰性／模式", "預設 filter_negatives=False 保留陰性。設 True 會先移除陰性／正常 phrases，等於改變評估問題；兩側都沒有 phrases 時為 NaN，不是 1。"]
    ],
    example: "R='Acute appendicitis. No abscess.' / H='Acute appendicitis with an abscess.'：在示意拆成各 2 個 atoms 且只 appendicitis 相互支持的條件下 P=R=0.5；改用 RadFact+，reference no abscess 可能先被刪掉，recall 分母就不同。",
    sources: ["radeval/metrics/radfact_ct/radfact_ct.py", "radeval/metrics/radfact_ct/prompts/ct/report_to_phrases_system.txt", "radeval/metrics/radfact_ct/prompts/ct/negative_filtering_system.txt"]
  }
};

function edgeEscape(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  })[char]);
}

function renderBoundaryPrimer() {
  return `<h3>先別問「這個字有沒有分」：先看這一關在比什麼</h3>
    <p>原始報告 → 各自的前處理／tokenizer → 詞、向量、標籤或事實 → 計分。RadEval 沒有替所有指標做同一套去標點／停用詞清洗。a、the 是功能詞，不等於在所有任務都沒有意義；no、not、without 更不能先刪掉。</p>
    <p><strong>下列數字是依字面演算法手算的教學例</strong>（BLEU 忽略極小平滑常數）。BLEU-1 與預設 BLEU-4 分開標示；ROUGE-1 均為 F1。不是新跑出的 LLM／encoder 結果。</p>
    <div class="boundary-cases">${boundaryCases.map((item, i) => `
      <details class="boundary-case" ${i === 2 ? "open" : ""}>
        <summary>${i + 1}. ${edgeEscape(item.title)}</summary>
        <div class="boundary-pair"><div><small>Reference 左</small><code>${edgeEscape(item.ref)}</code></div><div><small>Candidate 右</small><code>${edgeEscape(item.cand)}</code></div></div>
        <p class="boundary-tokens">${edgeEscape(item.tokens)}</p>
        <p class="boundary-result">${edgeEscape(item.result)}</p>
        <p>${edgeEscape(item.why)}</p>
      </details>`).join("")}</div>
    <p>來源：<a href="https://github.com/jbdel/RadEval/blob/d412dc2da7df92f72d0b7128aee57b0237ec1b9a/radeval/metrics/bleu/bleu_scorer.py" target="_blank" rel="noreferrer">固定版 BLEU precook／clipping</a> · <a href="https://github.com/google-research/google-research/blob/master/rouge/tokenize.py" target="_blank" rel="noreferrer">ROUGE 上游 tokenizer（最新版，可能變動）</a>。RadEval 未鎖 rouge_score 版本；重現時也要記錄套件版本。</p>`;
}

function renderEdgeCases(id, sourceRoot) {
  const note = edgeCaseNotes[id];
  if (!note) return "<p>此指標的細節尚未核對，請查看原始碼。</p>";
  return `<p class="boundary-status">規則與設定：固定原始碼核對。模型對新句子的實際輸出：未實跑，不承諾固定扣幾分。</p>
    <dl class="boundary-rules">${note.rows.map(([label, text]) => `<dt>${edgeEscape(label)}</dt><dd>${edgeEscape(text)}</dd>`).join("")}</dl>
    <div class="implementation-note"><strong>記住這個例外：</strong>${edgeEscape(note.example)}</div>
    <details class="shared-comparisons"><summary>就地對照 8 組例句：反義、否定、標點、a／the、大小寫、重複與詞序</summary>${renderBoundaryPrimer()}</details>
    <div class="runtime-sources">${note.sources.map((path, i) => `<a target="_blank" rel="noreferrer" href="${path.startsWith("https:") ? path : sourceRoot + path}">${path.startsWith("https:") ? "上游 tokenizer（最新版）" : `依據 ${i + 1}：${path.split("/").pop()}`} ↗</a>`).join("")}</div>`;
}
