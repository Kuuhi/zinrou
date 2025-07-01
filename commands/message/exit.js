// commands/message/exit.js

module.exports = {
  name: 'exit',
  aliases: ['reboot'],
  adminOnly: true,
  description: 'exitを呼び出すよ',

  async execute(client, message, args) {
    const adminRoleId = process.env.ADMIN_ROLE_ID;
    if (!message.member || !message.member.roles.cache.has(adminRoleId)) {
      return
    }

    await message.react("✅")
    const exitCode = Number(args[0]) || 0;
    process.exit(exitCode);
  },
};