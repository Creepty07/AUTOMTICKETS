import { ChannelType } from 'discord.js';
import { SUPPORT_CATEGORY, ADMIN_ROLE } from './config.js';

export function initializeBot(client) {
  client.guilds.cache.forEach(async (guild) => {
    let category = guild.channels.cache.find(c => c.name === SUPPORT_CATEGORY && c.type === ChannelType.GuildCategory);
    if (!category) {
      await guild.channels.create({
        name: SUPPORT_CATEGORY,
        type: ChannelType.GuildCategory,
      });
    }
  });
}

export async function sendTemplateQuestions(channel) {
  const questions = [
    "What issue are you experiencing?",
    "When did the issue start?",
    "Have you tried any solutions so far?",
  ];

  for (const question of questions) {
    await channel.send(question);
  }
}

export async function notifyAdmins(channel) {
  const adminRole = channel.guild.roles.cache.find(role => role.name === ADMIN_ROLE);
  if (adminRole) {
    await channel.send(`${adminRole} This ticket requires immediate attention.`);
  }
}

export async function closeTicket(channel) {
  await channel.send("This ticket is now closed. If you need further assistance, please create a new ticket.");
  await channel.delete();
  tickets.delete(channel.id);
}

