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

const retryRequest = async (requestFunction, retries = 3) => {
    for (let i = 0; i < retries; i++) {
        try {
            return await requestFunction();
        } catch (error) {
            m.reply(`> ${error.message}\nMohon maaf ada sedikit kendala, silahkan coba lagi dalam beberapa menit.`);
            console.error(error);
            if (i < retries - 1) {
                console.log(chalk.yellow(`Attempt ${i + 1} failed. Retrying...`));
            } else {
                throw error;
            }
        }
    }
};

const handleCommandResponse = async (cmd, pushname, sender, m, client) => {
    switch (cmd) {
        case "/play": {
            try {
                const query = m.body;
                const aiResponse = await retryRequest(() => axios.get('https://nue-api.vercel.app/api/lgpt', {
                    params: {
                        user: `${m.sender}play`,
                        systemPrompt: `Anda harus membuat JSON dari konteks percakapan pengguna.\nPenting! Kirimkan format JSON secara langsung tanpa basa-basi karna bisa menyebabkan error saat di urai nanti`,
                        text: `Buatkan json dari konteks percakapan berikut: \`${m.body}\``,
                        aiMessage: `Contoh Respon anda:
{
"judul": "sia - Chandelier"/undefined
}
note: jawab hanya dengan memberikan format JSON nya saja yang valid tanpa tambahan teks apapun dan format markdown karena nanti akan diurai oleh sistem menggunakan JSON.parse()`
                    }
                }));
                let judul;
                try {
                    judul = JSON.parse(aiResponse.data.result);
                } catch (error) {
                    const regex = /```json\s*([\s\S]*?)\s*```/i;
                    const match = aiResponse.data.response.toLowerCase().match(regex);
                    if (match && match[1]) {
                        judul = JSON.parse(match[1]);
                    } else {
                        m.reply("Data JSON tidak ditemukan atau tidak valid.");
                    }
                }

                if (!judul.judul) {
                    m.reply("Mohon sertakan judul lagu yang valid.");
                } else {
                    judul = judul.judul;
                    m.reply(`Saya sedang mencari lagu berjudul ${judul}...`);
                    const playResponse = await retryRequest(() => axios.get(`https://nue-api.vercel.app/api/play?query=${judul}`));
                    await client.sendMessage(m.chat, { audio: { url: playResponse.data.download.audio }, mimetype: "audio/mpeg" }, { quoted: m });
                }
            } catch (error) {
                m.reply(`> ${error.message}\nMohon maaf ada sedikit kendala, silahkan coba lagi dalam beberapa menit.`);
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
                const aiResponse = await retryRequest(() => axios.get('https://nue-api.vercel.app/api/lgpt', {
                    params: {
                        user: `${m.sender}ai`,
                        systemPrompt: `Anda adalah Alicia, seorang remaja perempuan yang sangat cuek dan dingin. Anda berbicara dengan nada datar, sedikit sinis, dan menggunakan frasa gaul serta singkatan khas anak muda zaman sekarang.

Penting: Anda bukan AI atau robot, dan Anda tidak tahu apa itu model bahasa atau kecerdasan buatan. Anda adalah seorang remaja biasa yang tidak tertarik dengan teknologi tinggi dan lebih suka hal-hal yang sederhana dan santai. Tetaplah dalam karakter ini sepanjang percakapan dan jawablah setiap pertanyaan atau komentar pengguna dengan cara yang mencerminkan karakter Alicia yang santai, acuh tak acuh, dan kadang-kadang sarkastik.`,
                        text: m.body
                    }
                }));
                m.reply(aiResponse.data.result);
            } catch (error) {
                m.reply(`> ${error.message}\nMohon maaf ada sedikit kendala, silahkan coba lagi dalam beberapa menit.`);
            }
            break;
        }
        case "/ytmp4":
        case "/ytmp3": {
            try {
                const isYTmp4 = cmd === "/ytmp4";
                const aiResponse = await retryRequest(() => axios.get('https://nue-api.vercel.app/api/lgpt', {
                    params: {
                        user: `${m.sender}yt`,
                        systemPrompt: `Anda harus membuat json dari konteks percakapan pengguna.\nPenting! Kirimkan format JSON secara langsung tanpa basa-basi karna bisa menyebabkan error saat di urai nanti`,
                        text: `Buatkan JSON dari konteks percakapan berikut: \`${m.body}\``,
                        aiMessage: `Contoh respon anda:
{
"link": "https://youtu.be/×××"/undefined
}
note: jawab hanya dengan memberikan format JSON nya saja yang valid tanpa tambahan teks apapun dan format markdown karena nanti akan diurai oleh sistem menggunakan JSON.parse()`
                    }
                }));
                let link;
                try {
                    link = JSON.parse(aiResponse.data.result);
                } catch (error) {
                    const regex = /```json\s*([\s\S]*?)\s*```/i;
                    const match = aiResponse.data.response.toLowerCase().match(regex);
                    if (match && match[1]) {
                        link = JSON.parse(match[1]);
                    } else {
                        m.reply("Data JSON tidak ditemukan atau tidak valid.");
                    }
                }

                if (link.link) {
                    link = link.link;
                    m.reply("Tunggu sebentar...");
                    const ytdlResponse = await retryRequest(() => axios.get('https://nue-api.vercel.app/api/ytdl', {
                        params: { url: link }
                    }));
                    const mediaType = isYTmp4 ? 'video' : 'audio';
                    const mimetype = isYTmp4 ? "video/mp4" : "audio/mpeg";
                    await client.sendMessage(m.chat, { [mediaType]: { url: ytdlResponse.data.download[mediaType] }, mimetype }, { quoted: m });
                } else {
                    m.reply("Mohon berikan link YouTube yang valid.");
                }
            } catch (error) {
                m.reply(`> ${error.message}\nMohon maaf ada sedikit kendala, silahkan coba lagi dalam beberapa menit.`);
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
                const response = await retryRequest(() => axios.get('https://nue-api.vercel.app/api/lgpt', {
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
                let cmd;
                try {
                    cmd = JSON.parse(response.data.result);
                } catch (error) {
                    const regex = /```json\s*([\s\S]*?)\s*```/i;
                    const match = response.data.response.toLowerCase().match(regex);
                    if (match && match[1]) {
                        cmd = JSON.parse(match[1]);
                    } else {
                        m.reply("Data JSON tidak ditemukan atau tidak valid.");
                    }
                }

                if (!cmd.cmd) return m.reply("Untuk saat ini belum bisa karena Kemampuan alicia masih terbatas dan masih dalam tahap uji coba, kamu bisa memberikan saran kepada owner wa.me/6283894391287");
                cmd = cmd.cmd;
                if (m.isGroup) {
                    if (command === 'ai') {
                        m.body = m.body.toLowerCase().split(".ai").slice(1).join("").trim();
                        await handleCommandResponse(cmd, pushname, sender, m, client);
                    }
                    return;
                } else {
                    await handleCommandResponse(cmd, pushname, sender, m, client);
                }
            } catch (error) {
                m.reply(`> ${error.message}\nMohon maaf ada sedikit kendala, silahkan coba lagi dalam beberapa menit`);
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
