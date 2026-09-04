// Shared operational guidance for both editions; pinned upstream audit.
const operationalPitfalls = {
  "bleu": [
    [
      "短句完全一樣，BLEU-4 仍接近零",
      "少於 4 tokens 做不出 4-gram；這版使用極小平滑值，不會自動退回 BLEU-1。",
      "短句另看 detailed 模式的 bleu_1／bleu_2；不要自行換階數後仍標 BLEU-4。",
      "用完全相同的 2-token 與 5-token 報告各測一次，保留原始分數。",
      "bleu/bleu_scorer.py",
      "compute_score"
    ],
    [
      "平均逐筆 BLEU 不等於 corpus BLEU",
      "aggregate 先累計語料的命中、長度再算，並非 mean(per_sample)。",
      "系統比較固定同一份測試集合；分批時不要直接平均各批的 BLEU 總分。",
      "記錄 corpus 分數及逐筆分佈，但不要要求兩者平均相等。",
      "bleu/bleu_scorer.py",
      "compute_score"
    ],
    [
      "不能照抄其他 BLEU 套件的參數",
      "adapter 的 __init__ 沒有 n、smooth 或 tokenizer 參數；輸入也不是多參考巢狀清單。",
      "公開入口用 list[str]；要改平滑／分詞／n，必須另包底層 scorer，並標成不同評估設定。",
      "確認輸入沒有 list[list[str]]，設定中沒有未支援參數。",
      "bleu/adapter.py",
      "BleuMetric.__init__"
    ],
    [
      "標點、大小寫與模板字會左右結果",
      "split() 不移除標點、a／the 或大小寫差異，否定翻轉仍可命中大量共同片段。",
      "保留 raw reports；若另做正規化，兩邊用同一規則並記錄版本，不能先刪 no／without。",
      "同時加入否定翻轉、標點及短句測試；高 BLEU 不可當臨床安全門檻。",
      "bleu/bleu_scorer.py",
      "precook"
    ]
  ],
  "rouge": [
    [
      "回傳三個 key，不是 rouge 這個總分",
      "設定名 rouge 對應 rouge1／rouge2／rougeL，取的都是 fmeasure。",
      "儲存完整 key；不要把 rouge1 當 recall，或取字典第一項當統一指標。",
      "三個 key 都存在；需要 P/R 時另用底層 RougeScorer，不從 F1 反推。",
      "rouge/adapter.py",
      "RougeMetric._compute_raw"
    ],
    [
      "中文與小數點不能假設被保留",
      "adapter 使用上游預設 tokenizer＋Porter stemming；不是為中文分詞設計。",
      "中文報告先做獨立適用性驗證，不直接套英文門檻；固定 rouge_score 版本及 tokenizer。",
      "列出實際 tokens，測中文、3.5 cm、hyphen 與大小寫；不要只看最後 F1。",
      "rouge/adapter.py",
      "RougeScorer(use_stemmer=True)"
    ],
    [
      "ROUGE-L 不是逐句摘要版",
      "這裡是 rougeL 而不是 rougeLsum，沒有切句摘要 union-LCS 的相同保證。",
      "不要拿其他工具的 ROUGE-Lsum 結果混在同一張比較表。",
      "紀錄確切 variant；用換句序／加換行的同一對報告檢查差異。",
      "rouge/adapter.py",
      "_rouge_types"
    ],
    [
      "沒有自動忽略空報告或低品質標準答案",
      "wrapper 不檢查每個元素的內容，ROUGE adapter 直接對每對報告算分再平均。",
      "先標記空字串、純標點與資料缺漏；不可把缺失值轉字串 nan 或 None。",
      "有效筆數、空值筆數與平均分一起報告；參考報告是否正確另需查核。",
      "rouge/adapter.py",
      "RougeMetric._compute_raw"
    ]
  ],
  "bertscore": [
    [
      "不是所有 BERTScore 都是同一把尺",
      "本版固定 DistilBERT layer 5，且做 baseline rescaling；不等於其他模型或預設 bert-score。",
      "保存模型、layer、tokenizer、baseline TSV 與套件版本；只在同設定下比較。",
      "報表寫明 checkpoint／layer／rescale／idf，而非只寫 BERTScore。",
      "bertscore/adapter.py",
      "BertScoreMetric.__init__"
    ],
    [
      "不要強制把分數裁到 0～1",
      "rescaling 是 (raw−baseline)/(1−baseline)，沒有 clip；低於 baseline 可成負值。",
      "保留負值與原始精度，不做百分比／機率解讀；空輸入另行標記。",
      "檢查 finite，但不要把『<0』直接當程式錯誤或設成 0。",
      "bertscore/_vendor/scorer.py",
      "BERTScorer.score"
    ],
    [
      "OOM 與長文截斷是不同問題",
      "batch_size=64；tokenizer 依 model_max_length 截斷。減 batch 不會恢復被截掉的文字。",
      "先量 tokenizer 長度；大批次問題用底層 scorer 調 batch，長文另訂一致處理政策。公開 adapter 沒暴露這些參數。",
      "分別記錄最大 token 長度、截斷比例與峰值記憶體。",
      "bertscore/bertscore.py",
      "BertScoreBase._score_batched"
    ],
    [
      "高相似度不能攔住臨床反義",
      "token max-cosine 配對不等於邏輯蘊含；否定、左右側或嚴重度改動可能仍高分。",
      "另搭臨床／事實指標與人工抽查；不要單憑 embedding 相似度放行報告。",
      "用 no→有、left→right、mild→severe 的固定測試組測敏感度，數值須實跑。",
      "bertscore/_vendor/utils.py",
      "greedy_cos_idf"
    ]
  ],
  "radeval-bertscore": [
    [
      "放射領域版不等於通用版換名字",
      "固定 IAMJB/RadEvalModernBERT、layer 22、fast tokenizer、rescale=False。",
      "不要套用通用 BERTScore 的 baseline、門檻或 token 數；兩版分開校準。",
      "保存四項設定及模型 revision，避免 checkpoint 更新後教材設定失配。",
      "radevalbertscore/adapter.py",
      "RadEvalBertScoreMetric.__init__"
    ],
    [
      "能載入模型，不代表長報告全被看到",
      "共用 token 編碼仍使用 tokenizer.model_max_length 與 truncation；不是無限長。",
      "在目標環境讀實際 tokenizer 上限，統計超長報告，不能直接假設 512 或不限長。",
      "把關鍵 finding 放在文首／文尾測試，檢查實際輸入 token 是否被截掉。",
      "bertscore/_vendor/utils.py",
      "sent_encode"
    ],
    [
      "有 GPU 仍可能一次載入太多",
      "此 scorer 預設 batch_size=64；RadEval 會把所有指定指標初始化後才逐一計算。",
      "先單獨啟動此指標做小量測試；需要 batch/device 客製時用底層 RadEvalBERTScorer，而非塞不支援參數。",
      "記錄載入與推論峰值記憶體；不要一次啟用 16 項試機。",
      "radevalbertscore/radevalbertscore.py",
      "RadEvalBERTScorer.__init__"
    ],
    [
      "領域模型仍無法保證否定判對",
      "這是 encoder similarity，不是臨床裁判，也不輸出可審核的錯誤分類。",
      "別把『醫療專用』等同『邏輯正確』；保留事實檢查與人工標註對照。",
      "用同義正例和否定／側別反例一起校準，不只測同義句。",
      "bertscore/_vendor/utils.py",
      "greedy_cos_idf"
    ]
  ],
  "f1chexbert": [
    [
      "逐筆 sample_acc 不是 F1，也不是全對才 1",
      "per_sample 回相同二值標籤比例；aggregate 回 micro／macro／weighted F1，key 也變。",
      "不要平均 sample_acc 充當 corpus F1；儲存 f1chexbert_sample_acc_all／_5 的完整名稱。",
      "給定只差一格的標籤，all 應為 13/14，top5 若該格在其中則為 4/5。",
      "f1chexbert/adapter.py",
      "F1CheXbertMetric.compute"
    ],
    [
      "uncertain 與 positive 被合併",
      "rrg 二值化把 1／3 合為 1，negative／未提及合為 0。",
      "若要評估確定性或『有沒有明確否認』，另保留原始四態標籤或使用其他指標。",
      "加入 positive↔uncertain、negative↔未提及的標籤層測試，不能要求本分數一定下降。",
      "_chexbert_base.py",
      "BaseCheXbertEvaluator.get_labels"
    ],
    [
      "CPU fallback 可能來不及生效",
      "預設 device=cuda；labeler 在 evaluator 的 CPU fallback 前就 self.to(device)。",
      "CPU-only 改用底層 F1CheXbert(device=\"cpu\") 並確認回傳 tuple 格式；不要向無參數 adapter 傳 device。",
      "先做模型初始化測試；沒有 GPU 的環境不可把範例宣稱為開箱即用。",
      "f1chexbert/f1chexbert.py",
      "F1CheXbert.__init__"
    ],
    [
      "長報告與 cached refs 都可能讓答案失真",
      "報告截斷 512 tokens；底層 refs_filename 已存在時直接讀標籤，不驗證對應報告內容。",
      "先檢查長度；若使用標籤快取，檔名／manifest 綁定報告順序、hash、模型與模式。",
      "改 reference 或調換順序時重建快取；抽查原文與 14 格標籤是否對得上。",
      "_chexbert_base.py",
      "BaseCheXbertEvaluator.forward"
    ]
  ],
  "f1radbert-ct": [
    [
      "19 欄全對才是逐筆 1",
      "18 findings 加 No finding；per_sample 是 exact-match，而非 CheXbert 的逐欄比例。",
      "分開儲存 f1radbert_ct_sample_acc 與 aggregate micro/macro F1，不互相替代。",
      "給定只差一格的 19 欄向量，sample_acc 應為 0。",
      "f1Radbert_ct/adapter.py",
      "F1RadbertCTMetric.compute"
    ],
    [
      "0.5 剛好不算陽性",
      "底層用 sigmoid > 0.5；No finding 是由其他 18 欄是否全陰性衍生。",
      "不要在後處理改成 >=0.5；不能把 No finding 當獨立第 19 個模型輸出機率。",
      "測 0.4999／0.5／0.5001 的門檻邏輯，並檢查 No finding 的互斥關係。",
      "f1Radbert_ct/f1Radbert_ct.py",
      "F1RadbertCT._predict_label_matrix"
    ],
    [
      "accuracy 很高不保證少見病抓得好",
      "標籤分類只涵蓋固定 finding 名單；aggregate weighted F1 受 reference support 影響。",
      "同時看 micro、macro 與各 label 分數／樣本數；側別、大小與嚴重度另評估。",
      "列出 rare labels 的 support；沒有正例的項目不能據此宣稱已驗證。",
      "f1Radbert_ct/f1Radbert_ct.py",
      "F1RadbertCT.forward"
    ],
    [
      "512-token 上限與固定 batch",
      "adapter 固定 threshold=.5、batch_size=16，未暴露 device／threshold／batch_size。",
      "先驗證 CT 英文報告及截斷率；調參時使用底層 F1RadbertCT，並將新設定視為不同實驗。",
      "同一測試集合固定 threshold；不得為提高測試分數臨時調門檻。",
      "f1Radbert_ct/adapter.py",
      "F1RadbertCTMetric.__init__"
    ]
  ],
  "radgraph": [
    [
      "有三種分數，不能只存 radgraph",
      "adapter 固定 radgraph-xl，回 simple／partial／complete 三個 key。",
      "選定一個 primary reward level 並同時保存三者；不要與原版 RadGraph–RadCliQ 互換。",
      "確認 key 為 radgraph_simple／radgraph_partial／radgraph_complete。",
      "_radgraph_adapter.py",
      "RadGraphMetric.compute"
    ],
    [
      "空字串直接零分，不代表模型判有臨床錯誤",
      "F1RadGraph 對任一側 len=0 的 pair 填 0；空白字串不符合這個判定，仍可能進模型。",
      "先用 strip 檢測空白，但保存原文；分開報告缺失樣本與真實錯誤。",
      "空字串、純空白、純標點分別測，勿把三者當成相同處理。",
      "radgraph/_vendor/core.py",
      "F1RadGraph.forward"
    ],
    [
      "同義詞可能仍失配，重複節點又可能被去重",
      "抽取模型後 reward 使用 entity／relation 集合；不是只看意思相近。",
      "出現反直覺分數時先比較實際 graph；區分抽取錯誤與集合配對錯誤。",
      "抽查 entity tokens、label、relation endpoint；別只印一個 F1。",
      "radgraph/_vendor/rewards.py",
      "compute_reward"
    ],
    [
      "換大模型／快取路徑不是公開設定",
      "adapter 無參數；底層 RadGraph 另有 model_cache_dir／tokenizer_cache_dir 與 cuda。",
      "離線前預載 graph archive 與 tokenizer；需要換模型時另包底層並記錄型號。",
      "在無網路環境先做載入測試；RadEval(cache_dir=...) 不會替此 adapter 設快取。",
      "radgraph/_vendor/core.py",
      "RadGraph.__init__"
    ]
  ],
  "ratescore": [
    [
      "任一側沒抽出 entity，直接回 0.5",
      "空 entity fallback 不代表半對；無關文字也可能因抽取失敗得到這個值。",
      "把 entity 數量與分數一起存；把 fallback 樣本獨立標記，不能只用 0.5 當通過門檻。",
      "抽查所有 0.5，辨別是真的計算結果或任一側零 entity。",
      "RaTEScore/scorer.py",
      "RaTEScore.compute_score"
    ],
    [
      "沒有一對一配對保證",
      "每個 entity 找 top-1 cosine，可重用同一搭檔；否定型別還有非零權重。",
      "不要解讀成『幾個實體完整一對一對上』；計數／重複／否定另驗證。",
      "保留 NER spans、types 及配對；同一 entity 重複與否定翻轉各測一組。",
      "RaTEScore/utils.py",
      "compute"
    ],
    [
      "改 affinity matrix 就換了評分規則",
      "預設 long matrix；還有 short／自訂選項，但公開 adapter 沒暴露。",
      "固定兩個 checkpoint、NER label mapping 與 matrix，不能混用不同權重的結果。",
      "報表寫明 long；若客製則保存 matrix 的 hash 與來源。",
      "RaTEScore/scorer.py",
      "RaTEScore.__init__"
    ],
    [
      "detailed 並不自動帶回抽取結果",
      "底層 compute_score 回 score、candidate entities、reference entities；adapter 丟棄後兩項。",
      "需要排錯時直接用底層 scorer 保存這些輸出；敏感報告不可寫入公開教材。",
      "確認排錯檔案能用 report_id 連回對應 pair，且已按資料權限保護。",
      "RaTEScore/adapter.py",
      "RaTEScoreMetric._compute_raw"
    ]
  ],
  "radgraph-radcliq": [
    [
      "不是 radgraph_simple 的另一個名字",
      "使用原版 radgraph，按 (entity F1 + relation F1)/2；與 XL 的三階 reward 不同。",
      "固定模型與公式；為復現 RadCliQ 子分數時不能換成 XL。",
      "模型名及 output key radgraph_radcliq 要一併保存。",
      "radgraph_radcliq/radgraph_radcliq.py",
      "RadGraphRadCliQ.__init__"
    ],
    [
      "完全相同但兩側都沒 relation，可只有 0.5",
      "空 relation sets 的 F1=0，不特判為 1；若 entity F1=1，總分=(1+0)/2。",
      "不要因為自我比較未得 1 就自行修成 1；另記 entity/relation 兩項。",
      "以相同非空 entity、空 relation 的人工 graph 驗算 0.5。",
      "radgraph_radcliq/radgraph_radcliq.py",
      "_compute_f1"
    ],
    [
      "missing graph key 會用空 dict 繼續算",
      "forward 以 outputs.get(str(i), {}) 取結果，沒有 key 也可能只反映為低分。",
      "呼叫底層時檢查每個輸出 id 都存在；把抽取失敗與真正沒有 entity 分開。",
      "輸入 N 筆，檢查兩側 annotation keys 覆蓋 0…N−1，不能只確認 scores 長度。",
      "radgraph_radcliq/radgraph_radcliq.py",
      "RadGraphRadCliQ.forward"
    ],
    [
      "文字／標籤精確相等不是臨床等價",
      "tokens、label 和 relation 端點進集合；同義改寫可失配，重複項可被去重。",
      "把它當結構相似度，不拿來取代完整事實覆蓋；異常結果回查 graph。",
      "同義句、相反 label、缺 relation 分開做測試。",
      "radgraph_radcliq/radgraph_radcliq.py",
      "_extract_entities / _extract_relations"
    ]
  ],
  "radcliq": [
    [
      "aggregate 與 per_sample 方向、尺度不同",
      "per_sample 是線性 raw d；aggregate=1/mean(d)。跨零或平均接近零時，倒數不穩定。",
      "保留 raw d；不要直接當 0～1 reward，也不要把倒數結果 clip 成機率。",
      "檢查 NaN／Inf、mean(d) 的符號與離零距離；不可在跨零區只用『越高越好』排序。",
      "RadCliQv1/radcliq.py",
      "CompositeMetric.predict"
    ],
    [
      "拆資料批次會改變 IDF 定義",
      "BERTScore IDF 由 refs 建立；換評估集合就可能讓同一 pair 分數改變。",
      "固定完整 reference corpus；不要各小批重建 IDF 後平均。單筆 sanity check 不代表正式語料結果。",
      "相同 pair 放在不同 refs 集合時做差異檢查，並保存 corpus hash。",
      "RadCliQv1/radcliq.py",
      "CompositeMetric._get_bert_scorer"
    ],
    [
      "in-place 修改 refs 可能沿用舊 IDF",
      "快取鍵是 id(refs)，不是內容 hash；同一 list 內容變了仍可命中快取。",
      "把 refs 當不可變資料；新資料集重建 scorer，勿只修改同一個 list。",
      "新舊 corpus 使用獨立 scorer，核對記錄的 corpus hash。",
      "RadCliQv1/radcliq.py",
      "CompositeMetric._get_bert_scorer"
    ],
    [
      "四個輸入不能換成別張卡的分數",
      "內部用原版 RadGraph、DistilRoBERTa＋IDF、CheXbert embedding cosine、BLEU-2。",
      "不要代入單獨 BERTScore、CheXbert F1 或 XL reward；保留原始標準化與係數。",
      "核對欄位順序 radgraph／bertscore／semb_score／bleu_score 及固定 μ、σ。",
      "RadCliQv1/radcliq.py",
      "CompositeMetric._build_matrix"
    ]
  ],
  "srrbert": [
    [
      "逐筆欄位叫 weighted，計算卻不是 corpus weighted F1",
      "adapter 的 per_sample 用 multilabel_prf_per_sample：在標籤聯集上平均逐欄 P/R/F1。二值條件下約為交集/聯集，不是標準 sample F1。",
      "明確標記『此版逐欄聯集平均』；不要只因 key 名含 weighted 就當 weighted F1。",
      "人工標籤 ref={A,B}、cand={A,C} 時逐筆三者約 1/3，標準 sample F1 才是 1/2。",
      "SRRBert/adapter.py",
      "SRRBertMetric._compute_raw；另見 radeval/utils.py"
    ],
    [
      "兩側皆零標籤，逐筆可得 1",
      "共用 helper 對無相關標籤的向量特判為 1；不等於全文臨床正確。全批空句子還可能讓 np.concatenate 無輸入而失敗。",
      "拒收空白報告並記錄零標籤率；不要把『沒有抽到東西』混成模型滿分。",
      "分別測空文字、非空但零標籤、有效句子，不混成一種 empty case。",
      "SRRBert/srr_bert.py",
      "SRRBert.forward / evaluate"
    ],
    [
      "OR 合併可能保留矛盾狀態",
      "各句獨立分類後 OR；不同句子的相反 status 可以同時亮，不會自行解決。",
      "比較前做句子與標籤對照，另外檢查同 finding 的互斥 status。",
      "加入『有 effusion。無 effusion。』等合成衝突例，查看實際 163 向量。",
      "SRRBert/srr_bert.py",
      "SRRBert.evaluate"
    ],
    [
      "離線切句資源與長句都要測",
      "初始化下載 NLTK punkt_tab；每句 token 截斷到 512，而非全文 512。",
      "預載切句資源與模型；保留句點，不先粗暴移除標點。",
      "檢查縮寫、小數與列點的實際切句結果，以及每句 token 長度。",
      "SRRBert/adapter.py",
      "SRRBertMetric.__init__"
    ]
  ],
  "temporal": [
    [
      "兩側沒變化詞就 1，會墊高平均",
      "empty-empty 是特例滿分，不代表比較了時間推理。",
      "總體平均以外，另報『至少一側有時間詞』子集與 empty-empty 比率，不改寫原分數。",
      "大量一般報告時先看空集合比例，再解讀總分。",
      "f1temporal/f1temporal.py",
      "calculate_tem_score"
    ],
    [
      "no change 與 change 可能同分",
      "regex 查固定關鍵詞；不看否定作用範圍、不綁定 finding。",
      "不用這個指標單獨驗證病情變化是否正確；另查否定與對應病灶。",
      "no change↔change、A stable/B new↔A new/B stable 都列為必測反例。",
      "f1temporal/f1temporal.py",
      "extract_entities"
    ],
    [
      "stable 與 stability 不自動視為同義",
      "KEYWORDS 以字串集合比較，詞形不同可沒有交集；重複同詞則去重。",
      "不要把它描述成完整的語意時間指標；保留抽出的 keyword sets。",
      "測同義詞形及重複詞，核對集合而不是只看 epsilon 四捨五入後的 0。",
      "f1temporal/f1temporal.py",
      "KEYWORDS / calculate_tem_score"
    ],
    [
      "看似規則指標，初始化仍需模型",
      "adapter 會下載 Stanza radiology 資源，模組載入時建立 nlp pipeline。",
      "離線環境先備齊 Stanza model；不要以為沒有 API 就不需下載或記憶體。",
      "關網前先做初始化及一筆推論；detailed 不會自動回傳 keyword sets，排錯用底層。",
      "f1temporal/adapter.py",
      "TemporalF1Metric.__init__"
    ]
  ],
  "green": [
    [
      "完整報告其實只保留前 300 words",
      "make_prompt 各取前 300 個空白分詞；generation max_length=2048 又是總長限制。",
      "先檢查兩側截斷比例；不要自行只截 candidate，或聲稱評估過被截掉的 finding。",
      "把關鍵反義放在第 301 word 後確認它不在 prompt；正式評估固定同一政策。",
      "green_score/utils.py",
      "make_prompt"
    ],
    [
      "格式解析失敗也可能吐出正常數字",
      "找不到 Matched Findings 時計數默認 0；找到 M 但錯誤段缺失時錯誤可能默認 0。",
      "驗證回覆段落／六類計數／M 是否齊全後才採信分數，不能只查 finite。",
      "合成測試：空回覆→0；只有 [Matched Findings]: 1. →可能1，兩者應標 parse-invalid。",
      "green_score/green.py",
      "GREEN.compute_green / parse_error_counts"
    ],
    [
      "零 matched 不是『完全正常就滿分』",
      "compute_green 對 M=0 先回 0；不可自行把 0/0 改成 1。",
      "零 finding／全陰性報告另做適用性檢查，保留原始 analysis 確認 judge 怎麼算 M。",
      "相同正常報告先實跑並查看 M/E，不能預設所有 self-match 必為 1。",
      "green_score/green.py",
      "GREEN.compute_green"
    ],
    [
      "本地 7B 模型不是 API，小機器不可照 benchmark 承諾速度",
      "adapter 固定 7B；GREEN 自動偵測可見 GPU，可能啟用最多 8 張的多程序路徑。",
      "先單卡小批測試，限制可見 GPU；Windows 多程序需獨立驗證，不保證跨平台開箱即用。",
      "記錄模型載入、VRAM、截斷與分析格式；公開 detailed 只加 std，不含 raw analysis。",
      "green_score/green.py",
      "GREEN.__init__ / process_results"
    ]
  ],
  "mammo-green": [
    [
      "底層與 RadEval 的預設模型不同",
      "MammoGREEN 直接建構預設 gpt-4o；adapter 預設 gpt-4o-mini。",
      "所有實驗顯式指定 model_name，保存 provider 與可用的模型快照，勿依賴預設。",
      "檢查實際送出的 model 名，不只看程式 import 的類別。",
      "green_score/mammo_green.py",
      "MammoGREEN.__init__；另見 adapter.py"
    ],
    [
      "共用 cache_dir 會造成參數錯誤",
      "RadEval 對 is_api_based 傳 cache_dir，但 MammoGreenMetric.__init__ 不接受。",
      "此版呼叫 MammoGREEN 不傳 RadEval 層 cache_dir；它也不是 LLM 回覆快取。",
      "用 adapter signature 確認參數；別等大量任務排好才測初始化。",
      "green_score/adapter.py",
      "MammoGreenMetric.__init__"
    ],
    [
      "API 重試仍可能整批中止",
      "解析先過 JSON／schema；持續失敗會 raise RuntimeError，async gather 沒有逐筆錯誤結果保底。",
      "先用去識別小批、較低 max_concurrent；保存已完成批次並獨立記錄失敗，避免重跑全部。",
      "記錄成功／失敗／重試與供應商用量；沒有結果不等於 score=0。",
      "_llm_base.py",
      "_evaluate_one_async / _run_concurrent"
    ],
    [
      "不只是把 GREEN 用在乳房報告",
      "BI-RADS、density、laterality、benign negative 與重複計罰規則由專屬 prompt 定義。",
      "不要把通用 GREEN 與 MammoGREEN 分數混成同一尺度／相同裁判；乳攝測試須含專科反例。",
      "逐項抽查匹配數與六類 significant errors；detailed=True 只有 std，不會附整份 JSON。",
      "green_score/mammo_green.py",
      "MammoGREEN._aggregate"
    ]
  ],
  "crimson": [
    [
      "失敗樣本可能被平均悄悄排除",
      "persistent failure 產生 NaN；aggregate 只平均 valid，全部失敗時甚至回 mean=0、std=0。",
      "每次保存 per_sample 並計算 failure rate；全失敗標成 failed，不把 0 當模型表現。",
      "核對 N_total／N_valid／N_failed，兩個系統在相同有效樣本集合才公平比較。",
      "crimson/crimson.py",
      "CRIMSON._aggregate / _nan_fallback"
    ],
    [
      "HF 與 API 不是可互換的同一裁判",
      "預設 HF MedGemma 與 OpenAI 使用不同模型／guidelines 路徑；HF 還會讀 generation_config。",
      "顯式記錄 provider、model revision、prompt 組件及 generation config；改 provider 後重新校準。",
      "確認 model_name 屬於選定 provider，不能只改名稱而忘記 provider。",
      "crimson/crimson.py",
      "CRIMSON.__init__ / _init_hf_pipeline"
    ],
    [
      "負分有效，裁成零會抹掉重大幻覺",
      "false finding 的 weighted penalty 可讓結果落入 (−1,0)，missing 則是未拿到 credit。",
      "保留 (−1,1] 原尺度；別把 missing 再扣一次，也別把所有錯誤都乘同一權重。",
      "檢查 false／missing／attribute 列表及 significance，不能只看最後正負號。",
      "crimson/crimson.py",
      "CRIMSON._calculate_crimson"
    ],
    [
      "修復 JSON 不代表語意完整",
      "解析器會嘗試修復截斷 JSON，再做 schema 驗證；模型漏列的錯誤未必被 schema 抓到。",
      "排錯時留原始回覆、是否修復與解析後物件；只存總分不足以追查。",
      "抽查輸出尾端、finding IDs 及對應報告；模型解析成功與臨床判讀正確分開驗收。",
      "crimson/crimson.py",
      "CRIMSON._parse_response"
    ],
    [
      "5090 上的額外 attention 加速需單獨驗收",
      "HF 路徑若 is_flash_attn_2_available() 為真，會指定 flash_attention_2；能偵測到套件不等於已驗證你的 GPU／模型／dtype 組合。",
      "先用未加入額外 attention 加速套件的隔離環境測基本路徑；既有環境若卡在 kernel，先查實際 backend 與版本，不要只改 batch。",
      "實跑一次 CRIMSON 生成，保存 attention backend、torch／CUDA／擴充套件版本與 traceback；小型矩陣測試通過仍不代表此路徑成功。",
      "crimson/crimson.py",
      "CRIMSON._init_hf_pipeline"
    ]
  ],
  "radfact-ct": [
    [
      "總分與逐筆值不能直接拼在同一欄",
      "aggregate=100×nanmean(P/R)，再重算 F1；per_sample 是 0～1，且 mean(F1_i) 不等於 aggregate F1。",
      "結果 schema 明確寫 unit；顯示時才轉換，保留原值和聚合定義。",
      "逐筆 P=.5/R=.5 對應單筆 aggregate=50；多筆則以平均 P/R 重算核對。",
      "radfact_ct/radfact_ct.py",
      "RadFactCT._aggregate"
    ],
    [
      "空值／解析失敗會改變分母或假裝不支持",
      "無法拆句可能回 []；NLI 無法解析會當 not_entailment。兩側空 phrases 為 NaN，aggregate 以 nanmean 忽略。",
      "保留 phrases、NLI 原始回覆及 parse 狀態；分開報告未定義、API failure 與真正 contradiction。",
      "分別查 P、R 有效筆數；全部 NaN 時 aggregate F1 可能是0，不是有效零分。",
      "radfact_ct/radfact_ct.py",
      "_parse_phrases_from_response / _parse_nli_response"
    ],
    [
      "Notebook 的事件迴圈可能撞 asyncio.run",
      "預設 max_concurrent=50 的 forward 直接 asyncio.run，沒有共用基底的 notebook fallback。",
      "Notebook 中簡單避法是 adapter 設 max_concurrent=1；要非同步就直接 await 底層 forward_async，不在既有 loop 再 run。",
      "先用小量去識別資料測執行入口；async 與 sync 模式均檢查回傳型別。",
      "radfact_ct/radfact_ct.py",
      "RadFactCT.forward"
    ],
    [
      "50 份並行不等於只有 50 個 API 呼叫",
      "semaphore 限制 report pairs；一份拆完後會為每個 phrase 並行做雙向 NLI。",
      "從低 max_concurrent 起步；成本估計包含兩側拆句、每個 phrase、負句過濾及重試。",
      "記錄每份 phrase 數與實際 token 用量；用供應商帳務核對，不只看進度條。",
      "radfact_ct/radfact_ct.py",
      "forward_async / bidirectional_nli_async"
    ],
    [
      "不支援的共用 key／切換模式會改評估問題",
      "adapter 不接受 cache_dir、gemini_api_key；filter_negatives=True 是 RadFact+，不是純加速選項。",
      "此版不要向頂層傳這兩項給 RadFact；顯式固定 filter_negatives 並區分 +/- 與 + 結果。",
      "啟動前做 signature 檢查；測正常／陰性報告過濾後是否變成空集合。",
      "radfact_ct/adapter.py",
      "RadFactCTMetric.__init__"
    ]
  ]
};

