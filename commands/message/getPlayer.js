// commands\message\getPlayer.js

const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database("./database.db");

const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'getPlayer',
    aliases: ['gp', 'player', 'getplayer', 'p'],
    description: 'プレイヤー情報を取得します',
    adminOnly: false,

    async execute(client, message, args) {


        // コマンド実行者のデータ取得
        db.get('SELECT * FROM player WHERE userId = ?', [message.author.id], (err, data) => {

            if (err) {
                console.error('Database error:', err);
                return message.reply({ content: 'データベースエラーが発生しました。時間を置いて再度お試しください。', allowedMentions: { repliedUser: false } });
            }
            if (!data) return

            if (data.admin && args[0]) {

                const targetId = args[0].replace(/<@!?(\d+)>/, '$1') || args[0];

                // ターゲットのデータを取得・送信
                db.get('SELECT * FROM player WHERE userId = ?', [targetId], (err, data) => {

                    if (err) {
                        console.error('Database error:', err);
                        return message.reply({ content: 'データベースエラーが発生しました。時間を置いて再度お試しください。', allowedMentions: { repliedUser: false } });
                    }
                    if (!data) {
                        return message.reply({ content: 'データが見つかりませんでした', allowedMentions: { repliedUser: false } });
                    }

                    const embed = new EmbedBuilder()
                        .setColor(0x808080)
                        .setAuthor({ name: message.author.name, iconURL: message.author.iconURL() })
                        .setDescription(`userId: ${data.userId}\nnick: ${data.nick}\nadmin: ${data.admin ? 'はい' : 'いいえ'}\nban: ${data.ban ? 'はい' : 'いいえ'}\ncreateAt: ${data.createAt}\njoinRoomId: ${data.joinRoomId ? joinRoomId : "-"}\nexp: ${data.exp}`)

                    message.reply({ embeds: [embed], allowedMentions: { repliedUser: false } });

                })

            } else {

                // ターゲットが指定されていない場合は実行者のデータを送信
                const embed = new EmbedBuilder()
                    .setColor(0x808080)
                    .setAuthor({ name: message.author.username, iconURL: message.author.avatarURL() })
                    .setDescription(`userId: ${data.userId}\nnick: ${data.nick}\nadmin: ${data.admin ? 'はい' : 'いいえ'}\nban: ${data.ban ? 'はい' : 'いいえ'}\ncreateAt: ${data.createAt}\njoinRoomId: ${data.joinRoomId ? joinRoomId : "-"}\nexp: ${data.exp}`)

                message.reply({ embeds: [embed], allowedMentions: { repliedUser: false } });

            }
        });
    }
};