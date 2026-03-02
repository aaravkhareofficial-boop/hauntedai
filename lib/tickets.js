const fs = require('fs');
const path = require('path');
const { ChannelType, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

const DATA_DIR = path.join(__dirname, '..', 'data');
const DATA_FILE = path.join(DATA_DIR, 'tickets.json');
const TRANSCRIPTS_DIR = path.join(DATA_DIR, 'tickets');

function safeFilename(name) {
  return name.replace(/[^a-z0-9-_\.]/gi, '_').toLowerCase();
}

function ensureDataDirs() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(TRANSCRIPTS_DIR)) fs.mkdirSync(TRANSCRIPTS_DIR, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, JSON.stringify({ lastId: 0, tickets: {} }, null, 2));
}

class TicketManager {
  constructor() {
    ensureDataDirs();
    this.data = this._load();
    this.client = null;
    this.cooldowns = new Map(); // userId -> timestamp
    this.defaultCooldown = parseInt(process.env.TICKET_COOLDOWN_SECONDS || '300', 10) * 1000;
    this.autoCloseMinutes = parseInt(process.env.TICKET_AUTO_CLOSE_MINUTES || '1440', 10);
    this.autoCloseWarnMinutes = parseInt(process.env.TICKET_AUTO_CLOSE_WARN_MINUTES || '60', 10);
    this.checkInterval = null;
  }

  _load() {
    try {
      return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    } catch (e) {
      return { lastId: 0, tickets: {} };
    }
  }

  _save() {
    fs.writeFileSync(DATA_FILE, JSON.stringify(this.data, null, 2));
  }

  init(client) {
    this.client = client;
    // Periodic save and auto-close checks
    if (this.checkInterval) clearInterval(this.checkInterval);
    this.checkInterval = setInterval(() => this._autoCloseCheck(), 60 * 1000);

    // Expose the manager on client for convenience
    try { client.ticketManager = this; } catch(e) {}
  }

  async _autoCloseCheck() {
    const now = Date.now();
    for (const id in this.data.tickets) {
      const t = this.data.tickets[id];
      if (!t || t.status !== 'open' || !t.channelId) continue;
      const lastActivity = t.lastActivityAt || t.createdAt;
      const ageMinutes = (now - lastActivity) / (60 * 1000);
      if (!t.warnedAt && ageMinutes > (this.autoCloseMinutes - this.autoCloseWarnMinutes)) {
        // send warning
        try {
          const channel = await this._fetchChannel(t.guildId, t.channelId);
          if (channel) {
            const embed = new EmbedBuilder().setTitle('Ticket inactivity warning').setDescription(`This ticket has been inactive for a while and will be closed after ${this.autoCloseWarnMinutes} minutes of further inactivity. Post a message to keep it open.`).setColor(0xffa500);
            await channel.send({ embeds: [embed] });
            t.warnedAt = Date.now();
            this._save();
          }
        } catch (e) {
          console.error('auto-close warning error', e);
        }
      } else if (t.warnedAt) {
        const warnedAgeMinutes = (now - t.warnedAt) / (60 * 1000);
        if (warnedAgeMinutes > this.autoCloseWarnMinutes) {
          // close ticket
          try {
            await this.closeTicket(t.channelId, null, 'Auto-closed due to inactivity');
          } catch (e) {
            console.error('auto-close error', e);
          }
        }
      }
    }
  }

  _getNextId() {
    this.data.lastId += 1;
    this._save();
    return this.data.lastId;
  }

  _getSupportRoleId(category) {
    // Look for env var TICKET_ROLE_<CATEGORY>
    if (!category) return process.env.TICKET_ROLE_ID || null;
    const key = `TICKET_ROLE_${category.replace(/[^a-z0-9]/gi, '_').toUpperCase()}`;
    return process.env[key] || process.env.TICKET_ROLE_ID || null;
  }

  async _fetchChannel(guildId, channelId) {
    try {
      const guild = await this.client.guilds.fetch(guildId);
      if (!guild) return null;
      return await guild.channels.fetch(channelId).catch(()=>null);
    } catch (e) { return null; }
  }