const commonRunChecks = [
  [
    "先驗證資料配對，而不只驗證長度",
    "RadEval 只驗證外層是 list、長度相同；不會檢查元素為字串、report_id 或病人是否對齊。metrics=None 也不會自動跑 16 項。",
    "以 report_id 明確配對；拒收 None／NaN／空白，檢查重複 ID；顯式列出 metrics。對拒收樣本另記原因，不偷偷刪掉。",
    "radeval/radeval.py",
    "RadEval.__call__ / _normalize_metrics"
  ],
  [
    "不要全域套用一樣的參數",
    "大多數非 API adapter 是無參數建構；cache_dir 只被注入 is_api_based，而其中 MammoGREEN／RadFact 卻未接受它。",
    "照各 adapter 的 signature 建 config；不把 device、batch_size、cache_dir 一口氣塞給全部。需客製就分開包底層 scorer。",
    "radeval/radeval.py",
    "RadEval.__init__"
  ],
  [
    "per_sample + detailed 不保證兩者兼得",
    "共用 formatter 優先 per_sample，因此通常不帶 detailed extras；不同 adapter 還有例外，metric_keys 清單也未反映所有逐筆 key。",
    "以真正回傳的 dict 驗 schema；需要原始 evidence 時使用底層回傳，不假定 detailed=True 就有。API 不要為拿另一種輸出盲目重跑付費呼叫。",
    "radeval/metrics/_base.py",
    "MetricBase._format_output"
  ],
  [
    "一個指標失敗，整次呼叫可能拿不到結果",
    "compute_scores 沒有逐 metric try/except；初始化也會先建好所有指定模型。warnings 還會被全域 suppress。",
    "用獨立程序按指標／受控批次執行並保存完成結果；記錄 exception、失敗筆數與處理策略。不要把 missing score 自動補 0。",
    "radeval/radeval.py",
    "RadEval.__init__ / compute_scores"
  ],
  [
    "來源固定，不代表 pip install 永遠復現",
    "教材固定到 d412dc2；未鎖版的 pip install radeval 可能裝到另一版，模型 repo 也可能更新。",
    "保留 RadEval commit、Python／torch／transformers／tokenizers 等 lock、模型 revision、prompt hash、輸入 hash、seed、解碼與輸出模式。",
    "README.md",
    "Installation / Known-good stack"
  ],
  [
    "數字要附分母、單位、方向及失敗率",
    "分數有 corpus、sample、label-weighted、倒數或百分比；NaN/Inf、fallback 0／0.5／1 各有不同意義。",
    "紀錄 N_total、N_valid、N_failed、N_empty、N_truncated；每個 key 定義 unit／direction／aggregation。不要把 16 項直接平均成一個總分。",
    "radeval/metrics/_base.py",
    "MetricBase；各指標專屬規則見下方"
  ],
  [
    "外部 API 與本地模型都要有資料邊界",
    "MammoGREEN、RadFact-CT 及 CRIMSON 的 API 路徑會送出報告；本地載入也會下載權重，並不代表零網路存取。",
    "先確認報告可否外傳與供應商設定；未獲許可只用本地路徑。API key 放環境／secret 管理；原始回覆與病人資料不進公開 GitHub 或 Notion。",
    "radeval/metrics/_llm_base.py",
    "LLMMetricBase"
  ],
  [
    "先過小型驗收集，再跑完整隊列",
    "單一高分不能證明臨床有效；CXR、CT、乳攝、中文與英文不應共用未驗證門檻。",
    "驗收至少含 self-match、同義改寫、否定／側別／程度／數字反例、漏寫／多寫、空白、超長與罕見 findings；保存人工判讀對照。這是部署建議，不是套件已保證的測試。",
    "README.md",
    "Metric coverage"
  ]
];

