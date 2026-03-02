require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Client, GatewayIntentBits, Collection, Partials, MessageFlags } = require('discord.js');
const { Player } = require('discord-player');

const token = process.env.DISCORD_TOKEN;
if (!token) {
  console.error('Missing DISCORD_TOKEN in .env');
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildVoiceStates
  ],
  partials: [Partials.Channel]
});

// Initialize music player
const player = new Player(client);
client.player = player;

// Register extractors - use built-in extractors
(async () => {
  await player.extractors.loadMulti(['play-ht', 'youtube', 'spotify']);
})().catch(err => console.error('Failed to load extractors:', err));

client.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');
if (fs.existsSync(commandsPath)) {
  const commandFiles = fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'));
  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    if (command.data && command.execute) {
      client.commands.set(command.data.name, command);
    }
  }
} else {
  console.warn('No commands folder found at', commandsPath);
}

// --- Prefix-based message commands
client.msgCommands = new Collection();
const msgCommandsPath = path.join(__dirname, 'msgCommands');
const PREFIX = process.env.PREFIX || '!';
if (fs.existsSync(msgCommandsPath)) {
  const msgFiles = fs.readdirSync(msgCommandsPath).filter(f => f.endsWith('.js'));
  for (const file of msgFiles) {
    const filePath = path.join(msgCommandsPath, file);
    const cmd = require(filePath);
    if (cmd.name && cmd.execute) client.msgCommands.set(cmd.name, cmd);
  }
} else {
  console.warn('No message commands folder at', msgCommandsPath);
}

client.on('messageCreate', async message => {
  try {
    if (message.author.bot) return;
    if (!message.guild) return; // ignore DMs
    if (!message.content.startsWith(PREFIX)) return;

    const args = message.content.slice(PREFIX.length).trim().split(/\s+/);
    const commandName = args.shift().toLowerCase();
    const command = client.msgCommands.get(commandName);
    if (!command) return;

    await command.execute(message, args, client);
  } catch (e) {
    console.error('prefix command error', e);
  }
});

client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}`);
  try {
    const desiredName = 'HAUNTED';
    if (client.user.username !== desiredName) {
      await client.user.setUsername(desiredName);
      console.log(`Username changed to ${desiredName}`);
    }
  } catch (e) {
    console.error('Failed to set username:', e);
  }
});

// Initialize security protections (invite filter, spam detector, new-account protection)
try {
  require('./lib/security')(client);
  console.log('Security module initialized');
} catch (e) {
  console.error('Failed to initialize security module:', e);
}

// Initialize ticket system
try {
  const ticketManager = require('./lib/tickets');
  ticketManager.init(client);
  console.log('Ticket system initialized');
} catch (e) {
  console.error('Failed to initialize ticket system:', e);
}

client.on('interactionCreate', async interaction => {
  // first, handle our help menu buttons globally so collectors/sessions survive restarts
  if (interaction.isButton && interaction.customId && interaction.customId.startsWith('help_')) {
    const helpCmd = client.commands.get('help');
    if (helpCmd && helpCmd.helpers) {
      const PREFIX = process.env.PREFIX || '!';
      const embeds = helpCmd.helpers.buildEmbeds(PREFIX);
      const id = interaction.customId.split('_').pop();
      const embed = embeds[id] || embeds.home;
      try {
        const orig = interaction.message.interaction && interaction.message.interaction.user && interaction.message.interaction.user.id;
        if (orig && interaction.user.id !== orig) {
          await interaction.reply({ content: 'This help session belongs to the command sender.', flags: 64 });
          return;
        }
        await interaction.update({ embeds: [embed], components: [helpCmd.helpers.makeRow(id), helpCmd.helpers.makeRow2(id)] });
      } catch (err) {
        console.error('global help button handler failed', err);
      }
      return;
    }
  }

  // Route ticket-related component and modal interactions to the ticket manager
  try {
    if (interaction.isButton() || interaction.isModalSubmit()) {
      if (client.ticketManager && typeof client.ticketManager.handleInteraction === 'function') {
        await client.ticketManager.handleInteraction(interaction);
        return;
      }
    }
  } catch (e) {
    console.error('ticket interaction routing error', e);
  }

  if (!interaction.isChatInputCommand()) return;
  const command = client.commands.get(interaction.commandName);
  if (!command) return;
  try {
    await command.execute(interaction, client);
  } catch (err) {
    console.error(err);
    try {
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ content: 'There was an error while executing this command!', flags: MessageFlags.Ephemeral });
      } else {
        await interaction.reply({ content: 'There was an error while executing this command!', flags: MessageFlags.Ephemeral });
      }
    } catch (replyErr) {
      console.error('Failed to send error response to interaction:', replyErr);
    }
  }
});

client.login(token);
