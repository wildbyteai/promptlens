# PromptLens

<p align="center">
  <img src="./docs/assets/banner.svg" alt="PromptLens 橫幅" />
</p>

<p align="center">
  圖片反推提示詞 Chrome 擴充功能：支援圖片轉提示詞、AI 識圖生成提示詞和視覺行銷診斷。
</p>

<p align="center">
  <a href="./README.md">English</a> · <a href="./README.zh-CN.md">简体中文</a> · 繁體中文
</p>

<p align="center">
  <img src="https://img.shields.io/github/license/wildbyteai/promptlens" alt="License" />
  <img src="https://img.shields.io/badge/Chrome-MV3-4285F4" alt="Chrome MV3" />
  <img src="https://img.shields.io/badge/backend-none-22c55e" alt="無需後端" />
  <img src="https://img.shields.io/badge/build-none-7c3aed" alt="無需建置" />
</p>

PromptLens 是一個輕量級 Chrome MV3 圖片反推提示詞工具，也可以作為圖片轉提示詞、AI 識圖生成提示詞和商業視覺診斷工作流使用。它會把網頁圖片或框選截圖傳送到你自己設定的 OpenAI-compatible Vision API，並產生可複製到 Midjourney、Stable Diffusion 或其他圖像生成工具中的提示詞。

它的目標是提供一個簡單、透明、可自託管思路的圖片提示詞反推工具：不登入、不付費、不內建後端、不綁定特定模型服務。

## 功能

- **右鍵圖片分析**：在網頁圖片上按右鍵，產生反向圖片提示詞。
- **框選截圖分析**：對目前可見頁面區域框選截圖並分析，適合 `blob:` 圖片、防盜鏈圖片或未授權遠端圖片。
- **自訂模型服務**：自行設定 AI Base URL、API Key 和 Model。
- **OpenAI-compatible Vision API**：請求格式相容 `/chat/completions` 的視覺模型介面。
- **結構化結果**：輸出中文提示詞、English Prompt、Tags、Negative Prompt、JSON Prompt 和 Raw JSON。
- **內建輸出模板**：提供詳細分析、自然語言、標籤加權、快速複製和視覺行銷診斷等輸出格式。
- **視覺行銷診斷**：面向商業視覺圖的可選業務分析，輸出老闆摘要、行銷診斷、低成本改編 brief 和可發布 Markdown 案例初稿。
- **自訂模板**：支援複製內建模板、新建、編輯、刪除、匯入和匯出自訂模板。
- **ChatGPT Plus 輔助模式**：適合有 ChatGPT Plus / Pro 但沒有 API Key 的使用者；PromptLens 準備圖片和指令，並可打開 ChatGPT、等待頁面穩定後嘗試附加圖片並填入指令，供你確認後手動送出。
- **Provider 預設**：提供 OpenAI、DeepSeek、Alibaba、SiliconFlow、Groq、OpenRouter、Ollama 和 Custom。
- **快捷鍵框選**：支援 `Alt+Shift+S` 觸發框選截圖，可在 `chrome://extensions/shortcuts` 修改。
- **可選本機歷史記錄**：預設關閉；開啟後儲存文字結果、來源網域、原始圖片 URL、頁面 URL 和模板資訊，不儲存圖片縮圖。
- **結果匯出**：支援複製單項、複製全部、下載 JSON 和下載 Markdown。
- **本機優先**：設定保存在瀏覽器本機，不使用遠端帳號系統。
- **純前端實作**：無 npm 依賴、無建置步驟、無後端服務。

## 不包含

PromptLens 刻意不包含以下能力：

- 登入 / OAuth
- 付款 / 額度系統
- 內建雲端服務 / Supabase
- 雲端歷史記錄
- 自動填入第三方生成器網站
- 團隊協作或帳號同步
- 廣告帳戶自動化、投放出價建議或轉換效果保證

## 工作原理