const linux5090Probe = "\"\"\"Probe the selected CUDA device without reports or model downloads.\"\"\"\n\nfrom importlib.metadata import PackageNotFoundError, version\n\nimport torch\n\nfor package in (\"radeval\", \"torch\", \"transformers\", \"tokenizers\"):\n    try:\n        print(package, version(package))\n    except PackageNotFoundError:\n        print(package, \"NOT INSTALLED\")\n\nprint(\"PyTorch CUDA build:\", torch.version.cuda)\nif not torch.cuda.is_available():\n    raise SystemExit(\"CUDA unavailable: check driver and PyTorch build.\")\n\nprint(\"Device:\", torch.cuda.get_device_name(0))\nprint(\"Compute capability:\", torch.cuda.get_device_capability(0))\nprint(\"Compiled architectures:\", torch.cuda.get_arch_list())\nfor dtype in (torch.float32, torch.float16, torch.bfloat16):\n    matrix = torch.ones((128, 128), device=\"cuda\", dtype=dtype)\n    result = matrix @ matrix\n    torch.cuda.synchronize()\n    expected = torch.full_like(result, 128)\n    if not torch.isfinite(result).all().item():\n        raise RuntimeError(f\"Non-finite CUDA output: {dtype}\")\n    if not torch.allclose(result, expected):\n        raise RuntimeError(f\"Incorrect CUDA output: {dtype}\")\n    print(dtype, \"small matrix test PASS\")\n\nprint(\"Next: run each actual metric; this is not model certification.\")\n";

