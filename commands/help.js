const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

// helper utilities that can be used from other modules
const headerUrl = 'https://media.discordapp.net/attachments/1459515479315189879/1477599970294108221/3daadc8f4d799b474f1897298803b5fa.jpg?ex=69a559b5&is=69a40835&hm=0193e6086a8ccab984fa2ba3d2cbe7942ec554a89822fb3541d0e5db588659d0&=&format=webp&width=1101&height=437';

function makeRow(selected) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('help_economy').setLabel('Economy').setStyle(selected === 'economy' ? ButtonStyle.Primary : ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('help_moderation').setLabel('Moderation').setStyle(selected === 'moderation' ? ButtonStyle.Primary : ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('help_fun').setLabel('Fun').setStyle(selected === 'fun' ? ButtonStyle.Primary : ButtonStyle.Secondary)
  );
}

function makeRow2(selected) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('help_utility').setLabel('Utility').setStyle(selected === 'utility' ? ButtonStyle.Primary : ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('help_tickets').setLabel('Tickets').setStyle(selected === 'tickets' ? ButtonStyle.Primary : ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('help_home').setLabel('Home').setStyle(selected === 'home' ? ButtonStyle.Primary : ButtonStyle.Secondary)
  );
}

function buildEmbeds(prefix) {
  return {
    home: new EmbedBuilder()
      .setTitle('Opium Help — Home')
      .setDescription('Select a category using the buttons below to view commands.')
      .setColor(0x000000)
      .setImage(headerUrl)
      .setFooter({ text: 'Use the buttons below to switch categories' }),
    economy: new EmbedBuilder()
      .setTitle('Economy')
      .setColor(0x000000)
      .setImage(headerUrl)
      .addFields(
        { name: `${prefix}balance`, value: 'Check your balance', inline: true },
        { name: `${prefix}daily`, value: 'Claim daily rewards', inline: true },
        { name: `${prefix}pay`, value: 'Send money to another user', inline: true },
        { name: `${prefix}addmoney`, value: '(Admin) Add money to a user', inline: true },
        { name: `${prefix}coinflip`, value: 'Flip a coin and bet money', inline: true }
      )
      .setFooter({ text: 'Use the buttons below to switch categories' }),
    moderation: new EmbedBuilder()
      .setTitle('Moderation')
      .setColor(0x000000)
      .setImage(headerUrl)
      .addFields(
        { name: `${prefix}ban`, value: 'Ban a user', inline: true },
        { name: `${prefix}unban`, value: 'Unban by ID', inline: true },
        { name: `${prefix}kick`, value: 'Kick a user', inline: true },
        { name: `${prefix}mute`, value: 'Mute/timeout a user (optional minutes)', inline: true },
        { name: `${prefix}unmute`, value: 'Remove a user timeout', inline: true },
        { name: `${prefix}timeout`, value: 'Timeout a user for specified minutes', inline: true },
        { name: `${prefix}untimeout`, value: 'Remove a user timeout', inline: true },
        { name: `${prefix}purge`, value: 'Delete messages', inline: true },
        { name: `${prefix}lock`, value: 'Lock a channel', inline: true },
        { name: `${prefix}unlock`, value: 'Unlock a channel', inline: true },
        { name: `${prefix}nuke`, value: 'Delete and recreate channel with same permissions', inline: true }
      )
      .setFooter({ text: 'Use the buttons below to switch categories' }),
    fun: new EmbedBuilder()
      .setTitle('Fun')
      .setColor(0x000000)
      .setImage(headerUrl)
      .addFields(
        { name: `${prefix}hug`, value: 'Hug a user', inline: true },
        { name: `${prefix}slap`, value: 'Slap a user', inline: true },
        { name: `${prefix}meme`, value: 'Get a meme', inline: true },
        { name: `${prefix}roll`, value: 'Roll a random number', inline: true },
        { name: `${prefix}say`, value: 'Make the bot say something', inline: true }
      )
      .setFooter({ text: 'Use the buttons below to switch categories' }),
    utility: new EmbedBuilder()
      .setTitle('Utility')
      .setColor(0x000000)
      .setImage(headerUrl)
      .addFields(
        { name: `${prefix}ping`, value: 'Check bot speed', inline: true },
        { name: `${prefix}avatar`, value: 'Get a user avatar', inline: true },
        { name: `${prefix}userinfo`, value: 'Get user info', inline: true },
        { name: `${prefix}serverinfo`, value: 'Get server info', inline: true },
        { name: `${prefix}help`, value: 'Open this help menu', inline: true }
      )
      .setFooter({ text: 'Use the buttons below to switch categories' }),
    tickets: new EmbedBuilder()
      .setTitle('Tickets')
      .setColor(0x000000)
      .setImage(headerUrl)
      .addFields(
        { name: `${prefix}ticket`, value: 'Open or manage a support ticket', inline: false }
      )
      .setFooter({ text: 'Use the buttons below to switch categories' })
  };
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Show a modern embedded help message'),
  async execute(interaction) {
    try {
      const PREFIX = process.env.PREFIX || '!';
      const embeds = buildEmbeds(PREFIX);

      const sent = await interaction.reply({ embeds: [embeds.home], components: [makeRow('home'), makeRow2('home')], fetchReply: true });

      const collector = sent.createMessageComponentCollector({ time: 5 * 60 * 1000 });
      collector.on('collect', async btn => {
        try {
          if (!btn.isButton()) return;
          // restrict to the command invoker
          if (btn.user.id !== interaction.user.id) return btn.reply({ content: 'This help session belongs to the command sender.', flags: 64 }).catch(()=>{});
          const id = btn.customId.split('_').pop();
          const embed = embeds[id] || embeds.home;
          try {
            await btn.update({ embeds: [embed], components: [makeRow(id), makeRow2(id)] });
          } catch (err) {
            if (err && err.rawError && err.rawError.code === 40060) {
              console.warn('help interaction update failed: already acknowledged, falling back to message.edit');
              await btn.message.edit({ embeds: [embed], components: [makeRow(id), makeRow2(id)] }).catch(e => console.error('fallback message.edit failed', e));
              return;
            }
            throw err;
          }

            // Fallback: attempt to update the interaction if possible
            try {
              await btn.update({ embeds: [embed], components: [makeRow(id), makeRow2(id)] });
              return;
            } catch (updateErr) {
              console.warn('help btn.update failed', updateErr);
              // Try fetching the message and editing it directly
              try {
                const fetched = await btn.message.channel.messages.fetch(btn.message.id);
                await fetched.edit({ embeds: [embed], components: [makeRow(id), makeRow2(id)] });
                return;
              } catch (fetchErr) {
                console.error('help fetch+edit fallback failed', fetchErr);
              }

              // Final fallback: tell the user the session expired
              try {
                await btn.reply({ content: 'This help session has expired and cannot be updated. Please run /help again.', flags: 64 });
              } catch (_) {}
            }

        } catch (e) {
          console.error('help interaction update failed', e);
          try { await btn.reply({ content: 'Sorry, I couldn\'t update the help message right now.', flags: 64 }); } catch(_){}
        }
      });

      collector.on('end', async () => {
        try {
          const disabledRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('help_economy').setLabel('Economy').setDisabled(true).setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('help_moderation').setLabel('Moderation').setDisabled(true).setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('help_fun').setLabel('Fun').setDisabled(true).setStyle(ButtonStyle.Secondary)
          );
          const disabledRow2 = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('help_utility').setLabel('Utility').setDisabled(true).setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('help_tickets').setLabel('Tickets').setDisabled(true).setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('help_home').setLabel('Home').setDisabled(true).setStyle(ButtonStyle.Secondary)
          );
          await sent.edit({ components: [disabledRow, disabledRow2] });
        } catch (_) {}
      });

    } catch (e) {
      console.error('help command error', e);
      try {
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp({ content: 'Sorry, I couldn\'t show the help menu right now. Please try again later.', flags: 64 });
        } else {
          await interaction.reply({ content: 'Sorry, I couldn\'t show the help menu right now. Please try again later.', flags: 64 });
        }
      } catch (_) {}
    }
  },
  helpers: { buildEmbeds, makeRow, makeRow2 }
};

