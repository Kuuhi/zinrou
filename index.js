const { Client, GatewayIntentBits, Partials, EmbedBuilder, Collection, Events, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildBans,
        GatewayIntentBits.GuildEmojisAndStickers,
        GatewayIntentBits.GuildIntegrations,
        GatewayIntentBits.GuildWebhooks,
        GatewayIntentBits.GuildInvites,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildMessageTyping,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.DirectMessageReactions,
        GatewayIntentBits.DirectMessageTyping,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildScheduledEvents,
    ],
    partials: [
        Partials.User,
        Partials.Channel,
        Partials.GuildMember,
        Partials.Message,
        Partials.Reaction,
        Partials.GuildScheduledEvent,
        Partials.ThreadMember,
    ],
});

require('dotenv').config();

const fs = require('node:fs');
const path = require('node:path');

const sqlite3 = require("sqlite3");

const db = new sqlite3.Database("./database.db");

db.run(
    `CREATE TABLE IF NOT EXISTS player(
    userId VARCHAR,
    nick CHAR,
    admin BOOL DEFAULT FALSE,
    ban BOOL DEFAULT FALSE,
    warn JSON,
    createAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    joinRoomId VARCHAR,
    record JSON,
    exp INTEGER DEFAULT 0
    )`
);

db.run(
    `CREATE TABLE IF NOT EXISTS rooms(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR,
    description VARCHAR,
    ownerId TINYINT,
    password VARCHAR,
    createTime DATETIME DEFAULT CURRENT_TIMESTAMP,
    channelId VARCHAR,
    status VARCHAR,
    players JSON,
    roles JSON,
    config JSON,
    topURL VARCHAR
    )`
);

/*
db.run(
    `CREATE TABLE IF NOT EXISTS setting(
    guildId VARCHAR,
    prefix VARCHAR DEFAULT '!',
    logChannelId VARCHAR,
    )`
);
*/


process.on("uncaughtException", async (error) => {
    const errorMessage = error.message || error;

    console.error(error);

    const embed = new EmbedBuilder()
        .setColor(0x00FF00)
        .setTitle("エラー通知(未確認)")
        .setDescription(errorMessage)
        .setFooter({ text: new Date().toDateString() });
    const buttonA = new ButtonBuilder()
        .setCustomId("errorNotice_delete")
        .setLabel("削除")
        .setStyle(ButtonStyle.Danger);
    const buttonB = new ButtonBuilder()
        .setCustomId("errorNotice_hold")
        .setLabel("保留")
        .setStyle(ButtonStyle.Secondary);
    const buttonC = new ButtonBuilder()
        .setCustomId("errorNotice_resolution")
        .setLabel("解決")
        .setStyle(ButtonStyle.Success);
    const row = new ActionRowBuilder().addComponents(buttonA, buttonB, buttonC);

    await client.channels.cache.get(process.env.LOG_CAHNNEL_ID)?.send({ embeds: [embed], components: [row] });
});

// --- イベントの読み込みと登録 ---
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    const event = require(filePath);

    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args, client));
    } else {
        client.on(event.name, (...args) => event.execute(...args, client));
    }
}

client.prefixCommands = new Collection();

const messageCommandsPath = path.join(__dirname, 'commands', 'message');
const commandFiles = fs.readdirSync(messageCommandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(messageCommandsPath, file);
    const command = require(filePath);

    if ('name' in command && 'execute' in command) {
        client.prefixCommands.set(command.name, command);
        if (command.aliases && Array.isArray(command.aliases)) {
            for (const alias of command.aliases) {
                client.prefixCommands.set(alias, command);
            }
        }
    } else {
        console.warn(`[WARNING] The command at ${filePath} is missing a required "name" or "execute" property.`);
    }
}

const prefix = process.env.PREFIX || '!';

