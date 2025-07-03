// commands/interaction/button/deleteRoom.js

const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database("./database.db");

const { EmbedBuilder } = require('discord.js');

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
    customId: 'deleteRoom',
    description: 'ゲームルームを削除します。',
    adminOnly: false,

    async execute(interaction, args) {

        await interaction.deferUpdate();

        const messageUrl = interaction.message.url;
        const userId = interaction.user.id;

        // topUrlから部屋のレコードを取得
        const room = await promisifyDbGet(db, 'SELECT * FROM room WHERE topUrl = ?', [messageUrl]);

        if (!room) {
            return interaction.followUp({ content: 'この部屋はすでに存在しないか、削除されています。', ephemeral: true });
        }
        if (room.ownerId !== userId) {
            return interaction.followUp({ content: '部屋を削除できるのはオーナーのみです。', ephemeral: true });
        }

        // 部屋に参加しているプレイヤーのjoinRoomIdをNULLに更新
        // データベースに保存されているplayersはJSON文字列なのでパースする
        const parsedPlayers = JSON.parse(room.players);
        const playerIdsInRoom = parsedPlayers.map(p => p.playerId);

        // 部屋にいる各プレイヤーデータのjoinRoomIdをNULLに設定
        for (const playerId of playerIdsInRoom) {
            await promisifyDbRun(db, 'UPDATE player SET joinRoomId = NULL WHERE userId = ?', [playerId]);
        }

        await promisifyDbRun(db, 'DELETE FROM room WHERE id = ?', [room.id]);

        const deletedEmbed = new EmbedBuilder()
            .setColor(0xFF0000) // 赤色
            .setTitle('部屋が削除されました')
            .setDescription(`ルームID: \`${room.id}\` は正常に削除されました`);

        await interaction.message.edit({
            content: '',
            embeds: [deletedEmbed],
            components: [],
        });

    },
};
