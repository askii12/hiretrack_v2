import "dotenv/config";
import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = join(__dirname, "..", ".env");
const token = process.env.TELEGRAM_BOT_TOKEN;

if (!token) {
  console.error("TELEGRAM_BOT_TOKEN is missing in .env");
  process.exit(1);
}

const response = await fetch(`https://api.telegram.org/bot${token}/getUpdates`);
const data = await response.json();

if (!data.ok) {
  console.error("Telegram API error:", data);
  process.exit(1);
}

const chatIds = new Set();
for (const update of data.result || []) {
  const chat = update.message?.chat || update.my_chat_member?.chat;
  if (chat?.id) {
    chatIds.add(chat.id);
  }
}

if (chatIds.size === 0) {
  console.log("\nNo messages yet.\n");
  console.log("1. Open your bot in Telegram");
  console.log("2. Press Start (or send /start)");
  console.log("3. Run again: npm run telegram:chat-id\n");
  process.exit(1);
}

const chatId = [...chatIds].at(-1);
let env = readFileSync(envPath, "utf8");

if (/^TELEGRAM_CHAT_ID=.*/m.test(env)) {
  env = env.replace(/^TELEGRAM_CHAT_ID=.*/m, `TELEGRAM_CHAT_ID=${chatId}`);
} else {
  env += `\nTELEGRAM_CHAT_ID=${chatId}\n`;
}

writeFileSync(envPath, env);

const test = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    chat_id: chatId,
    text: "HireTrack: Telegram notifications are connected.",
  }),
});

const testData = await test.json();
if (testData.ok) {
  console.log(`TELEGRAM_CHAT_ID=${chatId} saved to .env`);
  console.log("Test message sent successfully.");
} else {
  console.log(`TELEGRAM_CHAT_ID=${chatId} saved to .env`);
  console.warn("Could not send test message:", testData.description);
  console.warn("Make sure you pressed Start on your bot in Telegram.");
}
