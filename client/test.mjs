import { Client } from "./node_modules/@modelcontextprotocol/sdk/dist/esm/client/index.js";
import { StdioClientTransport } from "./node_modules/@modelcontextprotocol/sdk/dist/esm/client/stdio.js";

console.log("開始測試...");

async function runTest() {
  try {
    // 創建 transport
    const transport = new StdioClientTransport({
      command: "C:\\Windows\\System32\\cmd.exe",
      args: ["/c", "npx", "@modelcontextprotocol/server-puppeteer"],
    });

    console.log("已創建 transport");

    // 創建客戶端
    const client = new Client(
      {
        name: "mcp-test-client",
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
    await client.connect(transport);
    console.log("已連接到服務器");

    // 導航到 Google
    console.log("嘗試導航到 Google...");
    await client.callTool({
      name: "puppeteer_navigate",
      arguments: {
        url: "https://www.google.com",
      },
    });
    console.log("成功導航到 Google！");

    // 截取屏幕截圖
    console.log("嘗試截取屏幕截圖...");
    await client.callTool({
      name: "puppeteer_screenshot",
      arguments: {
        name: "screen_shots/google_homepage",
      },
    });
    console.log("成功截取屏幕截圖！");

    console.log("測試完成！");
  } catch (error) {
    console.error("測試失敗:", error);
  }
}

// 執行測試
console.log("執行測試函數...");
runTest().then(() => console.log("測試函數執行完畢"));
