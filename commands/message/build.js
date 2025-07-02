// commands/message/build.js

const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database("./database.db");

const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    name: 'build',
    aliases: ['b'],
    description: '',
    adminOnly: false,

    async execute(client, message, args) {

        const ownerId = message.author.id;
        const guildId = message.guild.id;
        const channelId = message.channel.id;

        if (!channelId) return
        if (!guildId) return

        // ユーザーがすでに登録されているか確認とデータ取得
        db.get('SELECT * FROM player WHERE userId = ?', [ownerId], (err, data) => {

            if (!data) return
            if (err) {
                console.error('Database error:', err);
                return message.reply({ content: 'データベースエラーが発生しました。時間を置いて再度お試しください。', allowedMentions: { repliedUser: false } });
            }

            if (data.joinRoomId) return message.reply({ content: 'すでに別の部屋に参加しています', allowedMentions: { repliedUser: false } });
            
            /*
            db.run('UPDATE player SET joinRoomId = ? WHERE userId = ?', [guildId, ownerId], function(err) {

                if (err) {
                    console.error('Database error:', err);
                    return message.reply({ content: 'データベースエラーが発生しました。時間を置いて再度お試しください。', allowedMentions: { repliedUser: false } });
                }

                const embed = new EmbedBuilder()
                    .setColor('#0099ff')
                    .setTitle('部屋参加')
                    .setDescription(`あなたは部屋 ${guildId} に参加しました。`);

                const row = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('leaveRoom')
                            .setLabel('部屋から退出')
                            .setStyle(ButtonStyle.Danger)
                    );

                message.reply({ embeds: [embed], components: [row], allowedMentions: { repliedUser: false } });
            });
            */

        });

    },
};