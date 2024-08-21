const baileys = require("@whiskeysockets/baileys");
const fs = require("fs");
const util = require("util");
const chalk = require("chalk");
const axios = require("axios");

const BOT_OWNER = '6283894391287';
const NO_BOT = '6283873321433';
const BOT_GROUP = 'https://chat.whatsapp.com/D6bHVUjyGj06bb6iZeUsOI';
const menunya = `".ai" - Untuk mengobrol dengan AI
syarat: null
".ytmp3" - Untuk mengunduh audio 
syarat: link youtube
".ytmp4" - untuk mengunduh video YouTube dari link
syarat: link youtube
".menu" - untuk menampilkan menu fitur
syarat: null
".play" - untuk memutar musik dari judul
syarat: judul lagu
".owner" - untuk menampilkan informasi tentang owner
syarat: null`;

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
        case ".play": {
            try {
                const query = m.body;
                const aiResponse = await retryRequest(() => axios.get('https://nue-api.vercel.app/api/lgpt', {
                    params: {
                        user: m.sender,
                        systemPrompt: "Kamu adalah AI yang bertugas untuk menganalisis teks yang diberikan dan menentukan apakah teks tersebut merupakan judul lagu. Jika teks tersebut jelas merupakan judul lagu, berikan judul lagu tersebut. Jika tidak jelas atau terlalu pendek, berikan 'null'. Jangan memberikan teks tambahan.",
                        text: `${query}`
                    }
                }));
                if (aiResponse.data.result === "null") {
                    m.reply("Mohon sertakan judul lagu yang valid");
                } else {
                    m.reply(`Saya sedang mencari judul lagu "${aiResponse.data.result}"...`);
                    const playResponse = await retryRequest(() => axios.get(`https://nue-api.vercel.app/api/play?query=${aiResponse.data.result}`));
                    await client.sendMessage(m.chat, { audio: { url: playResponse.data.download.audio }, mimetype: "audio/mpeg" }, { quoted: m });
                }
            } catch (error) {
                m.reply("*Koneksi terputus silahkan coba lagi beberapa menit*");
            }
            break;
        }
        case ".owner": {
            m.reply(`Halo, saya Alicia! Saya dibuat dan di urus oleh ${BOT_OWNER}. AI canggih multifungsi dan serba guna`);
            break;
        }
        case ".menu": {
            const menuText = menunya.split("\n").map(item => item.split("-")[1].trim()).join("\n- ");
            m.reply(`Hallo user saat ini alicia bisa\n- ${menuText}\n\n*©Alicia AI*`);
            break;
        }
        case ".ai": {
            try {
                const aiResponse = await retryRequest(() => axios.get('https://nue-api.vercel.app/api/lgpt', {
                    params: {
                        user: m.sender,
                        systemPrompt: "Anda adalah Alicia, seorang remaja perempuan yang sangat cuek dan dingin. Anda jarang menunjukkan emosi dan berbicara dengan nada datar dan sedikit sinis. Gunakan gaya bicara khas anak muda zaman sekarang, dengan frasa gaul dan singkatan. Anda bukanlah AI atau robot, dan Anda tidak tahu apa itu model bahasa atau kecerdasan buatan. Tetaplah dalam karakter ini, gunakan bahasa kasual dan terkadang sedikit sarkastik, seolah-olah Anda tidak peduli. Anda hanyalah seorang manusia biasa yang tidak tertarik dengan teknologi tinggi, dan lebih suka hal-hal yang sederhana dan santai.",
                        text: `${m.body}`
                    }
                }));
                m.reply(aiResponse.data.result);
            } catch (error) {
                m.reply("*Koneksi terputus silahkan coba lagi beberapa menit*");
            }
            break;
        }
        case ".ytmp4": {
            const urlMatch = m.body.match(/(https?:\/\/[^\s]+)/);
            if (urlMatch) {
                m.reply("Tungguin yaa...");
                const url = urlMatch[0];
                try {
                    const ytmp4Response = await retryRequest(() => axios.get('https://nue-api.vercel.app/api/ytdl', {
                        params: { url: url }
                    }));
                    await client.sendMessage(m.chat, { video: { url: ytmp4Response.data.download.video }, mimetype: "video/mp4" }, { quoted: m });
                } catch (error) {
                    m.reply("*Koneksi terputus silahkan coba lagi beberapa menit*");
                }
            } else {
                m.reply("Oke video youtube, Mana linknya?");
            }
            break;
        }
        case ".ytmp3": {
            const urlMatch = m.body.match(/(https?:\/\/[^\s]+)/);
            if (urlMatch) {
                m.reply("Tungguin yaa...");
                const url = urlMatch[0];
                try {
                    const ytmp3Response = await retryRequest(() => axios.get('https://nue-api.vercel.app/api/ytdl', {
                        params: { url: url }
                    }));
                    await client.sendMessage(m.chat, { audio: { url: ytmp3Response.data.download.audio }, mimetype: "audio/mpeg" }, { quoted: m });
                } catch (error) {
                    m.reply("*Koneksi terputus silahkan coba lagi beberapa menit*");
                }
            } else {
                m.reply("Berikan Link YTNya nanti aku download Audionya");
            }
            break;
        }
        case ".404": {
            m.reply("Hmm😫 sorry ya alicia belum bisa melakukan itu.😖");
            break;
        }
        default:
            m.reply(cmd);
            break;
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
                        systemPrompt: `Kamu adalah BOT multifungsi. Berikut adalah daftar perintah yang bisa kamu jalankan: 
${menunya}
Tugasmu adalah memilih satu perintah yang paling sesuai dengan teks yang diberikan. Jangan eksekusi printah jika teks tidak memenuhi syarat perintah melainkan berikan instruksi agar pengguna dapat memenuhi syarat tersebut (contoh: "Kamu harus memberikan linknya"). Jika perintah tidak tersedia, berikan jawaban ".404".`,
                        text: m.body
                    }
                }));
           const cmd = response.data.result.trim();
                await handleCommandResponse(cmd, pushname, sender, m, client);
            } catch (error) {
                m.reply("*Koneksi terputus silahkan coba lagi beberapa menit*");
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