1. 使用者在網頁中右鍵圖片，或啟動框選截圖。
2. 擴充功能讀取圖片 URL、data URL 或目前分頁可見截圖。
3. 圖片會在本機被校驗、裁切、壓縮，並統一轉換為 JPEG。
4. 結果頁按選定模板呼叫使用者設定的 OpenAI-compatible Vision API。
5. 模型返回 JSON 後，結果頁展示並提供複製、JSON 下載和 Markdown 下載。

PromptLens 提供兩種分析路徑：API 自動分析會呼叫你設定的 OpenAI-compatible Vision API 並展示結構化結果；ChatGPT Plus 輔助模式不呼叫 API，而是在本機產生 JPEG 圖片和 ChatGPT 指令，供你在 chatgpt.com 使用。實驗性 ChatGPT 交接可打開 ChatGPT，等待 ChatGPT 頁面穩定後嘗試附加圖片並填入指令，但不會自動送出訊息。

PromptLens 不提供內建模型服務。你需要自行準備支援視覺輸入的 API 服務。

<p align="center">
  <img src="./docs/assets/workflow.svg" alt="PromptLens 工作流程" />
</p>

## 安裝

### 從原始碼載入

1. 下載或 clone 本倉庫。
2. 打開 Chrome。
3. 進入 `chrome://extensions`。
4. 開啟「開發人員模式」。
5. 點擊「載入未封裝項目」。
6. 選擇倉庫根目錄。

### Chrome Web Store

尚未發布。後續如發布到 Chrome Web Store，會在這裡補充連結。

## 設定

1. 在 Chrome 擴充功能詳情頁點擊「擴充功能選項」。
2. 填寫：
   - **AI Base URL**：例如 `https://api.openai.com/v1`。
   - **API Key**：你的模型服務密鑰。
   - **Model**：支援視覺輸入的模型名稱。
   - **預設輸出模板**：詳細分析、自然語言、標籤加權或快速複製。
3. 點擊「儲存設定」。
4. 如需直接右鍵分析任意網站的遠端圖片，點擊「授權圖片讀取權限」。

說明：

- AI Base URL 必須使用 HTTPS。
- 本機開發允許 `http://localhost` 和 `http://127.0.0.1`。
- 如果不授權所有網站圖片讀取權限，仍可使用「框選截圖並分析」。

## 使用

### 分析網頁圖片

1. 在網頁圖片上按右鍵。
2. 選擇「分析這張圖片」。
3. 新分頁會打開結果頁並顯示分析進度。
4. 分析完成後複製需要的提示詞。

如果頁面提示沒有圖片讀取權限，可以先到設定頁授權，或改用框選截圖。

### 框選截圖分析

1. 在網頁任意位置按右鍵。
2. 選擇「框選截圖並分析」。
3. 拖曳選擇目前可見區域。
4. 等待結果頁產生提示詞。

按 Esc 或點擊取消按鈕可以退出框選。

## 首次成功路徑

PromptLens v0.6 優先幫助使用者完成 API 自動分析，或在沒有 API Key 時完成 ChatGPT Plus 輔助流程：

1. 開啟設定頁。
2. 設定你自己的 OpenAI-compatible Vision API：Provider/Base URL、API Key，以及支援圖片輸入的模型。
3. 儲存設定。
4. 透過右鍵網頁圖片開始分析；如果站點權限或遠端圖片讀取受限，使用框選截圖。
5. 複製 Prompt、Tags 或專業變體，或在視覺行銷診斷模板中匯出 Markdown Brief。

PromptLens 不提供模型服務、後端、代理、遙測、帳號系統或雲端分享。分析請求會從你的瀏覽器傳送到你設定的 Base URL。

## 截圖

| 右鍵選單 | 設定頁 |
| --- | --- |
| <img src="./docs/assets/promptlens-context-menu.png" alt="PromptLens 右鍵選單" /> | <img src="./docs/assets/promptlens-options.png" alt="PromptLens 設定頁" /> |

| 分析結果 |
| --- |
| <img src="./docs/assets/promptlens-result.png" alt="PromptLens 分析結果頁" /> |

## 隱私與安全

PromptLens 的隱私邊界很簡單：

