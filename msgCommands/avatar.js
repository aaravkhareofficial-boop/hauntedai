module.exports = {
  name: 'avatar',
  description: 'Show avatar of a user',
  async execute(message, args) {
    const target = message.mentions.users.first() || message.author;
    const url = target.displayAvatarURL({ dynamic: true, size: 512 });
    await message.channel.send(`${target.tag}'s avatar: ${url}`).catch(()=>{});
  }
};
