// commands\message\addAdmin.js

const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database("./database.db");

module.exports = {
    name: 'addAdmin',
    aliases: ['aa', 'addadmin'],
    description: '管理者を追加します',
    adminOnly: true,

    async execute(client, message, args) {

        const ownerId = message.author.id;
        const guildId = message.guild.id;
        const channelId = message.channel.id;

        if (!channelId) return;
        if (!guildId) return;

        // ユーザーがすでに登録されているか確認とデータ取得
        db.get('SELECT * FROM player WHERE userId = ?', [ownerId], (err, data) => {
            if (err) {
                console.error('Database error:', err);
                return message.reply({ content: 'データベースエラーが発生しました。時間を置いて再度お試しください。', allowedMentions: { repliedUser: false } });
            }

            if (!data) {
                return message.reply({ content: 'ユーザーが登録されていません。', allowedMentions: { repliedUser: false } });
            }

            // 管理者権限を追加
            db.run('UPDATE player SET admin = ? WHERE userId = ?', [true, ownerId], function(err) {
                if (err) {
                    console.error('Database error:', err);
                    return message.reply({ content: 'データベースエラーが発生しました。時間を置いて再度お試しください。', allowedMentions: { repliedUser: false } });
                }

                message.reply({ content: '管理者権限を追加しました。', allowedMentions: { repliedUser: false } });
            });
        });

    }
};