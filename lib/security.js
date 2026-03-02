const inviteRegex = /(?:https?:\/\/)?(?:www\.)?(?:discord\.gg|discordapp\.com\/invite)\/\w+/i;

module.exports = function initSecurity(client) {
  // basic in-memory anti-spam: counts messages per user in short window
  const recentMessages = new Map();
  const SPAM_WINDOW_MS = parseInt(process.env.SPAM_WINDOW_MS) || 8000; // window length
  const SPAM_LIMIT = parseInt(process.env.SPAM_LIMIT) || 6; // messages in window

  client.on('messageCreate', async message => {
    try {
      if (message.author.bot) return;
      const member = message.member;

      // Invite link filter (unless mod or admin)
      if (inviteRegex.test(message.content)) {
        if (!member.permissions.has('ManageGuild') && !member.permissions.has('Administrator')) {
          await message.delete().catch(()=>{});
          const warnMsg = await message.channel.send(`${message.author}, posting invite links is not allowed.`).catch(()=>null);
          // log to mod channel if configured
          if (process.env.MOD_LOG_CHANNEL_ID) {
            const ch = await message.guild.channels.fetch(process.env.MOD_LOG_CHANNEL_ID).catch(()=>null);
            if (ch) ch.send(`Deleted invite from ${message.author.tag} in ${message.channel}`);
          }
          if (warnMsg) setTimeout(()=>warnMsg.delete().catch(()=>{}), 5000);
          return;
        }
      }

      // spam tracking
      const arr = recentMessages.get(message.author.id) || [];
      arr.push(Date.now());
      const now = Date.now();
      const filtered = arr.filter(t => now - t < SPAM_WINDOW_MS);
      recentMessages.set(message.author.id, filtered);
      if (filtered.length > SPAM_LIMIT) {
        // warn user and optionally timeout/kick if configured
        await message.channel.send(`${message.author}, please stop spamming.`).catch(()=>{});
        // reset their count
        recentMessages.set(message.author.id, []);
      }
    } catch (e) {
      console.error('security messageCreate error', e);
    }
  });

  client.on('guildMemberAdd', async member => {
    try {
      const minDays = parseInt(process.env.MIN_ACCOUNT_AGE_DAYS) || 3;
      const ageDays = (Date.now() - member.user.createdTimestamp) / (24*60*60*1000);
      if (ageDays < minDays) {
        // auto-kick suspiciously new account
        await member.kick(`Account age ${ageDays.toFixed(2)}d less than ${minDays}d`).catch(()=>{});
        if (process.env.MOD_LOG_CHANNEL_ID) {
          const ch = await member.guild.channels.fetch(process.env.MOD_LOG_CHANNEL_ID).catch(()=>null);
          if (ch) ch.send(`Kicked ${member.user.tag} on join (account age ${ageDays.toFixed(2)} days)`).catch(()=>{});
        }
      }
    } catch (e) {
      console.error('security guildMemberAdd error', e);
    }
  });
};

