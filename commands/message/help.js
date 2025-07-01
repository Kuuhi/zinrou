// commands/message/help.js

const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'help',
    aliases: ['?','h'],
    description: '利用可能なコマンドのリストを表示します。',
    adminOnly: false,

    async execute(client, message, args) {
        const prefix = process.env.PREFIX || '!';

        const displayedCommands = new Set();
        const commandsList = [];

        for (const [key, cmd] of client.prefixCommands) {
            if (cmd.adminOnly) { // adminOnly が true のコマンドはスキップ
                continue;
            }

            if (!displayedCommands.has(cmd.name)) {
                commandsList.push(`\`${prefix}${cmd.name}\` - ${cmd.description || '説明なし'}`);
                displayedCommands.add(cmd.name);
            }
        }

        const helpEmbed = new EmbedBuilder()
            .setColor(0x808080) // グレー色
            .setTitle('利用可能なコマンド')
            .setDescription(commandsList.length > 0 ? commandsList.join('\n') : '現在、利用可能なコマンドはありません。')
            .setFooter({ text: `prefix: ${prefix}` });

        await message.reply({ embeds: [helpEmbed], allowedMentions: { repliedUser: false } });
    },
};