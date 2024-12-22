require("dotenv").config();
const { Client, GatewayIntentBits } = require("discord.js");

const { bannedWords, welcomeMessages } = require("./constants.js");

const client = new Client({
   intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
   ],
});

async function isBanned(message) {
   // Convert to lower case
   const messageContent = message.content.toLowerCase();

   const containsBannedWord = bannedWords.some(word => messageContent.includes(word));

   if (containsBannedWord) {
      await message.author.send({
         content: "Your message contains a word that is banned from this server",
      });
      message.delete().catch(console.error);
   };
};

function mentions(message) {
   // Count the mentions
   const mentionCount = message.mentions.users.size + message.mentions.roles.size;

   if (mentionCount > 2) {
      message.reply("Too many mentions! 😡😡");
      message.delete().catch(console.error);
   };  
};

const messageRate = new Map();
const userMessages = new Map();

async function detectSpam(message) {
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
};

const linkRegex = /https?:\/\/[^\s]+/;

async function isLink(message) {
   if (linkRegex.test(message.content)) {
      await message.reply("Links are not allowed in this channel");
      message.delete().catch(console.error);
   };
};

client.on("messageCreate", (message) => {
   if (message.author.bot) return;

   isBanned(message);
   mentions(message);
   detectSpam(message);
   isLink(message);
});

client.on("guildMemberAdd", async (member) => {
   console.log(`${member.user.tag} has joined the server!`);

   // find the welcome channel
   const welcomeChannel = member.guild.channels.cache.find(channel => channel.name === "welcome");

   if (welcomeChannel) {
      const randomWelcomeMessageIndex = Math.floor(Math.random() * welcomeMessages.length);

      welcomeChannel.send(
         `Welcome to the server ${member.user}. ${welcomeMessages[randomWelcomeMessageIndex]}`,
      );
   };
});

client.login(process.env.DISCORD_TOKEN);