function pitfallSource(path, label, sourceRoot) {
  return `<a target="_blank" rel="noreferrer" href="${sourceRoot}${path}">${edgeEscape(label)} ↗</a>`;
}

function renderDeploymentChecklist(sourceRoot) {
  return `<div class="deployment-guide">
    <h4>Linux＋NVIDIA RTX 5090：上機前先確認</h4>
    <p>RTX 5090 是 compute capability 12.0（sm_120）。<a href="https://developer.nvidia.com/cuda/gpus" target="_blank" rel="noreferrer">NVIDIA 架構表</a>；
    PyTorch 2.7 起提供 Blackwell／CUDA 12.8 支援，這是支援起點，不是建議照裝舊版。
    <a href="https://pytorch.org/blog/pytorch-2-7/" target="_blank" rel="noreferrer">PyTorch 官方說明</a>。</p>
    <p>固定版 RadEval README 列出的 known-good 組合包含 Python 3.11、torch 2.9.1+cu128、transformers 5.6.2、tokenizers 0.22.2。這是上游測試紀錄，<strong>不是已替你的 5090 驗收</strong>。先用團隊核准套件來源建立隔離環境，再檢查 driver、CUDA wheel 與其他套件相容性；不要沿用舊 GPU 的環境或只升級系統 CUDA。 ${pitfallSource("README.md", "上游環境紀錄", sourceRoot)}</p>
    <p><strong>執行順序：</strong>環境檢查 → GPU 小運算 → 每個 encoder／classifier 單獨實跑 → GREEN／CRIMSON 單獨實跑 → 確認資料可外傳後才啟用 API。先不用額外加速套件；GPU 小運算成功也不能證明所有 attention kernels、模型與 dtype 都相容。</p>
    <p>RadEval 會先初始化所有選定模型；請把各指標放在獨立程序依序測，特別是 GREEN 7B 與 CRIMSON HF。先測可用顯存與代表性最長報告，再逐步增加 batch；避免一次建立全部 16 個 scorer。</p>
    <div class="code-panel"><div class="code-head"><strong>Linux：先查看顯卡／driver 與套件一致性</strong><button class="copy-code" type="button" data-copy-code aria-live="polite">複製程式</button></div><pre><code>nvidia-smi
python -m pip check</code></pre></div>
    <div class="code-panel"><div class="code-head"><strong>Python：5090 小運算檢查（不含病人資料）</strong><button class="copy-code" type="button" data-copy-code aria-live="polite">複製程式</button></div><pre><code>${edgeEscape(linux5090Probe)}</code></pre></div>
    <p class="boundary-status">本次沒有連線到你的 Linux／5090，也未執行這段 GPU 程式。實際 driver、GPU 數量、可用顯存與 API 外傳權限仍待你們確認。</p>
  </div>`;
}

