// commands/message/register.js

const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database("./database.db");

const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    name: 'register',
    aliases: ['signup', 'registerUser'],
    description: '新規ユーザー登録を行います',
    adminOnly: false,

    async execute(client, message, args) {

        const userId = message.author.id;
        const userName = message.author.username;

        // ユーザーがすでに登録されているか確認
        db.get('SELECT * FROM player WHERE userId = ?', [userId], (err, data) => {

            if (err) {
                console.error('Database error:', err);
                return message.reply('データベースエラーが発生しました。時間を置いて再度お試しください。');
            }

            if (data) {
                return message.reply('あなたはすでに登録されています。');
            }

            // 保存する情報を提示し、登録してよいか確認する
            const embed = new EmbedBuilder()
                .setColor(0x808080) // グレー色
                .setTitle('新規ユーザー登録')
                .setDescription(`
                    当BOTはあなたの以下の情報をプレイヤーデータと紐づけします。
                    \\- あなたのuserID
                    \\- あなたのユーザー名\n
                    この情報は、ゲームの進行や管理に使用されます。
                    - 以下の情報で登録を行います。
                    \n**ユーザーID:** ${userId}\n**ユーザー名:** ${userName}
                    この内容で登録してもよろしいですか？
                    `)
                .setFooter({ text: '30秒でタイムアウトします。' });

            const button = new ButtonBuilder()
                .setCustomId('registration')
                .setLabel('はい')
                .setStyle(ButtonStyle.Primary);
            const cancelButton = new ButtonBuilder()
                .setCustomId('cancelRegistration')
                .setLabel('キャンセル')
                .setStyle(ButtonStyle.Danger);
            const row = new ActionRowBuilder()
                .addComponents(button, cancelButton);

            // ユーザーに登録内容を確認するメッセージを送信
            message.reply({ embeds: [embed], components: [row], allowedMentions: { repliedUser: false } })
                .then(sentMessage => {

                    // ボタンのクリックを待機
                    const filter = i => i.customId === 'registration' || i.customId === 'cancelRegistration';
                    const collector = sentMessage.createMessageComponentCollector({ filter, time: 30000 });

                    collector.on('collect', async interaction => {
                        if (interaction.customId === 'registration') {
                            // ユーザー登録処理
                            db.run('INSERT INTO player (userId, nick) VALUES (?, ?)', [userId, userName], function (err) {
                                if (err) {
                                    console.error('Database error:', err);
                                    return interaction.reply({ content: '登録中にエラーが発生しました。', ephemeral: true });
                                }
                                sentMessage.edit({
                                    content: 'ユーザー登録が完了しました！',
                                    embeds: [],
                                    components: []
                                });
                            });
                        } else if (interaction.customId === 'cancelRegistration') {
                            // 登録キャンセル
                            sentMessage.edit({
                                content: 'キャンセルされました',
                                embeds: [],
                                components: []
                            });
                        }
                    });

                    collector.on('end', collected => {
                        if (collected.size === 0) {
                            const timeoutEmbed = new EmbedBuilder()
                                .setColor(0xFF0000) // 赤色
                                .setDescription('登録確認の時間が過ぎました。再度コマンドを実行してください。');

                            const button = new ButtonBuilder()
                                .setCustomId('registration')
                                .setLabel('はい')
                                .setStyle(ButtonStyle.Primary)
                                .setDisabled(true);
                            const cancelButton = new ButtonBuilder()
                                .setCustomId('cancelRegistration')
                                .setLabel('キャンセル')
                                .setStyle(ButtonStyle.Danger)
                                .setDisabled(true);
                            const row = new ActionRowBuilder()
                                .addComponents(button, cancelButton);

                            sentMessage.edit({
                                embeds: [timeoutEmbed],
                                components: [row],
                            });
                        }
                    });
                })
        });
    },
};