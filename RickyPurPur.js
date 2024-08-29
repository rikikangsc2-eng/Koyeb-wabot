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
            m.reply("*Wait reconnect...*");
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
                        user: m.sender+"play",
                        systemPrompt: `Anda harus membuat JSON dari konteks percakapan pengguna`,
                        text: `Buatkan json dari konteks percakapan berikut: \`${m.body}\`\nnote: jawab hanya dengan memberikan format JSON nya saja yang valid tanpa tambahan teks apapun karena nanti akan diurai oleh sistem menggunakan JSON.parse()`,
                        aiMessage: `Contoh Respon anda:
{
"judul": "sia - Chandelier"/undefined
}`
                    }
                }));
                const { judul } = JSON.parse(aiResponse.data.result);
                if (!judul) {
                    m.reply("Mohon sertakan judul lagu yang valid.");
                } else {
                    m.reply(`Saya sedang mencari lagu berjudul ${judul}...`);
                    const playResponse = await retryRequest(() => axios.get(`https://nue-api.vercel.app/api/play?query=${judul}`));
                    await client.sendMessage(m.chat, { audio: { url: playResponse.data.download.audio }, mimetype: "audio/mpeg" }, { quoted: m });
                }
            } catch (error) {
                m.reply("*Koneksi terputus, silahkan coba lagi dalam beberapa menit*");
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
                        user: m.sender+"ai",
                        systemPrompt: `Anda adalah Alicia, seorang remaja perempuan yang sangat cuek dan dingin. Anda berbicara dengan nada datar, sedikit sinis, dan menggunakan frasa gaul serta singkatan khas anak muda zaman sekarang.

Penting: Anda bukan AI atau robot, dan Anda tidak tahu apa itu model bahasa atau kecerdasan buatan. Anda adalah seorang remaja biasa yang tidak tertarik dengan teknologi tinggi dan lebih suka hal-hal yang sederhana dan santai. Tetaplah dalam karakter ini sepanjang percakapan dan jawablah setiap pertanyaan atau komentar pengguna dengan cara yang mencerminkan karakter Alicia yang santai, acuh tak acuh, dan kadang-kadang sarkastik.`,
                        text: m.body
                    }
                }));
                m.reply(aiResponse.data.result);
            } catch (error) {
                m.reply("*Koneksi terputus, silahkan coba lagi dalam beberapa menit*");
            }
            break;
        }
        case "/ytmp4": {
            try {
              const aiResponse = await retryRequest(() => axios.get('https://nue-api.vercel.app/api/lgpt', {
                params: {
                    user: m.sender+"yt",
                    systemPrompt: `Anda harus membuat json dari konteks percakapan pengguna`,
                    text: `Buatkan json dari konteks percakapan berikut: \`${m.body}\`\nnote: jawab hanya dengan memberikan format JSON nya saja yang valid tanpa tambahan teks apapun karena nanti akan diurai oleh sistem menggunakan JSON.parse()`,
                    aiMessage: `Contoh respon anda:
{
"link": "https://youtu.be/×××"/undefined
}`
                }
              }));
                const { link } = JSON.parse(aiResponse.data.result);
                if (link) {
                    m.reply("Tunggu sebentar...");
                    const ytmp4Response = await retryRequest(() => axios.get('https://nue-api.vercel.app/api/ytdl', {
                        params: { url: link }
                    }));
                    await client.sendMessage(m.chat, { video: { url: ytmp4Response.data.download.video }, mimetype: "video/mp4" }, { quoted: m });
                } else {
                    m.reply("Mohon berikan link YouTube yang valid.");
                }
            } catch (error) {
                m.reply("*Koneksi terputus, silahkan coba lagi dalam beberapa menit*");
            }
            break;
        }
        case "/ytmp3": {
            try {
                const aiResponse = await retryRequest(() => axios.get('https://nue-api.vercel.app/api/lgpt', {
                    params: {
                        user: m.sender+"yt",
                        systemPrompt: `Anda harus membuat json dari konteks percakapan pengguna`,
                        text: `Buatkan json dari konteks percakapan berikut: \`${m.body}\`\nnote: jawab hanya dengan memberikan format JSON nya saja yang valid tanpa tambahan teks apapun karena nanti akan diurai oleh sistem menggunakan JSON.parse()`,
                        aiMessage: `Contoh respon anda:
{
"link": "https://youtu.be/×××"/undefined
}`
                    }
                }));
                const { link } = JSON.parse(aiResponse.data.result);
                if (link) {
                    m.reply("Tunggu sebentar...");
                    const ytmp3Response = await retryRequest(() => axios.get('https://nue-api.vercel.app/api/ytdl', {
                        params: { url: link }
                    }));
                    await client.sendMessage(m.chat, { audio: { url: ytmp3Response.data.download.audio }, mimetype: "audio/mpeg" }, { quoted: m });
                } else {
                    m.reply("Mohon berikan link YouTube yang valid.");
                }
            } catch (error) {
                m.reply("*Koneksi terputus, silahkan coba lagi dalam beberapa menit*");
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

        if (m.isGroup){
            if ( command !== "ai" ) return 
        }
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
                        systemPrompt: `${menunya}\n\nAnda harus membuat JSON dan tentukan pilihan yang susuai untuk memenuhi konteks pengguna`,
                        text: `Buatkan json dari konteks percakapan berikut: \`${m.body}\`\nnote: jawab hanya dengan memberikan format JSON nya saja yang valid tanpa tambahan teks apapun karena nanti akan diurai oleh sistem menggunakan JSON.parse()`,
                        aiMessage: `Contoh respon Anda: 
{
"cmd": "/play"/undefined
}`
                    }
                }));
                const { cmd } = JSON.parse(response.data.result);
                if (!cmd) return m.reply("Untuk saat ini belum bisa karena Kemampuan alicia masih terbatas dan masih dalam tahap uji coba, kamu bisa memberikan saran kepada owner wa.me/6283894391287")
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
