const baileys = require("@whiskeysockets/baileys");
const fs = require("fs");
const util = require("util");
const chalk = require("chalk");
const axios = require("axios");

const BOT_OWNER = '6283894391287';
const NO_BOT = '6283873321433';
const BOT_GROUP = 'https://chat.whatsapp.com/DVSbBEUOE3PEctcarjkeQC';
const menunya = `1. "/ai" - Untuk mengobrol, mencari solusi, atau bertanya dengan AI.
2. "/ytmp3" - Untuk mengunduh audio dari link YouTube.
3. "/ytmp4" - Untuk mengunduh video dari link YouTube.
4. "/menu" - Untuk menampilkan menu fitur yang tersedia.
5. "/play" - Untuk mengunduh musik berdasarkan judul.
6. "/owner" - Untuk menampilkan informasi tentang owner bot.`;

const jsonRegex = /{[^{}]*}/g;

const getMessageBody = (m) => {
    const { message, mtype } = m;
    switch (mtype) {
        case "conversation":
            return message.conversation;
        case "imageMessage":
            return message.imageMessage.caption;
        case "videoMessage":
            return message.videoMessage.caption;
        case "extendedTextMessage":
            return message.extendedTextMessage.text;
        case "buttonsResponseMessage":
            return message.buttonsResponseMessage.selectedButtonId;
        case "listResponseMessage":
            return message.listResponseMessage.singleSelectReply.selectedRowId;
        case "templateButtonReplyMessage":
            return message.templateButtonReplyMessage.selectedId;
        case "messageContextInfo":
            return message.buttonsResponseMessage?.selectedButtonId ||
                message.listResponseMessage?.singleSelectReply.selectedRowId || m.body;
        default:
            return "";
    }
};

const retryRequest = async (requestFunction, retries = 3) => {
    for (let i = 0; i < retries; i++) {
        try {
            return await requestFunction();
        } catch (error) {
            m.reply(`*Wait reconnect...*\n> ${error.message}`);
            console.error(error);
            if (i < retries - 1) {
                console.log(chalk.yellow(`Attempt ${i + 1} failed. Retrying...`));
            } else {
                throw error;
            }
        }
    }
};

const parseJSON = (data, regex) => {
        try {
            return JSON.parse(data.result);
        } catch {
            const match = data.response.match(regex);
            if (match && match[1]) {
                return JSON.parse(match[1]);
            } else {
                m.reply("Data JSON tidak ditemukan atau tidak valid.");
            }
        }
    };
const handleCommandResponse = async (cmd, pushname, sender, m, client) => {
    const aiRequest = async (systemPrompt, text) => {
        return retryRequest(() => axios.get('https://nue-api.vercel.app/api/lgpt', {
            params: { user: sender + cmd, systemPrompt, text }
        }));
    };

    switch (cmd) {
        case "/play": {
            try {
                const aiResponse = await aiRequest(
                    `Anda harus membuat JSON dari konteks percakapan pengguna.\nPenting! Kirimkan format JSON secara langsung tanpa basa-basi karna bisa menyebabkan error saat di urai nanti`,
                    `Buatkan json dari konteks percakapan berikut: \`${m.body}\``
                );
                let judul = parseJSON(aiResponse.data, jsonRegex);

                if (judul?.judul) {
                    m.reply(`Saya sedang mencari lagu berjudul ${judul.judul}...`);
                    const playResponse = await retryRequest(() => axios.get(`https://nue-api.vercel.app/api/play?query=${judul.judul}`));
                    await client.sendMessage(m.chat, { audio: { url: playResponse.data.download.audio }, mimetype: "audio/mpeg" }, { quoted: m });
                } else {
                    m.reply("Mohon sertakan judul lagu yang valid.");
                }
            } catch (error) {
                m.reply(`*Koneksi terputus, silahkan coba lagi dalam beberapa menit*\n> ${error.message}`);
            }
            break;
        }
        case "/owner": {
            m.reply(`Halo, saya Alicia! Saya dibuat dan diurus oleh ${BOT_OWNER}. Saya adalah AI canggih yang multifungsi dan serba guna, saya mempunyai group ${BOT_GROUP}`);
            break;
        }
        case "/menu": {
            const menuText = menunya.split("\n").map(item => item.split("-")[1].trim()).join(`\n- `);
            m.reply(`Halo! Saat ini Alicia bisa melakukan:\n- ${menuText}\n\n*©Alicia AI*`);
            break;
        }
        case "/ai": {
            try {
                const aiResponse = await aiRequest(
                    `Anda adalah Alicia, seorang remaja perempuan yang sangat cuek dan dingin. Anda berbicara dengan nada datar, sedikit sinis, dan menggunakan frasa gaul serta singkatan khas anak muda zaman sekarang.`,
                    m.body
                );
                m.reply(aiResponse.data.result);
            } catch (error) {
                m.reply(`*Koneksi terputus, silahkan coba lagi dalam beberapa menit*\n> ${error.message}`);
            }
            break;
        }
        case "/ytmp4":
        case "/ytmp3": {
            try {
                const aiResponse = await aiRequest(
                    `Anda harus membuat JSON dari konteks percakapan pengguna.\nPenting! Kirimkan format JSON secara langsung tanpa basa-basi karna bisa menyebabkan error saat di urai nanti`,
                    `Buatkan JSON dari konteks percakapan berikut: \`${m.body}\``
                );
                let link = parseJSON(aiResponse.data, jsonRegex);

                if (link?.link) {
                    m.reply("Tunggu sebentar...");
                    const ytdlResponse = await retryRequest(() => axios.get('https://nue-api.vercel.app/api/ytdl', {
                        params: { url: link.link }
                    }));
                    const fileType = cmd === "/ytmp4" ? { video: { url: ytdlResponse.data.download.video }, mimetype: "video/mp4" } : { audio: { url: ytdlResponse.data.download.audio }, mimetype: "audio/mpeg" };
                    await client.sendMessage(m.chat, fileType, { quoted: m });
                } else {
                    m.reply("Mohon berikan link YouTube yang valid.");
                }
            } catch (error) {
                m.reply(`*Koneksi terputus, silahkan coba lagi dalam beberapa menit*\n> ${error.message}`);
            }
            break;
        }
    }
};

