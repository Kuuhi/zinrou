// commands\message\getPlayer.js   あとで精査

const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database("./database.db");

module.exports = {
    name: 'getPlayer',
    aliases: ['gp', 'player', 'getplayer'],
    description: 'プレイヤー情報を取得します',
    adminOnly: false,

    async execute(client, message, args) {

        const ownerId = message.author.id;
        const guildId = message.guild.id;
        const channelId = message.channel.id;

        if (!channelId) return;
        if (!guildId) return;

        // ユーザーがすでに登録されているか確認とデータ取得

        if (args[0]) {
            // 引数が指定されている場合は、そのユーザーの情報を取得(adminのみ)

            //実行者が管理者か確認
            db.get('SELECT * FROM player WHERE userId = ?', [ownerId], (err, data) => {

                if (err) {
                    console.error('Database error:', err);
                    return message.reply({ content: 'データベースエラーが発生しました。時間を置いて再度お試しください。', allowedMentions: { repliedUser: false } });
                }
                if (!data || !data.admin) return

            });

            const targetId = args[0].replace(/<@!?(\d+)>/, '$1') || args[0]; // ユーザーIDを取得

            db.get('SELECT * FROM player WHERE userId = ?', [targetId], (err, data) => {

                if (err) {
                    console.error('Database error:', err);
                    return message.reply({ content: 'データベースエラーが発生しました。時間を置いて再度お試しください。', allowedMentions: { repliedUser: false } });
                }
                if (!data) {
                    return message.reply({ content: '指定されたユーザーは登録されていません。', allowedMentions: { repliedUser: false } });
                }

                const playerInfo = `
            ユーザーID: ${data.userId}
            ニックネーム: ${data.nick}
            管理者: ${data.admin ? 'はい' : 'いいえ'}
            参加中の部屋ID: ${data.joinRoomId}
            バン状態: ${data.ban}
            経験値: ${data.exp}
            `;

                message.reply({ content: playerInfo, allowedMentions: { repliedUser: false } });
            });
        } else {

            // 引数が指定されていない場合は、コマンドを実行したユーザーの情報を取得
            db.get('SELECT * FROM player WHERE userId = ?', [ownerId], (err, data) => {

                if (err) {
                    console.error('Database error:', err);
                    return message.reply({ content: 'データベースエラーが発生しました。時間を置いて再度お試しください。', allowedMentions: { repliedUser: false } });
                }
                if (!data) {
                    return message.reply({ content: 'ユーザーが登録されていません。', allowedMentions: { repliedUser: false } });
                }

                const playerInfo = `
            ユーザーID: ${data.userId}
            ニックネーム: ${data.nick}
            管理者: ${data.admin ? 'はい' : 'いいえ'}
            バン状態: ${data.ban}
            経験値: ${data.exp}
            `;

                message.reply({ content: playerInfo, allowedMentions: { repliedUser: false } });
            });
        }
    }
};