function renderRunChecklist(sourceRoot) {
  return `<div class="run-checklist">
    <p class="boundary-status">固定版原始碼核對＋部署建議。下列不是自動保證安全的驗證器；請把驗收結果記錄進團隊的 run manifest。</p>
    ${commonRunChecks.map(([title, risk, action, path, symbol]) => `<details class="pitfall-card">
      <summary>${edgeEscape(title)}</summary>
      <dl><dt>會踩的坑</dt><dd>${edgeEscape(risk)}</dd><dt>避坑做法</dt><dd>${edgeEscape(action)}</dd></dl>
      <div class="runtime-sources">${pitfallSource(path, symbol, sourceRoot)}</div>
    </details>`).join("")}
    <details class="pitfall-card"><summary>Linux／RTX 5090 的環境與顯存驗收</summary>${renderDeploymentChecklist(sourceRoot)}</details>
  </div>`;
}

function renderPitfalls(id, sourceRoot) {
  const rows = operationalPitfalls[id];
  if (!rows) return '<p class="boundary-status">此指標尚未完成實戰避坑核對，請勿套用其他指標的規則。</p>';
  const probes = {"bleu": [0], "green": [1], "radgraph-radcliq": [1], "mammo-green": [1]};
  return `<p class="boundary-status">本指標 ${rows.length} 個實戰風險。每項都有「做法＋驗收」；原始碼核對不代表已在你的硬體上跑過模型。</p>
    ${rows.map(([title, risk, action, check, path, symbol], i) => `<details class="pitfall-card" ${i === 0 ? "open" : ""}>
      <summary>${i + 1}. ${edgeEscape(title)}</summary>
      <div class="pitfall-evidence">${(probes[id] || []).includes(i) ? "已核對原始碼，並做無模型局部測試" : "原始碼核對；部署驗收仍需實跑"}</div>
      <dl><dt>會發生什麼</dt><dd>${edgeEscape(risk)}</dd><dt>避坑做法</dt><dd>${edgeEscape(action)}</dd><dt>跑完檢查</dt><dd>${edgeEscape(check)}</dd></dl>
      <div class="runtime-sources">${pitfallSource("radeval/metrics/" + path, symbol, sourceRoot)}${id === "srrbert" && i < 2 ? pitfallSource("radeval/utils.py", "逐筆 helper：multilabel_prf_per_sample", sourceRoot) : ""}</div>
    </details>`).join("")}
    <details class="shared-comparisons"><summary>通用執行檢查＋Linux／RTX 5090 部署清單</summary>${renderRunChecklist(sourceRoot)}</details>`;
}