- API Key 儲存在瀏覽器本機 `chrome.storage.local`。
- 圖片只傳送到你設定的 AI Base URL。
- 擴充功能本身不包含後端服務，不收集遙測。
- 歷史記錄預設關閉；開啟後只保存在瀏覽器本機，會儲存來源圖片/頁面 URL 以便回溯，且不儲存圖片縮圖。
- 遠端圖片讀取權限是可選權限，不會在安裝時請求。
- 框選截圖使用 `activeTab` 權限，僅在使用者觸發時存取目前分頁。

實驗性 ChatGPT 交接：點擊 **嘗試傳送到 ChatGPT** 時，PromptLens 可能請求可選的 `https://chatgpt.com/*` 權限。該權限只用於打開 ChatGPT、等待頁面穩定，並嘗試把本機準備好的 JPEG 和分析指令填入 ChatGPT 頁面。PromptLens 不會自動送出訊息，不會讀取 ChatGPT 回覆；如果頁面無法接收圖片或指令，仍可回退到手動下載圖片和複製指令。

請注意：當你使用第三方模型服務時，圖片和提示詞會傳送給該服務。請自行確認服務商的隱私政策、資料保留策略和模型使用條款。

更多安全說明見 [SECURITY.md](SECURITY.md)。

## 權限說明

`manifest.json` 中使用的權限：

- `contextMenus`：建立右鍵選單。
- `storage`：儲存模型設定、目前模板和臨時輸入。
- `activeTab`：使用者觸發框選截圖時存取目前分頁。
- `scripting`：注入框選截圖腳本和樣式。
- `commands`：註冊框選截圖快捷鍵。
- `optional_host_permissions: ["<all_urls>"]`：按需請求遠端圖片讀取權限和 API origin 存取權限。

## 圖片格式支援

- 支援：PNG、JPEG、WebP。
- 不支援：SVG。
- 不支援直接讀取：`blob:` 圖片，請使用框選截圖。
- 遠端圖片檔案大小上限：20MB。
- 傳送給模型前會統一轉為 JPEG。

## 開發

本專案刻意保持簡單：

```text
manifest.json      Chrome MV3 manifest
background.js      右鍵選單、截圖、臨時 payload 中轉
content.js         頁面內框選截圖互動
selection.css      僅注入網頁的框選樣式
options.html/js    設定頁
history-store.js   本機歷史記錄 IndexedDB helper
history.html/js    本機歷史記錄頁面
templates.js       內建 / 自訂模板和固定 JSON 輸出要求
result.html/js     結果頁、匯出、歷史儲存與模型呼叫
styles.css         設定頁和結果頁樣式
```

本機檢查：

```bash
node --check background.js
node --check content.js
node --check templates.js
node --check history-store.js
node --check history.js
node --check options.js
node --check result.js
```

開發原則：

- 不引入建置工具。
- 不引入 npm 依賴。
- 不引入遠端資源。
- 保持 Vanilla JavaScript / CSS。
- 新功能優先保持本機優先和隱私透明。

## 路線圖狀態

目前分支已落地到 v0.6.0：首次成功引導、更清楚的 Provider 設定說明、結果頁下一步提示、行銷業務背景範例、視覺行銷診斷、Warm Studio 視覺升級、摘要式歷史卡片、內建 / 自訂模板、Provider 預設、快捷鍵、結果匯出、Token usage、可選本機歷史記錄、基礎 i18n、Chrome Web Store 發布準備、面向無 API Key 工作流的 ChatGPT Plus 輔助模式，以及在使用者按需授權後可打開 ChatGPT、等待頁面穩定並嘗試附加圖片和填入指令的實驗性 ChatGPT 交接。

後續仍保留為回饋驅動的方向：

- 更完整的英文 / 繁體中文介面翻譯。
- Firefox MV3 相容性調研。
- 根據真實回饋繼續調整圖片預處理預設值。

## 貢獻

歡迎提交 issue 和 pull request。請先閱讀 [CONTRIBUTING.md](CONTRIBUTING.md)。

## License

MIT License. See [LICENSE](LICENSE).
