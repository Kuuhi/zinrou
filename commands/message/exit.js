// commands/message/exit.js

module.exports = {
  name: 'exit',
  aliases: ['reboot'],
  adminOnly: true,
  description: 'exitを呼び出すよ',

  async execute(client, message, args) {

    const adminRoleId = process.env.ADMIN_ROLE_ID;

    if (!message.member || !message.member.roles.cache.has(adminRoleId)) return

    const exitCode = Number(args[0]) || 0;

    db.close((err) => {
      if (err) {
        console.error("Database closing error:", err.message);
      }
      message.react("✅")
      console.log('Database connection closed.');
      process.exit(exitCode);
    });

  },
};