client.on(Events.MessageCreate, async (message) => {

    // プレフィックスコマンドの処理
    if (!message.author.bot && message.content.startsWith(prefix)) {
        const args = message.content.slice(prefix.length).trim().split(/ +/);
        const commandName = args.shift().toLowerCase();
        const command = client.prefixCommands.get(commandName);

        //プレイヤーデータでBANされていたら無視
        db.get('SELECT * FROM player WHERE userId = ?', [message.author.id], (err, row) => {
            if (err) console.error('Database error:', err);
            if (row && row.ban) return
        });

        if (!command) {
            return message.reply({ content: "コマンドが見つかりません", allowedMentions: { repliedUser: false } });
        }

        // 管理者専用コマンドの権限チェック
        if (command.adminOnly) {
            const requiredRoleId = process.env.ADMIN_ROLE_ID;

            // ユーザーが指定されたロールを持っているか確認
            if (!message.member.roles.cache.has(requiredRoleId)) {
                return message.reply({ content: "あなたの権限が不足しています", allowedMentions: { repliedUser: false } });
            }
        }

        try {
            await command.execute(client, message, args);
        } catch (error) {
            console.error(error);

            if (message.author.id === "777466773955936266") {
                const embed = new EmbedBuilder()
                    .setColor(0x0099FF)
                    .setDescription(`\`\`\`\n${error.message || error}\n\`\`\``)
                return message.reply({ content: "えらった！", embeds: [embed], allowedMentions: { repliedUser: false } });
            }
            await message.reply({ content: "えらった！", allowedMentions: { repliedUser: false } });
        }
    }
});

// スラッシュコマンドの読み込み
client.slashCommands = new Collection();
const slashCommandsPath = path.join(__dirname, 'commands', 'interaction', 'slash');
const slashCommandFiles = fs.readdirSync(slashCommandsPath).filter(file => file.endsWith('.js'));

for (const file of slashCommandFiles) {
    const filePath = path.join(slashCommandsPath, file);
    const command = require(filePath);
    if ('data' in command && 'execute' in command) {
        client.slashCommands.set(command.data.name, command);
    } else {
        console.warn(`[WARNING] The slash command at ${filePath} is missing a required "data" or "execute" property.`);
    }
}

// ボタンインタラクションの読み込み
client.buttonCommands = new Collection();
const buttonCommandsPath = path.join(__dirname, 'commands', 'interaction', 'button');
const buttonCommandFiles = fs.readdirSync(buttonCommandsPath).filter(file => file.endsWith('.js'));

for (const file of buttonCommandFiles) {
    const filePath = path.join(buttonCommandsPath, file);
    const command = require(filePath);
    if ('customId' in command && 'execute' in command) {
        client.buttonCommands.set(command.customId, command);
    } else {
        console.warn(`[WARNING] The button command at ${filePath} is missing a required "customId" or "execute" property.`);
    }
}

// セレクトメニューインタラクションの読み込み
client.selectMenuCommands = new Collection();
const selectMenuCommandsPath = path.join(__dirname, 'commands', 'interaction', 'selectmenu');
const selectMenuCommandFiles = fs.readdirSync(selectMenuCommandsPath).filter(file => file.endsWith('.js'));

for (const file of selectMenuCommandFiles) {
    const filePath = path.join(selectMenuCommandsPath, file);
    const command = require(filePath);
    if ('customId' in command && 'execute' in command) {
        client.selectMenuCommands.set(command.customId, command);
    } else {
        console.warn(`[WARNING] The select menu command at ${filePath} is missing a required "customId" or "execute" property.`);
    }
}

// モーダルインタラクションの読み込み
client.modalCommands = new Collection();
const modalCommandsPath = path.join(__dirname, 'commands', 'interaction', 'modal');
const modalCommandFiles = fs.readdirSync(modalCommandsPath).filter(file => file.endsWith('.js'));

