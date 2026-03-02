require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord.js');

const token = process.env.DISCORD_TOKEN;
const clientId = process.env.CLIENT_ID;
let guildId = process.env.GUILD_ID;

if (!token || !clientId) {
  console.error('DISCORD_TOKEN and CLIENT_ID must be set in .env');
  process.exit(1);
}

// Validate GUILD_ID: if it's a placeholder or not a numeric snowflake, ignore it
if (guildId && !/^\d+$/.test(guildId)) {
  console.warn('WARNING: Invalid GUILD_ID in .env (not a numeric snowflake). Ignoring and registering global commands instead.');
  guildId = undefined;
}

const commands = [];
const commandsPath = path.join(__dirname, 'commands');
if (fs.existsSync(commandsPath)) {
  const commandFiles = fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'));
  for (const file of commandFiles) {
    const command = require(path.join(commandsPath, file));
    if (command.data) commands.push(command.data.toJSON ? command.data.toJSON() : command.data);
  }
} else {
  console.warn('No commands folder found at', commandsPath);
}

const rest = new REST({ version: '10' }).setToken(token);

(async () => {
  try {
    console.log(`Started refreshing ${commands.length} application (/) commands.`);
    if (guildId) {
      await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands });
      console.log(`Successfully registered guild commands for guild ${guildId}.`);
    } else {
      await rest.put(Routes.applicationCommands(clientId), { body: commands });
      console.log('Successfully registered global application commands. (May take up to 1 hour to propagate)');
    }
  } catch (error) {
    console.error(error);
  }
})();
