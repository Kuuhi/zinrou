// commands/message/build.js

const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database("./database.db");

const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

const promisifyDbGet = (db, query, params) => {
    return new Promise((resolve, reject) => {
        db.get(query, params, (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
};

const promisifyDbRun = (db, query, params) => {
    return new Promise((resolve, reject) => {
        db.run(query, params, function (err) {
            if (err) reject(err);
            else resolve(this);
        });
    });
};

module.exports = {
    name: 'build',
    aliases: ['b'],
    description: '新しいゲームルームを作成します。',
    adminOnly: false,

    async execute(client, message, args) {
        const ownerId = message.author.id;
        const guildId = message.guild.id;
        const channelId = message.channel.id;

        if (!channelId || !guildId) return;

        try {
            const player = await promisifyDbGet(db, 'SELECT * FROM player WHERE userId = ?', [ownerId]);

            if (!player) {
                return message.reply({ content: 'あなたはまだ登録されていません。先に登録してください。', allowedMentions: { repliedUser: false } });
            }

            if (player.joinRoomId) {
                return message.reply({ content: 'すでに別の部屋に参加しています。', allowedMentions: { repliedUser: false } });
            }

            const creatingMessage = await message.reply({ content: '作成中...', allowedMentions: { repliedUser: false } });

            const config = {
                'maxPlayers': 0, // 0は制限なし
                'showVoteTargets': false
            };
            const players = [
                {
                    'playerId': ownerId,
                    'role': null,
                    'isAlive': true,
                    'isGuarded': false,
                    'isBlack': false
                },
            ];

            // configとplayersオブジェクトをJSON文字列に変換してデータベースに保存
            const configString = JSON.stringify(config);
            const playersString = JSON.stringify(players);

            // roomテーブルに新しい部屋を挿入
            const insertResult = await promisifyDbRun(
                db,
                'INSERT INTO room (topUrl, ownerId, status, channelId, config, players) VALUES (?, ?, ?, ?, ?, ?)',
                [creatingMessage.url, ownerId, 'recruitment', channelId, configString, playersString]
            );

            const roomId = insertResult.lastID;

            // プレイヤーのjoinRoomIdを更新し、作成した部屋に紐付ける
            await promisifyDbRun(db, 'UPDATE player SET joinRoomId = ? WHERE userId = ?', [roomId, ownerId]);

            // 挿入した部屋の情報を取得（最新のデータを確認するため）
            const room = await promisifyDbGet(db, 'SELECT * FROM room WHERE id = ?', [roomId]);

            // configとplayersをJSONオブジェクトにパース
            const parsedConfig = JSON.parse(room.config);
            const parsedPlayers = JSON.parse(room.players);

            const formattedIds = parsedPlayers.map(p => `<@${p.playerId}>`).join('\n') || '現在参加者はいません。';

            const embed = new EmbedBuilder()
                .setColor(0x808080) // グレー色
                .setTitle('roomid: ' + room.id)
                .setDescription(
                    `オーナー: <@${room.ownerId}>\n` +
                    `最大人数: ${parsedConfig.maxPlayers === 0 ? '制限なし' : parsedConfig.maxPlayers}\n` +
                    `投票先: ${parsedConfig.showVoteTargets ? '開示する' : '開示しない'}`
                )
                .addFields(
                    { name: '現在参加者', value: formattedIds }
                );

            const joinButton = new ButtonBuilder()
                .setCustomId('joinRoom')
                .setLabel('参加')
                .setStyle(ButtonStyle.Success);
            const leaveButton = new ButtonBuilder()
                .setCustomId('leaveRoom')
                .setLabel('退出')
                .setStyle(ButtonStyle.Danger);
            const deleteButton = new ButtonBuilder()
                .setCustomId('deleteRoom')
                .setLabel('削除')
                .setStyle(ButtonStyle.Danger);
            const configButton = new ButtonBuilder()
                .setCustomId('configRoom')
                .setLabel('設定')
                .setStyle(ButtonStyle.Secondary);

            const row = new ActionRowBuilder()
                .addComponents(joinButton, leaveButton, deleteButton, configButton);

            await creatingMessage.edit({ content: '作成完了！', embeds: [embed], components: [row], allowedMentions: { repliedUser: false } });

        } catch (err) {
            console.error('データベースまたはDiscord APIエラーが発生しました:', err);
            return message.reply({ content: '部屋の作成中にエラーが発生しました。時間を置いて再度お試しください。', allowedMentions: { repliedUser: false } });
        }
    },
};
