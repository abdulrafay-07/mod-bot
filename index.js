require("dotenv").config();
const { Client, GatewayIntentBits, userMention } = require("discord.js");

const { bannedWords } = require("./constants.js");

const client = new Client({
   intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
   ],
});

// Banned words
client.on("messageCreate", async (message) => {
   if (message.author.bot) return;

   // Convert to lower case
   const messageContent = message.content.toLowerCase();

   const containsBannedWord = bannedWords.some(word => messageContent.includes(word));

   if (containsBannedWord) {
      await message.author.send({
         content: "Your message contains a word that is banned from this server",
      });
      message.delete().catch(console.error);
   };
});

// Mentions
client.on("messageCreate", (message) => {
   if (message.author.bot) return;

   // Count the mentions
   const mentionCount = message.mentions.users.size + message.mentions.roles.size;

   if (mentionCount > 2) {
      message.reply("Too many mentions! 😡😡");
      message.delete().catch(console.error);
   };
});

// Fast message sending
const messageRate = new Map();
const userMessages = new Map();

client.on("messageCreate", async (message) => {
   if (message.author.bot) return;

   const now = Date.now();
   const userId = message.author.id;

   if (!userMessages.has(userId)) {
      userMessages.set(userId, []);
   };

   const userMessageHistory = userMessages.get(userId);

   userMessageHistory.push({ message, timestamp: now });

   // Keep only the last 10 messages
   if (userMessageHistory.length > 6) {
      userMessageHistory.shift(); // Remove the oldest message
   };

   // Check if the user has sent more than 5 messages within 10 seconds
   const recentMessages = userMessageHistory.filter(msg => now - msg.timestamp <= 10000);

   if (recentMessages.length > 4) {
      for (const { message } of recentMessages) {
         await message.delete().catch(console.error);
      };

      await message.channel.send({
         content: `${message.author}, You are sending messages too quickly. Slow down 😡😡`,
      });
   };

   messageRate.set(userId, { count: recentMessages.length, lastMessageTime: now });
});

// Detect if user sends a link
const linkRegex = /https?:\/\/[^\s]+/;

client.on("messageCreate", async (message) => {
   if (message.author.bot) return;

   if (linkRegex.test(message.content)) {
      await message.reply("Links are not allowed in this channel");
      message.delete().catch(console.error);
   };
})

client.login(process.env.DISCORD_TOKEN);