for (const file of modalCommandFiles) {
    const filePath = path.join(modalCommandsPath, file);
    const command = require(filePath);
    if ('customId' in command && 'execute' in command) {
        client.modalCommands.set(command.customId, command);
    } else {
        console.warn(`[WARNING] The modal command at ${filePath} is missing a required "customId" or "execute" property.`);
    }
}

// インタラクションの処理
client.on(Events.InteractionCreate, async interaction => {

    //プレイヤーデータでBANされていたら無視
    db.get('SELECT * FROM player WHERE userId = ?', [interaction.user.id], (err, row) => {
        if (err) console.error('Database error:', err);
        if (row && row.ban) return
    });

    // スラッシュコマンド、ボタン、セレクトメニュー、モーダルの処理
    if (interaction.isChatInputCommand()) {
        const command = client.slashCommands.get(interaction.commandName);

        if (!command) return;

        // 管理者専用コマンドの権限チェック (スラッシュコマンド版)
        if (command.adminOnly) {
            const requiredRoleId = process.env.ADMIN_ROLE_ID;
            if (!interaction.member.roles.cache.has(requiredRoleId)) {
                return interaction.reply({ content: "あなたの権限が不足しています", flags: 64 });
            }
        }

        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(error);
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ content: 'えらった！', flags: 64 });
            } else {
                await interaction.reply({ content: 'えらった！', flags: 64 });
            }
        }
    } else if (interaction.isButton()) {
        // customIdを最初の'_'で分割し、コマンド名と引数文字列を取得
        const customIdParts = interaction.customId.split('_', 2);

        const commandName = customIdParts[0]; // コマンド名
        const command = client.buttonCommands.get(commandName);

        if (!command) return;

        // 引数部分を抽出し、'_'で分割して配列にする
        let args = [];
        if (customIdParts.length > 1) {
            args = customIdParts[1].split('_'); // 2番目の要素（引数文字列）を'_'で分割
        }

        // 管理者専用ボタンの権限チェック
        if (command.adminOnly) {
            const requiredRoleId = process.env.ADMIN_ROLE_ID;
            if (!interaction.member.roles.cache.has(requiredRoleId)) {
                return interaction.reply({ content: "あなたの権限が不足しています", flags: 64 });
            }
        }

        try {
            await command.execute(interaction, args);
        } catch (error) {
            console.error(error);
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ content: 'えらった！', flags: 64 });
            } else {
                await interaction.reply({ content: 'えらった！', flags: 64 });
            }
        }
    } else if (interaction.isStringSelectMenu()) {
        // customIdを_で区切った最初の部分をコマンド名として扱う
        const commandName = interaction.customId.split('_')[0];
        const command = client.selectMenuCommands.get(commandName);

        if (!command) return;

        // 管理者専用セレクトメニューの権限チェック
        if (command.adminOnly) {
            const requiredRoleId = process.env.ADMIN_ROLE_ID;
            if (!interaction.member.roles.cache.has(requiredRoleId)) {
                return interaction.reply({ content: "あなたの権限が不足しています", flags: 64 });
            }
        }

        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(error);
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ content: 'えらった！', flags: 64 });
            } else {
                await interaction.reply({ content: 'えらった！', flags: 64 });
            }
        }
    } else if (interaction.isModalSubmit()) {
        // customIdを_で区切った最初の部分をコマンド名として扱う
        const commandName = interaction.customId.split('_')[0];
        const command = client.modalCommands.get(commandName);

        if (!command) return;

        // 管理者専用モーダルの権限チェック
        if (command.adminOnly) {
            const requiredRoleId = process.env.ADMIN_ROLE_ID;
            if (!interaction.member.roles.cache.has(requiredRoleId)) {
                return interaction.reply({ content: "あなたの権限が不足しています", flags: 64 });
            }
        }

        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(error);
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ content: 'えらった！', flags: 64 });
            } else {
                await interaction.reply({ content: 'えらった！', flags: 64 });
            }
        }
    }
});

client.login(process.env.BOT_TOKEN);