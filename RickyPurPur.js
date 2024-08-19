const baileys = require("@whiskeysockets/baileys");
const fs = require("fs");
const util = require("util");
const chalk = require("chalk");
const axios = require("axios");

// Constants
const BOT_OWNER = '6283894391287';
const NO_BOT = '6283873321433';
const BOT_GROUP = 'https://chat.whatsapp.com/D6bHVUjyGj06bb6iZeUsOI';

module.exports = sansekai = async (client, m, chatUpdate) => {
    try {
        const getMessageBody = () => {
            switch (m.mtype) {
                case "conversation":
                    return m.message.conversation;
                case "imageMessage":
                    return m.message.imageMessage.caption;
                case "videoMessage":
                    return m.message.videoMessage.caption;
                case "extendedTextMessage":
                    return m.message.extendedTextMessage.text;
                case "buttonsResponseMessage":
                    return m.message.buttonsResponseMessage.selectedButtonId;
                case "listResponseMessage":
                    return m.message.listResponseMessage.singleSelectReply.selectedRowId;
                case "templateButtonReplyMessage":
                    return m.message.templateButtonReplyMessage.selectedId;
                case "messageContextInfo":
                    return m.message.buttonsResponseMessage?.selectedButtonId ||
                        m.message.listResponseMessage?.singleSelectReply.selectedRowId || m.body;
                default:
                    return "";
            }
        };

        // Avoid processing view once messages
        if (m.mtype === "viewOnceMessageV2") return;

        const body = getMessageBody();
        const isCommand = /^[\\/!#.]/gi.test(body);
        const prefix = isCommand ? body.match(/^[\\/!#.]/gi) : "/";
        const command = isCommand ? body.slice(prefix.length).trim().split(/\s+/).shift().toLowerCase() : null;
        const args = body.trim().split(/\s+/).slice(1);
        const sender = m.sender;
        const pushname = m.pushName || "No Name";
        const botNumber = await client.decodeJid(client.user.id);
        const itsMe = sender === botNumber;
        const from = m.chat;
        const groupMetadata = m.isGroup ? await client.groupMetadata(from).catch(() => undefined) : undefined;
        const groupName = groupMetadata ? groupMetadata.subject : '';

        // Logging
        if (isCommand && !m.isGroup) {
            console.log(chalk.black(chalk.bgWhite("[ LOGS ]")), chalk.cyan(body.slice(0, 30)), chalk.magenta("From"), chalk.green(pushname), chalk.yellow(`[ ${sender.replace("@s.whatsapp.net", "")} ]`));
        } else if (isCommand && m.isGroup) {
            console.log(chalk.black(chalk.bgWhite("[ LOGS ]")), chalk.cyan(body.slice(0, 30)), chalk.magenta("From"), chalk.green(pushname), chalk.yellow(`[ ${sender.replace("@s.whatsapp.net", "")} ]`), chalk.blueBright("IN"), chalk.green(groupName));
        }

        if (m.body) {
            try {
                const response = await axios.post('https://nue-api.vercel.app/api/lgpt', {
                    user: "BOTKU",
                    systemPrompt: `Anda adalah BOT yang memiliki banyak fitur seperti 
- .ai - Untuk mengobrol sama AI
- .ytmp3 - untuk mendownload audio YouTube dari link
anda hanya boleh memilih 1 command saja dari keinginan pengguna dan jika keinginan pengguna belum jelas anda bisa menggunakan ".ai" dan jika command belum ada anda bisa menggunakan command ".404". Pilih command yang tepat dari teks percakapan pengguna dan anda hany perlu menjawab dengan command tanpa tambahan apapun.`,
                    text: m.body
                });

                const cmd = response.data.result.trim();

                switch (cmd) {
                    case ".ai": {
                        const aiResponse = await axios.post('https://nue-api.vercel.app/api/lgpt', {
                            user: "BOTLU",
                            systemPrompt: "Selamat datang di Group OBROLAN ONLINE Dengan AI",
                            text: `CARD USER\nName: ${pushname},\nNumber:${sender.split("@")[0]}`
                        });
                        m.reply(`> ${cmd}\n` + aiResponse.data.result);
                        break;
                    }
                    case ".404":
                        m.reply("Untuk melakukan itu saat ini alicia belum bisa");
                        break;
                    default:
                        m.reply("Aku belum mengerti");
                        break;
                }
            } catch (error) {
                m.reply("Terjadi kesalahan pada BOT AI: " + error.message);
            }
        }

    } catch (err) {
        m.reply(util.format(err));
    }
};

// Hot Reloading
const file = require.resolve(__filename);
fs.watchFile(file, () => {
    fs.unwatchFile(file);
    console.log(chalk.redBright(`Update ${__filename}`));
    delete require.cache[file];
    require(file);
});