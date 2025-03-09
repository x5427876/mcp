import * as dotenv from "dotenv";
import OpenAI from "openai";
import readline from "readline";
import { Client } from "./node_modules/@modelcontextprotocol/sdk/dist/esm/client/index.js";
import { StdioClientTransport } from "./node_modules/@modelcontextprotocol/sdk/dist/esm/client/stdio.js";

// =====================================================================
// 配置和初始化
// =====================================================================

// 載入環境變數
dotenv.config();

// 檢查 API key 是否存在
if (!process.env.OPENAI_API_KEY) {
  console.error("錯誤：未設置 OPENAI_API_KEY 環境變數");
  console.error("請在 .env 文件中設置您的 API key");
  process.exit(1);
}

// 創建 OpenAI 客戶端
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 創建命令行界面
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// 初始化對話歷史
const conversationHistory = [
  {
    role: "system",
    content: "你是一個有用的助手，可以通過瀏覽器和網絡請求幫助用戶完成任務。",
  },
];

// =====================================================================
// 工具定義
// =====================================================================

/**
 * 所有可用工具的定義
 * 這些工具將提供給 OpenAI API，讓 AI 助手可以使用它們
 */
const availableTools = [
  // 網頁內容獲取工具
  {
    type: "function",
    function: {
      name: "fetch",
      description: "獲取網頁內容，將 HTML 轉換為易於閱讀的格式",
      parameters: {
        type: "object",
        properties: {
          url: {
            type: "string",
            description: "要獲取內容的 URL",
          },
          max_length: {
            type: "integer",
            description: "返回的最大字符數（默認：5000）",
          },
          start_index: {
            type: "integer",
            description: "返回內容的起始索引（默認：0）",
          },
          raw: {
            type: "boolean",
            description: "是否返回原始 HTML 而不是處理後的內容（默認：false）",
          },
        },
        required: ["url"],
      },
    },
  },

  // 瀏覽器導航工具
  {
    type: "function",
    function: {
      name: "puppeteer_navigate",
      description: "在瀏覽器中導航到指定 URL",
      parameters: {
        type: "object",
        properties: {
          url: {
            type: "string",
            description: "要導航到的 URL",
          },
        },
        required: ["url"],
      },
    },
  },

  // 截圖工具
  {
    type: "function",
    function: {
      name: "puppeteer_screenshot",
      description: "對當前頁面或指定元素進行截圖",
      parameters: {
        type: "object",
        properties: {
          name: {
            type: "string",
            description: "截圖的名稱",
          },
          selector: {
            type: "string",
            description: "要截圖的元素的 CSS 選擇器",
          },
          width: {
            type: "number",
            description: "截圖寬度（像素，默認：800）",
          },
          height: {
            type: "number",
            description: "截圖高度（像素，默認：600）",
          },
        },
        required: ["name"],
      },
    },
  },

  // 點擊元素工具
  {
    type: "function",
    function: {
      name: "puppeteer_click",
      description: "點擊頁面上的元素",
      parameters: {
        type: "object",
        properties: {
          selector: {
            type: "string",
            description: "要點擊的元素的 CSS 選擇器",
          },
        },
        required: ["selector"],
      },
    },
  },

  // 填寫表單工具
  {
    type: "function",
    function: {
      name: "puppeteer_fill",
      description: "填寫輸入字段",
      parameters: {
        type: "object",
        properties: {
          selector: {
            type: "string",
            description: "輸入字段的 CSS 選擇器",
          },
          value: {
            type: "string",
            description: "要填寫的值",
          },
        },
        required: ["selector", "value"],
      },
    },
  },

  // 選擇下拉選項工具
  {
    type: "function",
    function: {
      name: "puppeteer_select",
      description: "在下拉選擇元素中選擇一個選項",
      parameters: {
        type: "object",
        properties: {
          selector: {
            type: "string",
            description: "選擇元素的 CSS 選擇器",
          },
          value: {
            type: "string",
            description: "要選擇的值",
          },
        },
        required: ["selector", "value"],
      },
    },
  },

  // 懸停工具
  {
    type: "function",
    function: {
      name: "puppeteer_hover",
      description: "懸停在元素上",
      parameters: {
        type: "object",
        properties: {
          selector: {
            type: "string",
            description: "要懸停的元素的 CSS 選擇器",
          },
        },
        required: ["selector"],
      },
    },
  },

  // JavaScript 執行工具
  {
    type: "function",
    function: {
      name: "puppeteer_evaluate",
      description: "在瀏覽器中執行 JavaScript 代碼",
      parameters: {
        type: "object",
        properties: {
          script: {
            type: "string",
            description: "要執行的 JavaScript 代碼",
          },
        },
        required: ["script"],
      },
    },
  },
];

