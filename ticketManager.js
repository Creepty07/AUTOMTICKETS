import { ChannelType, PermissionFlagsBits } from 'discord.js';
import { analyzeMessage, getAIResponse } from './aiHandler.js';
import { SUPPORT_CATEGORY, SUPPORT_ROLE, ADMIN_ROLE, TICKET_TIMEOUT, CLOSE_TIMEOUT } from './config.js';
import { sendTemplateQuestions, notifyAdmins, closeTicket } from './utils.js';

// In-memory storage for tickets
const tickets = new Map();

export async function handleMessage(message) {
  if (message.author.bot) return;

  if (message.content.toLowerCase() === '!ticket') {
    await createTicket(message);
  } else if (message.channel.name?.startsWith('ticket-') && message.content.toLowerCase() === '!close') {
    await closeTicket(message.channel);
  } else if (message.channel.name?.startsWith('ticket-')) {
    await handleTicketMessage(message);
  }
}

async function createTicket(message) {
  // Check if user already has an open ticket
  if (Array.from(tickets.values()).some(ticket => ticket.userId === message.author.id)) {
    return message.reply("You already have an open ticket. Please close it before creating a new one.");
  }

  // Create or get the support category
  let category = message.guild.channels.cache.find(c => c.name === SUPPORT_CATEGORY && c.type === ChannelType.GuildCategory);
  if (!category) {
    category = await message.guild.channels.create({
      name: SUPPORT_CATEGORY,
      type: ChannelType.GuildCategory,
    });
  }

  // Create the ticket channel
  const ticketChannel = await message.guild.channels.create({
    name: `ticket-${message.author.username}`,
    type: ChannelType.GuildText,
    parent: category,
    permissionOverwrites: [
      {
        id: message.guild.id,
        deny: [PermissionFlagsBits.ViewChannel],
      },
      {
        id: message.author.id,
        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
      },
      {
        id: message.client.user.id,
        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
      },
      {
        id: message.guild.roles.cache.find(r => r.name === SUPPORT_ROLE)?.id,
        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
      },
    ],
  });

  // Store ticket information
  tickets.set(ticketChannel.id, {
    userId: message.author.id,
    channelId: ticketChannel.id,
    createdAt: Date.now(),
    lastActivity: Date.now(),
  });

  // Send template questions
  await sendTemplateQuestions(ticketChannel);

  message.reply(`Your ticket has been created in ${ticketChannel}. Please answer the questions there.`);

  // Set up inactivity check
  setTimeout(() => checkInactivity(ticketChannel), TICKET_TIMEOUT);
}

async function handleTicketMessage(message) {
  const ticket = tickets.get(message.channel.id);
  if (!ticket) return;

  // Update last activity
  ticket.lastActivity = Date.now();

  // Analyze message for priority
  const priority = await analyzeMessage(message.content);

  // Get AI response
  const aiResponse = await getAIResponse(message.content);

  // Send AI response
  if (aiResponse) {
    await message.channel.send(`AI Suggestion: ${aiResponse}`);
  }

  // Notify admins if high priority
  if (priority === 'high') {
    await notifyAdmins(message.channel);
  }
}

async function checkInactivity(channel) {
  const ticket = tickets.get(channel.id);
  if (!ticket) return;

  const inactiveTime = Date.now() - ticket.lastActivity;

  if (inactiveTime >= TICKET_TIMEOUT) {
    await channel.send("This ticket has been inactive. Do you still need assistance?");
    
    // Set up auto-close
    setTimeout(() => autoCloseTicket(channel), CLOSE_TIMEOUT);
  } else {
    // Check again after the remaining time
    setTimeout(() => checkInactivity(channel), TICKET_TIMEOUT - inactiveTime);
  }
}

async function autoCloseTicket(channel) {
  const ticket = tickets.get(channel.id);
  if (!ticket) return;

  const inactiveTime = Date.now() - ticket.lastActivity;

  if (inactiveTime >= TICKET_TIMEOUT + CLOSE_TIMEOUT) {
    await closeTicket(channel);
  }
}