  async createTicket({ guild, user, category = 'Support', initialData = {}, override = false }) {
    if (!guild || !user) throw new Error('Missing guild or user');

    // cooldowns and duplicate prevention
    const existing = this.getOpenTicketByUser(guild.id, user.id);
    const isStaffOverride = (user && this._isStaff(user));
    if (existing && !override && !isStaffOverride) throw new Error('You already have an open ticket.');

    const now = Date.now();
    const cooldownUntil = this.cooldowns.get(user.id) || 0;
    if (!override && Date.now() < cooldownUntil) throw new Error('You are on cooldown for creating tickets.');

    // create or find category channel
    let cat = guild.channels.cache.find(c => c.type === ChannelType.GuildCategory && c.name.toLowerCase() === `tickets - ${category.toLowerCase()}`);
    if (!cat) {
      cat = await guild.channels.create({ name: `Tickets - ${category}`, type: ChannelType.GuildCategory });
    }

    // prepare overwrites
    const overwrites = [];
    // deny @everyone
    overwrites.push({ id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] });
    // allow ticket creator
    overwrites.push({ id: user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.AttachFiles, PermissionFlagsBits.ReadMessageHistory] });

    // staff/support role
    const supportRoleId = this._getSupportRoleId(category);
    if (supportRoleId) overwrites.push({ id: supportRoleId, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] });

    // allow administrators (explicitly allow roles with Admin to avoid accidental lockout)
    const adminRoles = guild.roles.cache.filter(r => r.permissions.has(PermissionFlagsBits.Administrator));
    for (const r of adminRoles.values()) {
      overwrites.push({ id: r.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] });
    }

    // create channel
    const ticketId = this._getNextId();
    const channelName = `ticket-${ticketId}`;
    const channel = await guild.channels.create({ name: channelName, type: ChannelType.GuildText, parent: cat.id, permissionOverwrites: overwrites });

    // send a panel message at the top that shows the ticket type and quick actions
    try {
      const { embed, components } = this.buildTicketPanel({ ticketId, category, creatorId: user.id, claimedBy: null, status: 'open' });
      await channel.send({ embeds: [embed], components });
    } catch (e) {
      console.error('failed to send ticket panel', e);
    }

    // prepare ticket record
    const ticket = {
      id: ticketId,
      guildId: guild.id,
      channelId: channel.id,
      creatorId: user.id,
      category: category,
      status: 'open',
      createdAt: now,
      lastActivityAt: now,
      warnedAt: null,
      claimedBy: null,
      closedAt: null,
      closedBy: null,
      reason: null,
      transcriptPath: null,
      initialData: initialData
    };

    this.data.tickets[ticketId] = ticket;
    this._save();

    // send initial embed + action buttons
    const embed = new EmbedBuilder()
      .setTitle(`Ticket #${ticketId} — ${category}`)
      .setDescription(`Thank you <@${user.id}>! A staff member will be with you shortly.`)
      .addFields(
        { name: 'Category', value: category, inline: true },
        { name: 'Creator', value: `<@${user.id}>`, inline: true },
        { name: 'Ticket ID', value: `#${ticketId}`, inline: true }
      )
      .setTimestamp()
      .setColor(0x00ae86);

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`claim_${ticketId}`).setLabel('Claim').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId(`close_${ticketId}`).setLabel('Close').setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId(`escalate_${ticketId}`).setLabel('Escalate').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(`transcript_${ticketId}`).setLabel('Transcript').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(`reopen_${ticketId}`).setLabel('Reopen').setStyle(ButtonStyle.Secondary)
    );

    await channel.send({ content: supportRoleId ? `<@&${supportRoleId}>` : undefined, embeds: [embed], components: [row] });

    // set cooldown
    this.cooldowns.set(user.id, Date.now() + this.defaultCooldown);

    return ticket;
  }

  async closeTicket(channelId, closedById = null, reason = 'Closed by staff') {
    const ticket = this.getTicketByChannel(channelId);
    if (!ticket) throw new Error('Ticket not found.');
    if (ticket.status !== 'open') throw new Error('Ticket already closed.');

    const channel = await this._fetchChannel(ticket.guildId, ticket.channelId);
    if (!channel) throw new Error('Channel not found.');

    // generate transcript (text + html)
    let transcriptPaths = null;
    try {
      const { text, html } = await this.generateTranscript(channel);
      const base = `ticket-${ticket.id}-${safeFilename((ticket.category || 'ticket'))}`;
      const textPath = path.join(TRANSCRIPTS_DIR, `${base}.txt`);
      const htmlPath = path.join(TRANSCRIPTS_DIR, `${base}.html`);
      fs.writeFileSync(textPath, text, 'utf8');
      fs.writeFileSync(htmlPath, html, 'utf8');
      transcriptPaths = { text: textPath, html: htmlPath };
    } catch (e) {
      console.error('transcript generation failed', e);
    }

    ticket.status = 'closed';
    ticket.closedAt = Date.now();
    ticket.closedBy = closedById;
    ticket.reason = reason;
    ticket.transcriptPath = transcriptPaths;
    this._save();

    // lock channel send permissions for creator
    try {
      await channel.permissionOverwrites.edit(ticket.creatorId, { SendMessages: false });
      // optionally rename channel to closed-<id>
      await channel.setName(`closed-${channel.name}`);
      const fileNames = transcriptPaths ? `${path.basename(transcriptPaths.html)} & ${path.basename(transcriptPaths.text)}` : null;
      const embed = new EmbedBuilder().setTitle(`Ticket #${ticket.id} closed`).setDescription(`Ticket closed. Reason: ${reason}`).setColor(0xff0000).addFields({ name: 'Transcript', value: fileNames ? fileNames : 'Transcript not available' });
      await channel.send({ embeds: [embed] });
    } catch (e) {
      console.error('post-close changes failed', e);
    }

    // log close event and transcript filenames
    this.addLog(ticket.id, closedById || 'system', 'close', `reason:${reason} files:${transcriptPaths ? (path.basename(transcriptPaths.html) + ' & ' + path.basename(transcriptPaths.text)) : 'none'}`);

    return ticket;
  }

  buildCreatePanel() {
    const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
    const embed = new EmbedBuilder().setTitle('Create a ticket').setDescription('Choose a category below to open a new ticket. You will be asked to provide more details.')
      .addFields({ name: 'Categories', value: 'Support, Billing, Report, Appeal, Other' }).setColor(0x00ae86);
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('panel_create_Support').setLabel('Support').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('panel_create_Billing').setLabel('Billing').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('panel_create_Report').setLabel('Report').setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId('panel_create_Appeal').setLabel('Appeal').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('panel_create_Other').setLabel('Other').setStyle(ButtonStyle.Secondary)
    );
    return { embed, components: [row] };
  }

  buildTicketPanel({ ticketId, category, creatorId, claimedBy, status }) {
    const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
    const embed = new EmbedBuilder().setTitle(`Ticket #${ticketId} — ${category}`).setDescription(`Status: **${status}**\nCreator: <@${creatorId}>${claimedBy ? `\nClaimed by: <@${claimedBy}>` : ''}`).setColor(status === 'open' ? 0x00ae86 : 0xff0000);
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`claim_${ticketId}`).setLabel('Claim').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId(`transfer_${ticketId}`).setLabel('Transfer').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(`escalate_${ticketId}`).setLabel('Escalate').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(`close_${ticketId}`).setLabel('Close').setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId(`delete_${ticketId}`).setLabel('Delete').setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId(`transcript_${ticketId}`).setLabel('Transcript').setStyle(ButtonStyle.Secondary)
    );
    return { embed, components: [row] };
  }

  async generateTranscript(channel) {
    // Fetch all messages (backwards) and assemble a plaintext transcript and an enhanced HTML transcript
    const fetched = [];
    let lastId = null;
    while (true) {
      const options = { limit: 100 };
      if (lastId) options.before = lastId;
      // eslint-disable-next-line no-await-in-loop
      const messages = await channel.messages.fetch(options);
      if (!messages || messages.size === 0) break;
      messages.forEach(m => fetched.push(m));
      lastId = messages.last().id;
      if (messages.size < 100) break;
    }

    // sort chronologically
    fetched.sort((a, b) => a.createdTimestamp - b.createdTimestamp);

    // Plain text transcript
    const lines = fetched.map(m => {
      const time = new Date(m.createdTimestamp).toISOString();
      const author = `${m.author.tag} (${m.author.id})`;
      const content = m.content || '';
      const attachments = m.attachments.size ? ' [attachments: ' + m.attachments.map(a => a.url).join(', ') + ']' : '';
      return `${time} | ${author}: ${content}${attachments}`;
    });
    const textTranscript = lines.join('\n');

    // HTML transcript with inline attachments and improved styling
    const escape = str => String(str || '').replace(/[&<>\\\"]/g, s => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[s]));

    const htmlLines = fetched.map(m => {
      const time = new Date(m.createdTimestamp).toLocaleString();
      const authorName = escape(m.author.tag);
      const authorId = m.author.id;
      const avatar = m.author.displayAvatarURL ? m.author.displayAvatarURL({ size: 64, dynamic: true }) : '';
      const content = escape(m.content || '');

      // attachments: embed images inline; link others
      const attachmentsHtml = [];
      m.attachments.forEach(a => {
        const url = escape(a.url);
        const name = escape(a.name || 'attachment');
        const lower = (a.name || '').toLowerCase();
        if (/\.(png|jpe?g|gif|webp|bmp)$/i.test(lower)) {
          attachmentsHtml.push(`<div class="att"><img src="${url}" alt="${name}" /></div>`);
        } else {
          attachmentsHtml.push(`<div class="att"><a href="${url}">${name}</a></div>`);
        }
      });

      // embeds (simple representation)
      const embedsHtml = [];
      if (m.embeds && m.embeds.length) {
        m.embeds.forEach(e => {
          const title = escape(e.title || '');
          const desc = escape(e.description || '');
          if (title || desc) embedsHtml.push(`<div class="embed"><strong>${title}</strong><div>${desc}</div></div>`);
        });
      }

      return `\n        <div class="msg">\n          <img class="avatar" src="${avatar}" alt="avatar" />\n          <div class="body">\n            <div class="meta"><span class="author">${authorName}</span> <span class="id">(${authorId})</span> <span class="time">${time}</span></div>\n            <div class="content">${content}</div>\n            ${embedsHtml.join('\n')}\n            ${attachmentsHtml.join('\n')}\n          </div>\n        </div>`;
    }).join('\n');

    const html = `<!doctype html>\n<html>\n<head>\n<meta charset="utf-8">\n<title>Ticket transcript - ${escape(channel.name)}</title>\n<style>\n  body{font-family:Arial,Helvetica,sans-serif;background:#f3f4f6;color:#111;padding:20px}\n  .container{max-width:900px;margin:0 auto}\n  h1{font-size:20px;margin-bottom:10px}\n  .msg{display:flex;gap:10px;align-items:flex-start;background:#fff;padding:10px;margin:8px 0;border-radius:8px;box-shadow:0 1px 0 rgba(0,0,0,0.04)}\n  .avatar{width:48px;height:48px;border-radius:50%;flex:0 0 48px}\n  .body{flex:1}\n  .meta{font-size:12px;color:#6b7280;margin-bottom:6px}\n  .author{font-weight:600;color:#111}\n  .time{margin-left:8px;color:#6b7280}\n  .content{white-space:pre-wrap;color:#111}\n  .embed{border-left:4px solid #e5e7eb;padding:6px;margin-top:8px;background:#fafafa}\n  .att img{max-width:420px;border-radius:6px;margin-top:8px}\n  .att a{display:inline-block;margin-top:6px;color:#0366d6}\n</style>\n</head>\n<body>\n  <div class="container">\n    <h1>Transcript - ${escape(channel.name)}</h1>\n    ${htmlLines}\n  </div>\n</body>\n</html>`;

    return { text: textTranscript, html };
  }

  getTicketByChannel(channelId) {
    for (const id in this.data.tickets) {
      const t = this.data.tickets[id];
      if (t.channelId === channelId) return t;
    }
    return null;
  }

  getOpenTicketByUser(guildId, userId) {
    for (const id in this.data.tickets) {
      const t = this.data.tickets[id];
      if (t.guildId === guildId && t.creatorId === userId && t.status === 'open') return t;
    }
    return null;
  }

  // minimal staff determination: member has ManageMessages or ManageChannels or Administrator
  _isStaff(member) {
    if (!member || !member.permissions) return false;
    return member.permissions.has(PermissionFlagsBits.ManageMessages) || member.permissions.has(PermissionFlagsBits.ManageChannels) || member.permissions.has(PermissionFlagsBits.Administrator);
  }

  addLog(ticketId, actorId, action, details = '') {
    try {
      const ticket = this.data.tickets[ticketId];
      if (!ticket) return;
      const entry = { time: Date.now(), actorId, action, details };
      ticket.logs = ticket.logs || [];
      ticket.logs.push(entry);
      this._save();
      // append to log file
      const logFile = path.join(TRANSCRIPTS_DIR, `ticket-${ticketId}-log.txt`);
      const line = `${new Date(entry.time).toISOString()} | ${actorId} | ${action} | ${details}\n`;
      fs.appendFileSync(logFile, line, 'utf8');
    } catch (e) {
      console.error('addLog error', e);
    }
  }

  setCategoryRole(category, roleId) {
    this.data.settings = this.data.settings || {};
    this.data.settings.categoryRoles = this.data.settings.categoryRoles || {};
    this.data.settings.categoryRoles[category] = roleId;
    this._save();
  }

  getCategoryRole(category) {
    this.data.settings = this.data.settings || {};
    this.data.settings.categoryRoles = this.data.settings.categoryRoles || {};
    return this.data.settings.categoryRoles[category] || null;
  }

  listCategoryRoles() {
    this.data.settings = this.data.settings || {};
    this.data.settings.categoryRoles = this.data.settings.categoryRoles || {};
    return this.data.settings.categoryRoles;
  }

  async transferTicket(channelId, newCategory, byId = null) {
    const ticket = this.getTicketByChannel(channelId);
    if (!ticket) throw new Error('Ticket not found');
    if (ticket.status !== 'open') throw new Error('Cannot transfer a closed ticket');

    const guild = await this.client.guilds.fetch(ticket.guildId);
    const channel = await guild.channels.fetch(ticket.channelId);
    // update category role permission
    const oldCategory = ticket.category;
    ticket.category = newCategory;
    ticket.lastActivityAt = Date.now();
    this._save();

    // update support role permissions
    const oldRoleId = this._getSupportRoleId(oldCategory);
    const newRoleId = this._getSupportRoleId(newCategory);
    try {
      if (oldRoleId) await channel.permissionOverwrites.edit(oldRoleId, { ViewChannel: null, SendMessages: null, ReadMessageHistory: null });
      if (newRoleId) await channel.permissionOverwrites.edit(newRoleId, { ViewChannel: true, SendMessages: true, ReadMessageHistory: true });
    } catch (e) {
      console.error('transfer permission update failed', e);
    }

    this.addLog(ticket.id, byId || 'system', 'transfer', `from ${oldCategory} to ${newCategory}`);

    await channel.send({ embeds: [new EmbedBuilder().setTitle('Ticket transferred').setDescription(`Category changed from **${oldCategory}** to **${newCategory}**`).setColor(0x00ae86)] });

    return ticket;
  }

  async escalateTicket(channelId, escalateRoleId = null, byId = null, reason = '') {
    const ticket = this.getTicketByChannel(channelId);
    if (!ticket) throw new Error('Ticket not found');
    if (ticket.status !== 'open') throw new Error('Cannot escalate a closed ticket');

    ticket.lastActivityAt = Date.now();
    this._save();

    const channel = await this._fetchChannel(ticket.guildId, ticket.channelId);
    const embed = new EmbedBuilder().setTitle('Ticket escalated').setDescription(reason || 'Escalation requested').addFields({ name: 'Ticket', value: `#${ticket.id}` }, { name: 'By', value: `<@${byId}>` }).setColor(0xffa500);

    try {
      if (escalateRoleId) {
        await channel.send({ content: `<@&${escalateRoleId}>`, embeds: [embed] });
      } else {
        await channel.send({ embeds: [embed] });
      }
    } catch (e) {
      console.error('escalation notify failed', e);
    }

    this.addLog(ticket.id, byId || 'system', 'escalate', `role:${escalateRoleId || 'none'} reason:${reason}`);

    return ticket;
  }

  async reopenTicket(channelId, reopenedById = null, reason = '') {
    const ticket = this.getTicketByChannel(channelId);
    if (!ticket) throw new Error('Ticket not found');
    if (ticket.status !== 'closed') throw new Error('Ticket is not closed');

    const channel = await this._fetchChannel(ticket.guildId, ticket.channelId);
    ticket.status = 'open';
    ticket.closedAt = null;
    ticket.closedBy = null;
    ticket.reason = null;
    ticket.lastActivityAt = Date.now();
    ticket.warnedAt = null;
    this._save();

    try {
      await channel.permissionOverwrites.edit(ticket.creatorId, { SendMessages: true });
      // rename channel back if it was renamed
      if (channel.name.startsWith('closed-')) {
        await channel.setName(channel.name.replace(/^closed-/, ''));
      }
      await channel.send({ embeds: [new EmbedBuilder().setTitle('Ticket reopened').setDescription(`Reopened by <@${reopenedById || 'system'}>\n${reason || ''}`).setColor(0x00ae86)] });
    } catch (e) {
      console.error('reopen post actions failed', e);
    }

    this.addLog(ticket.id, reopenedById || 'system', 'reopen', reason);

    return ticket;
  }

  async deleteTicket(channelId, deletedById = null, reason = '') {
    const ticket = this.getTicketByChannel(channelId);
    if (!ticket) throw new Error('Ticket not found');
    if (ticket.status === 'deleted') throw new Error('Ticket already deleted');

    const channel = await this._fetchChannel(ticket.guildId, ticket.channelId);
    if (!channel) throw new Error('Channel not found');

    // generate transcript (text + html) before deletion
    let transcriptPaths = null;
    try {
      const { text, html } = await this.generateTranscript(channel);
      const base = `ticket-${ticket.id}-${safeFilename((ticket.category || 'ticket'))}-deleted`;
      const textPath = path.join(TRANSCRIPTS_DIR, `${base}.txt`);
      const htmlPath = path.join(TRANSCRIPTS_DIR, `${base}.html`);
      fs.writeFileSync(textPath, text, 'utf8');
      fs.writeFileSync(htmlPath, html, 'utf8');
      transcriptPaths = { text: textPath, html: htmlPath };
    } catch (e) {
      console.error('transcript generation failed (delete)', e);
    }

    // update ticket record
    ticket.status = 'deleted';
    ticket.deletedAt = Date.now();
    ticket.deletedBy = deletedById;
    ticket.deleteReason = reason;
    ticket.transcriptPath = transcriptPaths;
    this._save();

    // DM the requester who performed deletion with transcripts (best-effort)
    try {
      const user = await this.client.users.fetch(deletedById);
      if (user) {
        const files = [];
        if (transcriptPaths && transcriptPaths.text) files.push({ attachment: fs.readFileSync(transcriptPaths.text), name: path.basename(transcriptPaths.text) });
        if (transcriptPaths && transcriptPaths.html) files.push({ attachment: fs.readFileSync(transcriptPaths.html), name: path.basename(transcriptPaths.html) });
        if (files.length) await user.send({ content: `Deleted ticket #${ticket.id} transcripts`, files });
      }
    } catch (e) {
      console.error('failed to DM deleter transcripts', e);
    }

    this.addLog(ticket.id, deletedById || 'system', 'delete', reason);

    // delete channel
    try {
      await channel.delete(`Deleted by ${deletedById || 'system'}: ${reason}`);
    } catch (e) {
      console.error('failed to delete channel', e);
      throw e;
    }

    return ticket;
  }

  async generateTranscript(channel) {
    // Fetch all messages (backwards) and assemble a plaintext transcript and a simple HTML transcript
    const fetched = [];
    let lastId = null;
    while (true) {
      const options = { limit: 100 };
      if (lastId) options.before = lastId;
      // eslint-disable-next-line no-await-in-loop
      const messages = await channel.messages.fetch(options);
      if (!messages || messages.size === 0) break;
      messages.forEach(m => fetched.push(m));
      lastId = messages.last().id;
      if (messages.size < 100) break;
    }

    // sort chronologically
    fetched.sort((a, b) => a.createdTimestamp - b.createdTimestamp);
    const lines = fetched.map(m => {
      const time = new Date(m.createdTimestamp).toISOString();
      const author = `${m.author.tag} (${m.author.id})`;
      const content = m.content || '';
      const attachments = m.attachments.size ? ' [attachments: ' + m.attachments.map(a => a.url).join(', ') + ']' : '';
      return `${time} | ${author}: ${content}${attachments}`;
    });

    // Plain text transcript
    const textTranscript = lines.join('\n');

    // HTML transcript
    const escape = str => String(str).replace(/[&<>\"]/g, s => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[s]));
    const htmlLines = fetched.map(m => {
      const time = new Date(m.createdTimestamp).toLocaleString();
      const author = escape(`${m.author.tag} (${m.author.id})`);
      const content = escape(m.content || '');
      const attachments = m.attachments.size ? m.attachments.map(a => `<a href="${escape(a.url)}">attachment</a>`).join(' ') : '';
      return `<div class="msg"><div class="meta"><span class="time">${time}</span> <span class="author">${author}</span></div><div class="content">${content} ${attachments}</div></div>`;
    }).join('\n');

    const html = `<!doctype html><html><head><meta charset="utf-8"><title>Ticket transcript</title><style>body{font-family:Arial,Helvetica,sans-serif;background:#f7f7f7;color:#222;padding:20px} .msg{background:#fff;padding:8px;margin:6px 0;border-radius:6px} .meta{font-size:12px;color:#666;margin-bottom:4px} .content{white-space:pre-wrap}</style></head><body><h1>Transcript - ${escape(channel.name)}</h1>${htmlLines}</body></html>`;

    return { text: textTranscript, html };
  }

  getTicketByChannel(channelId) {
    for (const id in this.data.tickets) {
      const t = this.data.tickets[id];
      if (t.channelId === channelId) return t;
    }
    return null;
  }

  getOpenTicketByUser(guildId, userId) {
    for (const id in this.data.tickets) {
      const t = this.data.tickets[id];
      if (t.guildId === guildId && t.creatorId === userId && t.status === 'open') return t;
    }
    return null;
  }

  // minimal staff determination: member has ManageMessages or ManageChannels or Administrator
  _isStaff(member) {
    if (!member || !member.permissions) return false;
    return member.permissions.has(PermissionFlagsBits.ManageMessages) || member.permissions.has(PermissionFlagsBits.ManageChannels) || member.permissions.has(PermissionFlagsBits.Administrator);
  }

  async handleInteraction(interaction) {
    try {
      if (interaction.isButton && interaction.isButton()) {
        const [action, id] = interaction.customId.split('_');
        // special: panel_create buttons use full category name as id part
        if (action === 'panel' && id && id.startsWith('create')) {
          const parts = interaction.customId.split('_');
          const category = parts.slice(2).join('_');
          // show create modal bound to category
          const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
          const modal = new ModalBuilder().setCustomId(`ticket_create|${category}`).setTitle(`Create ${category} ticket`);
          const subjectInput = new TextInputBuilder().setCustomId('subject').setLabel('Short subject').setStyle(TextInputStyle.Short).setRequired(true);
          const descInput = new TextInputBuilder().setCustomId('description').setLabel('Describe your issue').setStyle(TextInputStyle.Paragraph).setRequired(true);
          modal.addComponents(new ActionRowBuilder().addComponents(subjectInput), new ActionRowBuilder().addComponents(descInput));
          await interaction.showModal(modal);
          return;
        }

        const ticketId = parseInt(id, 10);
        const ticket = this.data.tickets[ticketId] || this.getTicketByChannel(interaction.channelId);
        if (!ticket) return interaction.reply({ content: 'Ticket not found.', flags: 64 });
        const member = await interaction.guild.members.fetch(interaction.user.id).catch(()=>null);
        if (action === 'claim') {
          if (!this._isStaff(member)) return interaction.reply({ content: 'You need staff permissions to claim a ticket.', flags: 64 });
          ticket.claimedBy = interaction.user.id;
          this.addLog(ticket.id, interaction.user.id, 'claim');
          this._save();
          await interaction.reply({ content: `Ticket #${ticket.id} claimed by <@${interaction.user.id}>.`, ephemeral: false });
        } else if (action === 'close') {
          if (!this._isStaff(member)) return interaction.reply({ content: 'You need staff permissions to close a ticket.', flags: 64 });
          // show modal to collect a close reason
          const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
          const modal = new ModalBuilder().setCustomId(`close_modal_${ticket.id}`).setTitle('Close ticket');
          const reasonInput = new TextInputBuilder().setCustomId('reason').setLabel('Reason (optional)').setStyle(TextInputStyle.Short).setRequired(false);
          const row = new ActionRowBuilder().addComponents(reasonInput);
          modal.addComponents(row);
          await interaction.showModal(modal);
        } else if (action === 'transcript') {
          if (!this._isStaff(member)) return interaction.reply({ content: 'You need staff permissions to request a transcript.', flags: 64 });
          await interaction.deferReply({ flags: 64 });
          const channel = await this._fetchChannel(ticket.guildId, ticket.channelId);
          const { text, html } = await this.generateTranscript(channel);
          const textBuffer = Buffer.from(text, 'utf8');
          const htmlBuffer = Buffer.from(html, 'utf8');
          const txtName = `ticket-${ticket.id}.txt`;
          const htmlName = `ticket-${ticket.id}.html`;
          try {
            await interaction.user.send({ content: `Transcript for ticket #${ticket.id}`, files: [{ attachment: textBuffer, name: txtName }, { attachment: htmlBuffer, name: htmlName }] });
            await interaction.editReply({ content: 'Transcript sent to your DMs (if your DMs are open).', flags: 64 });
          } catch (e) {
            await interaction.editReply({ content: 'Failed to DM transcript (maybe your DMs are closed).', flags: 64 });
          }
        } else if (action === 'escalate') {
          if (!this._isStaff(member)) return interaction.reply({ content: 'You need staff permissions to escalate a ticket.', flags: 64 });
          // show modal to collect reason and optional role mention
          const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
          const modal = new ModalBuilder().setCustomId(`escalate_modal_${ticket.id}`).setTitle('Escalate ticket');
          const roleInput = new TextInputBuilder().setCustomId('role').setLabel('Role ID to ping (optional)').setStyle(TextInputStyle.Short).setRequired(false);
          const reasonInput = new TextInputBuilder().setCustomId('reason').setLabel('Reason (optional)').setStyle(TextInputStyle.Paragraph).setRequired(false);
          modal.addComponents(new ActionRowBuilder().addComponents(roleInput), new ActionRowBuilder().addComponents(reasonInput));
          await interaction.showModal(modal);
        } else if (action === 'delete') {
          if (!this._isStaff(member)) return interaction.reply({ content: 'You need staff permissions to delete a ticket channel.', flags: 64 });
          // confirmation modal: require typing DELETE and optional reason
          const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
          const modal = new ModalBuilder().setCustomId(`delete_modal_${ticket.id}`).setTitle('Delete ticket channel');
          const confirmInput = new TextInputBuilder().setCustomId('confirm').setLabel('Type DELETE to confirm').setStyle(TextInputStyle.Short).setRequired(true);
          const reasonInput = new TextInputBuilder().setCustomId('reason').setLabel('Reason (optional)').setStyle(TextInputStyle.Paragraph).setRequired(false);
          modal.addComponents(new ActionRowBuilder().addComponents(confirmInput), new ActionRowBuilder().addComponents(reasonInput));
          await interaction.showModal(modal);
        } else if (action === 'reopen') {
          if (!this._isStaff(member)) return interaction.reply({ content: 'You need staff permissions to reopen a ticket.', flags: 64 });
          try {
            await this.reopenTicket(interaction.channelId, interaction.user.id, 'Reopened via button');
            this.addLog(ticket.id, interaction.user.id, 'reopen', 'via button');
            await interaction.reply({ content: `Ticket #${ticket.id} reopened.`, ephemeral: false });
          } catch (e) {
            await interaction.reply({ content: `Failed to reopen ticket: ${e.message}`, flags: 64 });
          }
        }
      } else if (interaction.isModalSubmit && interaction.isModalSubmit()) {
        if (interaction.customId.startsWith('ticket_create|')) {
          const category = interaction.customId.split('|')[1] || 'Support';
          const subject = interaction.fields.getTextInputValue('subject');
          const description = interaction.fields.getTextInputValue('description');
          await interaction.deferReply({ flags: 64 });
          const ticket = await this.createTicket({ guild: interaction.guild, user: interaction.user, category, initialData: { subject, description } });
          await interaction.editReply({ content: `Ticket created: <#${ticket.channelId}>` });
        } else if (interaction.customId.startsWith('close_modal_')) {
          const id = parseInt(interaction.customId.split('_').pop(), 10);
          const reason = interaction.fields.getTextInputValue('reason') || 'Closed by staff';
          await this.closeTicket(interaction.channelId, interaction.user.id, reason).catch(e => console.error('close via modal failed', e));
          this.addLog(id, interaction.user.id, 'close', reason);
          await interaction.reply({ content: `Ticket closed.`, ephemeral: false });
        } else if (interaction.customId.startsWith('escalate_modal_')) {
          const id = parseInt(interaction.customId.split('_').pop(), 10);
          const roleVal = interaction.fields.getTextInputValue('role') || null;
          const reason = interaction.fields.getTextInputValue('reason') || '';
          const roleId = roleVal ? roleVal.trim().replace(/[<@&>]/g, '') : null;
          await this.escalateTicket(interaction.channelId, roleId, interaction.user.id, reason).catch(e => console.error('escalate via modal failed', e));
          this.addLog(id, interaction.user.id, 'escalate', `role:${roleId || 'none'} reason:${reason}`);
          await interaction.reply({ content: `Escalation sent.`, ephemeral: false });
        } else if (interaction.customId.startsWith('delete_modal_')) {
          const id = parseInt(interaction.customId.split('_').pop(), 10);
          const confirm = interaction.fields.getTextInputValue('confirm') || '';
          const reason = interaction.fields.getTextInputValue('reason') || '';
          if (confirm.trim().toUpperCase() !== 'DELETE') {
            await interaction.reply({ content: 'Confirmation failed. You must type DELETE to confirm.', flags: 64 });
            return;
          }
          try {
            await this.deleteTicket(interaction.channelId, interaction.user.id, reason);
            this.addLog(id, interaction.user.id, 'delete', reason);
            await interaction.reply({ content: `Ticket #${id} channel deleted.`, flags: 64 });
          } catch (e) {
            console.error('delete via modal failed', e);
            await interaction.reply({ content: `Failed to delete ticket: ${e.message}`, flags: 64 });
          }
        }
      }
    } catch (e) {
      console.error('handleInteraction error', e);
      try {
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp({ content: 'Error handling interaction.', flags: 64 });
        } else {
          await interaction.reply({ content: 'Error handling interaction.', flags: 64 });
        }
      } catch (_) {}
    }
  }
}

module.exports = new TicketManager();