// =====================================================================
// 輔助函數
// =====================================================================

/**
 * 處理 AI 助手的工具調用
 * @param {Array} toolCalls - AI 助手的工具調用
 * @param {Client} fetchClient - Fetch 客戶端
 * @param {Client} puppeteerClient - Puppeteer 客戶端
 * @returns {Array} - 工具調用結果
 */
async function processToolCalls(toolCalls, fetchClient, puppeteerClient) {
  const toolResults = [];

  for (const toolCall of toolCalls) {
    const functionName = toolCall.function.name;
    const functionArgs = JSON.parse(toolCall.function.arguments);

    try {
      let result;
      // 根據工具名稱前綴決定使用哪個客戶端
      if (functionName === "fetch") {
        console.log(`調用 fetch 工具: ${functionName}`);
        result = await fetchClient.callTool({
          name: functionName,
          arguments: functionArgs,
        });
      } else if (functionName.startsWith("puppeteer_")) {
        console.log(`調用 puppeteer 工具: ${functionName}`);
        result = await puppeteerClient.callTool({
          name: functionName,
          arguments: functionArgs,
        });
      } else {
        throw new Error(`未知的工具: ${functionName}`);
      }

      toolResults.push({
        role: "tool",
        tool_call_id: toolCall.id,
        content: JSON.stringify(result),
      });
    } catch (error) {
      console.error(`工具調用錯誤 (${functionName}):`, error.message);
      toolResults.push({
        role: "tool",
        tool_call_id: toolCall.id,
        content: JSON.stringify({ error: error.message }),
      });
    }
  }

  return toolResults;
}

// =====================================================================
// 主要對話循環
// =====================================================================

/**
 * 主要對話循環
 * 處理用戶輸入，調用 OpenAI API，執行工具調用
 */
async function chat() {
  try {
    // 創建 MCP 客戶端
    console.log("正在初始化 MCP 客戶端...");

    // 創建 transport
    const puppeteerTransport = new StdioClientTransport({
      command: "C:\\Windows\\System32\\cmd.exe",
      args: ["/c", "npx", "@modelcontextprotocol/server-puppeteer"],
    });

    const fetchTransport = new StdioClientTransport({
      command: "C:\\Windows\\System32\\cmd.exe",
      args: ["/c", "uvx", "mcp-server-fetch", "--ignore-robots-txt"],
    });

    console.log("已創建 transport");

    // 創建客戶端
    const puppeteerClient = new Client(
      {
        name: "mcp-chat-puppeteer-client",
        version: "1.0.0",
      },
      {
        capabilities: {
          prompts: {},
          resources: {},
          tools: {},
        },
      }
    );

    const fetchClient = new Client(
      {
        name: "mcp-chat-fetch-client",
        version: "1.0.0",
      },
      {
        capabilities: {
          prompts: {},
          resources: {},
          tools: {},
        },
      }
    );

    console.log("已創建客戶端");

    // 連接到服務器
    await puppeteerClient.connect(puppeteerTransport);
    await fetchClient.connect(fetchTransport);
    console.log("已連接到服務器");

    // 開始對話循環
    console.log('歡迎使用 MCP 客戶端！輸入 "exit" 退出。');
    console.log("---------------------------------------------");

    // 主循環：處理用戶輸入
    while (true) {
      // 獲取用戶輸入
      const userInput = await new Promise((resolve) => {
        rl.question("你: ", resolve);
      });

      // 檢查是否退出
      if (userInput.toLowerCase() === "exit") {
        console.log("再見！");
        break;
      }

      console.log("AI 正在思考...");

      // 添加用戶消息到對話歷史
      let currentMessage = { role: "user", content: userInput };
      conversationHistory.push(currentMessage);

      // 對話回合循環
      while (true) {
        // 調用 OpenAI API
        const completion = await openai.chat.completions.create({
          model: "o3-mini-2025-01-31",
          messages: conversationHistory,
          tools: availableTools,
          tool_choice: "auto",
        });

        // 獲取 AI 助手的回應
        const assistantMessage = completion.choices[0].message;
        conversationHistory.push(assistantMessage);

        // 如果沒有工具調用，結束對話回合
        if (!assistantMessage.tool_calls) {
          console.log(`AI: ${assistantMessage.content}`);
          break;
        }

        // 處理工具調用
        const toolResults = await processToolCalls(
          assistantMessage.tool_calls,
          fetchClient,
          puppeteerClient
        );

        // 添加工具調用結果到對話歷史
        conversationHistory.push(...toolResults);
        console.log("AI: (執行了操作)");
      }

      // 在每個對話結束後添加分隔線
      console.log("---------------------------------------------");
    }
  } catch (error) {
    console.error("發生錯誤:", error);
  } finally {
    rl.close();
  }
}

// 啟動對話
chat();
