const { SlashCommandBuilder } = require('@discordjs/builders');
const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const ticketManager = require('../lib/tickets');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ticket')
    .setDescription('Ticket system commands')
    .addSubcommand(sub => sub.setName('create').setDescription('Create a new ticket').addStringOption(opt => opt.setName('category').setDescription('Ticket category (Support,Billing,Report,Appeal,Other)').setRequired(false)))
    .addSubcommand(sub => sub.setName('claim').setDescription('Claim the ticket you are in'))
    .addSubcommand(sub => sub.setName('transfer').setDescription('Transfer the ticket to another category').addStringOption(opt => opt.setName('category').setDescription('Target category').setRequired(true)))
    .addSubcommand(sub => sub.setName('escalate').setDescription('Escalate the ticket (ping role)').addRoleOption(opt => opt.setName('role').setDescription('Role to ping').setRequired(false)).addStringOption(opt => opt.setName('reason').setDescription('Optional reason').setRequired(false)))
    .addSubcommand(sub => sub.setName('close').setDescription('Close the ticket you are in').addStringOption(opt => opt.setName('reason').setDescription('Optional reason')))
    .addSubcommand(sub => sub.setName('reopen').setDescription('Reopen a closed ticket').addStringOption(opt => opt.setName('reason').setDescription('Optional reason')))
    .addSubcommand(sub => sub.setName('delete').setDescription('Delete the ticket channel (PERMANENT)'))
    .addSubcommand(sub => sub.setName('panel').setDescription('Post an interactive ticket panel in this channel').addStringOption(opt => opt.setName('mode').setDescription('Mode: create or ticket').setRequired(false)))
    .addSubcommand(sub => sub.setName('transcript').setDescription('Generate a transcript for this ticket and DM it to you'))
    .addSubcommand(sub => sub.setName('status').setDescription('Show ticket status for this channel'))
    .addSubcommand(sub => sub.setName('setup').setDescription('Admin setup actions').addStringOption(opt => opt.setName('action').setDescription('setrole|list').setRequired(true)).addStringOption(opt => opt.setName('category').setDescription('Category name').setRequired(false)).addRoleOption(opt => opt.setName('role').setDescription('Role for category').setRequired(false))),
  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    try {
      if (sub === 'create') {
        const category = interaction.options.getString('category') || 'Support';
        // show modal
        const modal = new ModalBuilder().setCustomId(`ticket_create|${category}`).setTitle(`Create ${category} ticket`);
        const subjectInput = new TextInputBuilder().setCustomId('subject').setLabel('Short subject').setStyle(TextInputStyle.Short).setRequired(true);
        const descInput = new TextInputBuilder().setCustomId('description').setLabel('Describe your issue').setStyle(TextInputStyle.Paragraph).setRequired(true);
        modal.addComponents(new ActionRowBuilder().addComponents(subjectInput), new ActionRowBuilder().addComponents(descInput));
        await interaction.showModal(modal);
      } else if (sub === 'claim') {
        const ticket = ticketManager.getTicketByChannel(interaction.channelId);
        if (!ticket) return interaction.reply({ content: 'This channel is not a ticket.', flags: 64 });
        const member = await interaction.guild.members.fetch(interaction.user.id);
        if (!ticketManager._isStaff(member)) return interaction.reply({ content: 'You need staff permissions to claim.', flags: 64 });
        ticket.claimedBy = interaction.user.id;
        ticketManager.addLog(ticket.id, interaction.user.id, 'claim');
        ticketManager._save();
        await interaction.reply({ content: `Ticket #${ticket.id} claimed by <@${interaction.user.id}>.`, ephemeral: false });
      } else if (sub === 'transfer') {
        const ticket = ticketManager.getTicketByChannel(interaction.channelId);
        if (!ticket) return interaction.reply({ content: 'This channel is not a ticket.', flags: 64 });
        const member = await interaction.guild.members.fetch(interaction.user.id);
        if (!ticketManager._isStaff(member)) return interaction.reply({ content: 'You need staff permissions to transfer tickets.', flags: 64 });
        const category = interaction.options.getString('category');
        if (!category) return interaction.reply({ content: 'Please provide a category to transfer to.', flags: 64 });
        await ticketManager.transferTicket(interaction.channelId, category, interaction.user.id);
        await interaction.reply({ content: `Ticket transferred to ${category}.` });
      } else if (sub === 'escalate') {
        const ticket = ticketManager.getTicketByChannel(interaction.channelId);
        if (!ticket) return interaction.reply({ content: 'This channel is not a ticket.', flags: 64 });
        const member = await interaction.guild.members.fetch(interaction.user.id);
        if (!ticketManager._isStaff(member)) return interaction.reply({ content: 'You need staff permissions to escalate.', flags: 64 });
        const role = interaction.options.getRole('role');
        const reason = interaction.options.getString('reason') || '';
        await ticketManager.escalateTicket(interaction.channelId, role ? role.id : null, interaction.user.id, reason);
        await interaction.reply({ content: 'Escalation sent.' });
      } else if (sub === 'close') {
        const ticket = ticketManager.getTicketByChannel(interaction.channelId);
        if (!ticket) return interaction.reply({ content: 'This channel is not a ticket.', flags: 64 });
        const member = await interaction.guild.members.fetch(interaction.user.id);
        if (!ticketManager._isStaff(member)) return interaction.reply({ content: 'You need staff permissions to close tickets.', flags: 64 });
        const reason = interaction.options.getString('reason') || 'Closed by staff';
        await ticketManager.closeTicket(interaction.channelId, interaction.user.id, reason);
        ticketManager.addLog(ticket.id, interaction.user.id, 'close', reason);
        await interaction.reply({ content: `Ticket closed. Reason: ${reason}` });
      } else if (sub === 'reopen') {
        const ticket = ticketManager.getTicketByChannel(interaction.channelId);
        if (!ticket) return interaction.reply({ content: 'This channel is not a ticket.', flags: 64 });
        const member = await interaction.guild.members.fetch(interaction.user.id);
        if (!ticketManager._isStaff(member)) return interaction.reply({ content: 'You need staff permissions to reopen tickets.', flags: 64 });
        const reason = interaction.options.getString('reason') || '';
        await ticketManager.reopenTicket(interaction.channelId, interaction.user.id, reason);
        ticketManager.addLog(ticket.id, interaction.user.id, 'reopen', reason);
        await interaction.reply({ content: 'Ticket reopened.' });
      } else if (sub === 'delete') {
        const ticket = ticketManager.getTicketByChannel(interaction.channelId);
        if (!ticket) return interaction.reply({ content: 'This channel is not a ticket.', flags: 64 });
        const member = await interaction.guild.members.fetch(interaction.user.id);
        if (!ticketManager._isStaff(member)) return interaction.reply({ content: 'You need staff permissions to delete a ticket channel.', flags: 64 });
        // show confirmation modal
        const confirmModal = new ModalBuilder().setCustomId(`delete_modal_${ticket.id}`).setTitle('Delete ticket channel');
        const confirmInput = new TextInputBuilder().setCustomId('confirm').setLabel('Type DELETE to confirm').setStyle(TextInputStyle.Short).setRequired(true);
        const reasonInput = new TextInputBuilder().setCustomId('reason').setLabel('Reason (optional)').setStyle(TextInputStyle.Paragraph).setRequired(false);
        confirmModal.addComponents(new ActionRowBuilder().addComponents(confirmInput), new ActionRowBuilder().addComponents(reasonInput));
        await interaction.showModal(confirmModal);
      } else if (sub === 'panel') {
        // Admin-only: post a panel
        const member = await interaction.guild.members.fetch(interaction.user.id);
        if (!member.permissions.has(PermissionFlagsBits.Administrator) && !member.permissions.has(PermissionFlagsBits.ManageChannels)) return interaction.reply({ content: 'You need Administrator or Manage Channels permission to post a panel here.', flags: 64 });
        const mode = (interaction.options.getString('mode') || 'create').toLowerCase();
        if (mode === 'ticket') {
          // must be in a ticket channel
          const ticket = ticketManager.getTicketByChannel(interaction.channelId);
          if (!ticket) return interaction.reply({ content: 'This channel is not a ticket.', flags: 64 });
          const { embed, components } = ticketManager.buildTicketPanel({ ticketId: ticket.id, category: ticket.category, creatorId: ticket.creatorId, claimedBy: ticket.claimedBy, status: ticket.status });
          await interaction.reply({ embeds: [embed], components, ephemeral: false });
        } else {
          const { embed, components } = ticketManager.buildCreatePanel();
          await interaction.reply({ embeds: [embed], components, ephemeral: false });
        }
      } else if (sub === 'transcript') {
        const ticket = ticketManager.getTicketByChannel(interaction.channelId);
        if (!ticket) return interaction.reply({ content: 'This channel is not a ticket.', flags: 64 });
        const member = await interaction.guild.members.fetch(interaction.user.id);
        if (!ticketManager._isStaff(member)) return interaction.reply({ content: 'You need staff permissions to request transcripts.', flags: 64 });
        await interaction.deferReply({ flags: 64 });
        const channel = await interaction.guild.channels.fetch(ticket.channelId);
        const { text, html } = await ticketManager.generateTranscript(channel);
        try {
          await interaction.user.send({ content: `Transcript for ticket #${ticket.id}`, files: [{ attachment: Buffer.from(text, 'utf8'), name: `ticket-${ticket.id}.txt` }, { attachment: Buffer.from(html, 'utf8'), name: `ticket-${ticket.id}.html` }] });
          await interaction.editReply({ content: 'Transcript sent to your DMs (if available).' });
        } catch (e) {
          await interaction.editReply({ content: 'Failed to send transcript via DM. Do you have DMs disabled?' });
        }
      } else if (sub === 'status') {
        const ticket = ticketManager.getTicketByChannel(interaction.channelId);
        if (!ticket) return interaction.reply({ content: 'This channel is not a ticket.', flags: 64 });
        const embed = new EmbedBuilder().setTitle(`Ticket #${ticket.id} — ${ticket.category}`).addFields(
          { name: 'Status', value: ticket.status, inline: true },
          { name: 'Creator', value: `<@${ticket.creatorId}>`, inline: true },
          { name: 'Claimed by', value: ticket.claimedBy ? `<@${ticket.claimedBy}>` : 'Unclaimed', inline: true }
        ).setTimestamp(ticket.createdAt);
        await interaction.reply({ embeds: [embed], flags: 64 });
      } else if (sub === 'setup') {
        // admin only
        const member = await interaction.guild.members.fetch(interaction.user.id);
        if (!member.permissions.has(0n || 0)) return interaction.reply({ content: 'You need Administrator permission to manage settings.', flags: 64 });
        const action = interaction.options.getString('action');
        if (action === 'setrole') {
          const category = interaction.options.getString('category');
          const role = interaction.options.getRole('role');
          if (!category || !role) return interaction.reply({ content: 'Provide category and role.', flags: 64 });
          ticketManager.setCategoryRole(category, role.id);
          await interaction.reply({ content: `Category role set: ${category} -> ${role.name}` });
        } else if (action === 'list') {
          const mapping = ticketManager.listCategoryRoles();
          const entries = Object.entries(mapping).map(([k, v]) => `${k}: <@&${v}>`).join('\n') || 'No mappings';
          await interaction.reply({ content: `Category role mappings:\n${entries}`, flags: 64 });
        } else {
          await interaction.reply({ content: 'Unknown setup action. Use setrole or list.', flags: 64 });
        }
      }
    } catch (e) {
      console.error('ticket command error', e);
      await interaction.reply({ content: 'There was an error executing that command.', flags: 64 });
    }
  }
};

