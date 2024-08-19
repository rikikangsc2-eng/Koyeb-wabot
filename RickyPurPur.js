const baileys = require("@whiskeysockets/baileys");
const fs = require("fs");
const util = require("util");
const chalk = require("chalk");
const axios = require("axios");

// Constants
const BOT_OWNER = '6283894391287';
const NO_BOT = '6283873321433';
const BOT_GROUP = 'https://chat.whatsapp.com/D6bHVUjyGj06bb6iZeUsOI';
const menunya = `".ai" - Untuk mengobrol dengan AI
".ytmp3" - Untuk mengunduh audio YouTube dari link
".ytmp4" - untuk mengunduh video YouTube dari link
".menu" - untuk menampilkan menu`
// Function to get message body
const getMessageBody = (m) => {
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

// Function to handle command responses
const handleCommandResponse = async (cmd, pushname, sender, m, client) => {
    switch (cmd) {
        case ".menu": {
            const menuText = menunya.split("\n").map(item => item.split("-")[1].trim()).join("\n- ");
            m.reply(`Hallo user saat ini alicia bisa\n- ${menuText}\n\n*©Alicia AI*`);
        }
            break;
        case ".ai": {
            const aiResponse = await axios.get('https://nue-api.vercel.app/api/lgpt', {
                params: {
                    user: "BOTLU",
                    systemPrompt: "Selamat datang di Group OBROLAN ONLINE Dengan Alicia AI",
                    text: `CARD USER\nName: ${pushname},\nNumber:${sender.split("@")[0]}\n----\nMessage: ${m.body}`
                }
            });
            m.reply(aiResponse.data.result);
            break;
        }
        case ".404":
            m.reply("Untuk melakukan itu saat ini alicia belum bisa");
            break;
            case ".ytmp4": {
                const urlMatch = m.body.match(/(https?:\/\/[^\s]+)/);
                if (urlMatch) {
                    const url = urlMatch[0];  // Ambil URL pertama yang ditemukan
                    try {
                        const ytmp4Response = await axios.get('https://nue-api.vercel.app/api/ytdl', {
                            params: { url: url }
                        });
                        await client.sendMessage(m.chat, { video: { url: ytmp4Response.data.video }, mimetype: "video/mp4" }, { quoted: m });
                    } catch (error) {
                        m.reply("Terjadi kesalahan saat memproses video.");
                    }
                } else {
                    m.reply("Tolong masukkan URL YouTube-nya.");
                }
                break;
            }

            case ".ytmp3": {
                const urlMatch = m.body.match(/(https?:\/\/[^\s]+)/);
                if (urlMatch) {
                    const url = urlMatch[0];  // Ambil URL pertama yang ditemukan
                    try {
                        const ytmp3Response = await axios.get('https://nue-api.vercel.app/api/ytdl', {
                            params: { url: url }
                        });
                        await client.sendMessage(m.chat, { audio: { url: ytmp3Response.data.audio }, mimetype: "audio/mpeg" }, { quoted: m });
                    } catch (error) {
                        m.reply("Terjadi kesalahan saat memproses audio.");
                    }
                } else {
                    m.reply("Tolong masukkan URL YouTube-nya.");
                }
                break;
            }
        default:
            m.reply("Aku belum mengerti");
            break;
    }
};

// Function to process message
const processMessage = async (client, m) => {
    try {
        if (m.mtype === "viewOnceMessageV2") return;

        const body = getMessageBody(m);
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
        if (m.body && !m.isGroup) {
            console.log(chalk.black(chalk.bgWhite("[ LOGS ]")), chalk.cyan(body.slice(0, 30)), chalk.magenta("From"), chalk.green(pushname), chalk.yellow(`[ ${sender.replace("@s.whatsapp.net", "")} ]`));
        } else if (m.body && m.isGroup) {
            console.log(chalk.black(chalk.bgWhite("[ LOGS ]")), chalk.cyan(body.slice(0, 30)), chalk.magenta("From"), chalk.green(pushname), chalk.yellow(`[ ${sender.replace("@s.whatsapp.net", "")} ]`), chalk.blueBright("IN"), chalk.green(groupName));
        }

        if (m.body) {
            try {
                const response = await axios.get('https://nue-api.vercel.app/api/lgpt', {
                    params: {
                        user: "BOTKU",
                        systemPrompt: `Anda adalah BOT multifungsi dengan berbagai fitur, termasuk:
${menunya}

Tugas Anda adalah memilih satu perintah yang paling sesuai berdasarkan teks percakapan pengguna. Jika maksud pengguna tidak jelas, gunakan perintah ".ai". Jika perintah yang diminta tidak tersedia, gunakan perintah ".404". Anda hanya perlu membalas dengan satu perintah yang sesuai tanpa tambahan apapun.`,
                        text: m.body
                    }
                });

                const cmd = response.data.result.trim();
                await handleCommandResponse(cmd, pushname, sender, m, client);
            } catch (error) {
                m.reply("Terjadi kesalahan pada BOT AI: " + error.message);
            }
        }
    } catch (err) {
        m.reply(util.format(err));
    }
};

module.exports = sansekai = async (client, m, chatUpdate) => {
    await processMessage(client, m);
};

// Hot Reloading
const file = require.resolve(__filename);
fs.watchFile(file, () => {
    fs.unwatchFile(file);
    console.log(chalk.redBright(`Update ${__filename}`));
    delete require.cache[file];
    require(file);
});