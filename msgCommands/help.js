const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
  name: 'help',
  description: 'Show available prefix commands',
  async execute(message, args) {
    const PREFIX = process.env.PREFIX || '!';
    try {
      // Build category embeds
      const headerUrl = 'https://media.discordapp.net/attachments/1459515479315189879/1477599970294108221/3daadc8f4d799b474f1897298803b5fa.jpg?ex=69a559b5&is=69a40835&hm=0193e6086a8ccab984fa2ba3d2cbe7942ec554a89822fb3541d0e5db588659d0&=&format=webp&width=1101&height=437';
      const embeds = {
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
            { name: '!balance', value: 'Check your balance', inline: true },
            { name: '!daily', value: 'Claim daily rewards', inline: true },
            { name: '!pay', value: 'Send money to another user', inline: true },
            { name: '!addmoney', value: '(Admin) Add money to a user', inline: true },
            { name: '!coinflip', value: 'Flip a coin and bet money', inline: true }
          )
          .setFooter({ text: 'Use the buttons below to switch categories' }),
        moderation: new EmbedBuilder()
          .setTitle('Moderation')
          .setColor(0x000000)
          .setImage(headerUrl)
          .addFields(
            { name: '!ban', value: 'Ban a user', inline: true },
            { name: '!unban', value: 'Unban by ID', inline: true },
            { name: '!kick', value: 'Kick a user', inline: true },
            { name: '!mute', value: 'Mute/timeout a user (optional minutes)', inline: true },
            { name: '!unmute', value: 'Remove a user timeout', inline: true },
            { name: '!timeout', value: 'Timeout a user for specified minutes', inline: true },
            { name: '!untimeout', value: 'Remove a user timeout', inline: true },
            { name: '!purge', value: 'Delete messages', inline: true },
            { name: '!lock', value: 'Lock a channel', inline: true },
            { name: '!unlock', value: 'Unlock a channel', inline: true },
            { name: '!nuke', value: 'Delete and recreate channel with same permissions', inline: true }
          )
          .setFooter({ text: 'Use the buttons below to switch categories' }),
        fun: new EmbedBuilder()
          .setTitle('Fun')
          .setColor(0x000000)
          .setImage(headerUrl)
          .addFields(
            { name: '!hug', value: 'Hug a user', inline: true },
            { name: '!huzz', value: 'Compliment how someone looks', inline: true },
            { name: '!slap', value: 'Slap a user', inline: true },
            { name: '!meme', value: 'Get a meme', inline: true },
            { name: '!roll', value: 'Roll a random number', inline: true },
            { name: '!say', value: 'Make the bot say something', inline: true }
          )
          .setFooter({ text: 'Use the buttons below to switch categories' }),
        utility: new EmbedBuilder()
          .setTitle('Utility')
          .setColor(0x000000)
          .setImage(headerUrl)
          .addFields(
            { name: '!ping', value: 'Check bot speed', inline: true },
            { name: '!avatar', value: 'Get a user avatar', inline: true },
            { name: '!userinfo', value: 'Get user info', inline: true },
            { name: '!serverinfo', value: 'Get server info', inline: true },
            { name: '!help', value: 'Open this help menu', inline: true }
          )
          .setFooter({ text: 'Use the buttons below to switch categories' }),
        tickets: new EmbedBuilder()
          .setTitle('Tickets')
          .setColor(0x000000)
          .setImage(headerUrl)
          .addFields(
            { name: '!ticket', value: 'Open or manage a support ticket', inline: false }
          )
          .setFooter({ text: 'Use the buttons below to switch categories' })
      };

      // Buttons
      const makeRow = (selected) => new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('help_economy').setLabel('Economy').setStyle(selected === 'economy' ? ButtonStyle.Primary : ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('help_moderation').setLabel('Moderation').setStyle(selected === 'moderation' ? ButtonStyle.Primary : ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('help_fun').setLabel('Fun').setStyle(selected === 'fun' ? ButtonStyle.Primary : ButtonStyle.Secondary)
      );
      const makeRow2 = (selected) => new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('help_utility').setLabel('Utility').setStyle(selected === 'utility' ? ButtonStyle.Primary : ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('help_tickets').setLabel('Tickets').setStyle(selected === 'tickets' ? ButtonStyle.Primary : ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('help_home').setLabel('Home').setStyle(selected === 'home' ? ButtonStyle.Primary : ButtonStyle.Secondary)
      );

      const sent = await message.channel.send({ embeds: [embeds.home], components: [makeRow('home'), makeRow2('home')] });

      const collector = sent.createMessageComponentCollector({ time: 5 * 60 * 1000 });
      collector.on('collect', async btn => {
        try {
          if (!btn.isButton()) return;
          // restrict to the command invoker to avoid confusion
          if (btn.user.id !== message.author.id) return btn.reply({ content: 'This help session belongs to the command sender.', flags: 64 }).catch(()=>{});
          const id = btn.customId.split('_').pop();
          const embed = embeds[id] || embeds.home;
          try {
            await btn.update({ embeds: [embed], components: [makeRow(id), makeRow2(id)] });
          } catch (err) {
            // If interaction has already been acknowledged, fall back to editing the message directly
            if (err && err.rawError && err.rawError.code === 40060) {
              console.warn('help interaction update failed: already acknowledged, falling back to message.edit');
              await btn.message.edit({ embeds: [embed], components: [makeRow(id), makeRow2(id)] }).catch(e => console.error('fallback message.edit failed', e));
              return;
            }
            throw err;
          }
        } catch (e) {
          console.error('help interaction update failed', e);
          try { await btn.reply({ content: 'Sorry, I couldn\'t update the help message right now.', flags: 64 }); } catch(_){}
        }
      });

      collector.on('end', async () => {
        // disable buttons to avoid stale components
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
      try { await message.reply('Sorry, I couldn\'t show the help menu right now. Please try again later.'); } catch(_){}
    }
  }
};
