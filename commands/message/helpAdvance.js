// commands/message/helpAdvance.js

const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'helpAdvance',
    aliases: ['?+', 'help_Advance', 'help_advance', 'help+', 'h+'],
    description: '管理者向けのコマンドを含む、コマンドリストを表示します',
    adminOnly: false,

    async execute(client, message, args) {
        const prefix = process.env.PREFIX || '!';

        const displayedCommands = new Set();
        const commandsList = [];

        for (const [key, cmd] of client.prefixCommands) {
            if (!displayedCommands.has(cmd.name)) {

                if (cmd.adminOnly) {
                    commandsList.push(`\`${prefix}${cmd.name}\` - (管理者のみ)${cmd.description || '説明なし'}`);
                    displayedCommands.add(cmd.name);
                } else {
                    commandsList.push(`\`${prefix}${cmd.name}\` - ${cmd.description || '説明なし'}`);
                    displayedCommands.add(cmd.name);
                }

            }
        }

        const helpEmbed = new EmbedBuilder()
            .setColor(0x808080) // グレー色
            .setTitle('コマンド一覧')
            .setDescription(commandsList.length > 0 ? commandsList.join('\n') : '表示可能なコマンドがありません')
            .setFooter({ text: `prefix: ${prefix}` });

        await message.reply({ embeds: [helpEmbed], allowedMentions: { repliedUser: false } });
    },
};