# MCP (Model Context Protocol) 客戶端

## 簡介
MCP 是一個與 OpenAI API 整合的客戶端工具，基於 Model Context Protocol 實現。此工具提供了一個直觀的介面，用於與 OpenAI 的大型語言模型進行互動。

## 功能特點
- OpenAI API 整合
- 命令行互動界面
- 模型上下文管理
- 高效的 API 調用
- 靈活的配置選項
- 完整的錯誤處理

## 系統需求
- Node.js 18.0 或更高版本
- Windows/Linux/MacOS 作業系統
- 穩定的網路連接
- OpenAI API 密鑰

## 安裝說明
1. 克隆此儲存庫：
```bash
git clone https://github.com/x5427876/mcp.git
cd mcp
```

2. 安裝依賴：
```bash
npm install
cd client
npm install
```

3. 配置環境：
```bash
cp client/.env.example client/.env
```
然後編輯 `.env` 文件，添加您的 OpenAI API 密鑰。

4. 啟動應用程式：
```bash
cd client
npm start
```

## 配置
1. 在 `client/.env` 文件中設置您的 OpenAI API 密鑰
2. 根據需要調整其他配置選項

## 使用方法
1. 啟動客戶端應用程式
2. 通過命令行界面輸入提示
3. 查看 AI 模型的回應

## 專案結構
- `client/`: 包含主要客戶端代碼
- `server/`: 包含伺服器端組件
  - `puppeteer/`: 瀏覽器自動化相關代碼
  - `fetch/`: 數據獲取相關代碼

## 貢獻指南
歡迎提交 Pull Requests 來改進此專案。請確保：
- 遵循現有的代碼風格
- 添加適當的測試
- 更新相關文檔

## 授權
本專案採用 MIT 授權條款 - 詳情請見 [LICENSE](LICENSE) 文件

## 聯絡方式
如有任何問題或建議，請開啟 Issue