const processMessage = async (client, m) => {
    try {
        if (m.mtype === "viewOnceMessageV2") return;

        const body = getMessageBody(m);
        const isCommand = /^[\\/!#.]/gi.test(body);
        const prefix = isCommand ? body.match(/^[\\/!#.]/gi) : "/";
        const command = isCommand ? body.slice(prefix.length).trim().split(/\s+/).shift().toLowerCase() : null;
        const sender = m.sender;
        const pushname = m.pushName || "No Name";
        const botNumber = await client.decodeJid(client.user.id);
        const itsMe = sender === botNumber;
        const from = m.chat;
        const groupMetadata = m.isGroup ? await client.groupMetadata(from).catch(() => undefined) : undefined;
        const groupName = groupMetadata ? groupMetadata.subject : '';

        if (m.isGroup && command !== "ai") return;

        if (m.body && !m.isGroup) {
            console.log(chalk.black(chalk.bgWhite("[ LOGS ]")), chalk.cyan(body.slice(0, 30)), chalk.magenta("From"), chalk.green(pushname), chalk.yellow(`[ ${sender.replace("@s.whatsapp.net", "")} ]`));
        } else if (m.body && m.isGroup) {
            console.log(chalk.black(chalk.bgWhite("[ LOGS ]")), chalk.cyan(body.slice(0, 30)), chalk.magenta("From"), chalk.green(pushname), chalk.yellow(`[ ${sender.replace("@s.whatsapp.net", "")} ]`), chalk.blueBright("IN"), chalk.green(groupName));
        }

        if (m.body) {
            try {
                const aiResponse = await retryRequest(() => axios.get('https://nue-api.vercel.app/api/lgpt', {
                    params: {
                        user: m.sender,
                        systemPrompt: `${menunya}\n\nAnda harus membuat JSON dan tentukan pilihan yang susuai untuk memenuhi konteks pengguna.\nPenting! Kirimkan format JSON secara langsung tanpa basa-basi karna bisa menyebabkan error saat di urai nanti`,
                        text: `Buatkan json dari konteks teks berikut: \`${m.body}\``,
                        aiMessage: `Contoh respon Anda: 
{
"cmd": "/play"/undefined
}
note: jawab hanya dengan memberikan format JSON nya saja yang valid tanpa tambahan teks apapun dan format markdown karena nanti akan diurai oleh sistem menggunakan JSON.parse()`
                    }
                }));

                let cmd = parseJSON(aiResponse.data, jsonRegex);
                if (!cmd.cmd) return m.reply("Untuk saat ini belum bisa karena Kemampuan alicia masih terbatas dan masih dalam tahap uji coba, kamu bisa memberikan saran kepada owner wa.me/6283894391287");

                cmd = cmd.cmd;
                if (m.isGroup && command === 'ai') {
                    m.body = m.body.toLowerCase().split(".ai").slice(1).join("").trim();
                }
                await handleCommandResponse(cmd, pushname, sender, m, client);
            } catch (error) {
                m.reply(`> ${error.message}\nmohon maaf ada sedikit kendala, silahkan coba lagi dalam beberapa menit`);
            }
        }
    } catch (err) {
        m.reply(util.format(err));
    }
};

module.exports = sansekai = async (client, m, chatUpdate) => {
    await processMessage(client, m);
};

const file = require.resolve(__filename);
fs.watchFile(file, () => {
    fs.unwatchFile(file);
    console.log(chalk.redBright(`Update ${__filename}`));
    delete require.cache[file];
    require(file);
});
