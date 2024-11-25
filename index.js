import { Client, GatewayIntentBits } from 'discord.js';
import dotenv from 'dotenv';
import { handleMessage } from './ticketManager.js';
import { initializeBot } from './utils.js';

// Load environment variables
dotenv.config({path: './token.env'});

// Create a new Discord client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// Bot ready event
client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
  initializeBot(client);
});

// Message event handler
client.on('messageCreate', handleMessage);

// Login to Discord
client.login(process.env.DISCORD_TOKEN);

