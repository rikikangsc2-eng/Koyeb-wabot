const baileys = require("@whiskeysockets/baileys");
const fs = require("fs");
const util = require("util");
const chalk = require("chalk");
const axios = require("axios");

const BOT_OWNER = '6283894391287';
const NO_BOT = '6283873321433';
const BOT_GROUP = 'https://chat.whatsapp.com/D6bHVUjyGj06bb6iZeUsOI';
const menunya = `1. ".ai" - Untuk mengobrol atau bertanya dengan AI.
2. ".ytmp3" - Untuk mengunduh audio dari link YouTube yang diberikan.
3. ".ytmp4" - Untuk mengunduh video dari link YouTube yang diberikan.
4. ".menu" - Untuk menampilkan menu fitur yang tersedia.
5. ".play" - Untuk memutar musik berdasarkan judul yang diberikan oleh pengguna.
6. ".owner" - Untuk menampilkan informasi tentang owner bot.`;

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
        case ".play": {
            try {
                const query = m.body;
                const aiResponse = await retryRequest(() => axios.get('https://nue-api.vercel.app/api/lgpt', {
                    params: {
                        user: m.sender,
                        systemPrompt: `Kamu adalah AI canggih yang bertugas untuk memastikan apakah teks yang diberikan pengguna adalah judul lagu yang valid. Jika teks tersebut adalah judul lagu yang jelas dan valid, kembalikan hanya judul lagunya sebagai string tanpa tanda kutip atau teks tambahan apa pun. Jika teks tersebut tidak jelas atau tidak mungkin merupakan judul lagu, kembalikan string 'null'.

Ingat, jangan memberikan penjelasan atau informasi tambahan apa pun. Tugasmu adalah memastikan bahwa output hanya berisi judul lagu atau 'null'.

Contoh:
- Input valid: sia - Chandelier //Output: sia - Chandelier
- Input tidak valid: .play sia - Chandelier //Output: null`,
                        text: query
                    }
                }));
                if (aiResponse.data.result === "null") {
                    m.reply("Mohon sertakan judul lagu yang valid.");
                } else {
                    m.reply(`Saya sedang mencari lagu berjudul ${aiResponse.data.result}...`);
                    const playResponse = await retryRequest(() => axios.get(`https://nue-api.vercel.app/api/play?query=${aiResponse.data.result}`));
                    await client.sendMessage(m.chat, { audio: { url: playResponse.data.download.audio }, mimetype: "audio/mpeg" }, { quoted: m });
                }
            } catch (error) {
                m.reply("*Koneksi terputus, silahkan coba lagi dalam beberapa menit*");
            }
            break;
        }
        case ".owner": {
            m.reply(`Halo, saya Alicia! Saya dibuat dan diurus oleh ${BOT_OWNER}. Saya adalah AI canggih yang multifungsi dan serba guna.`);
            break;
        }
        case ".menu": {
            const menuText = menunya.split("\n").map(item => item.split("-")[1].trim()).join(`\n- `);
            m.reply(`Halo! Saat ini Alicia bisa melakukan:\n- ${menuText}\n\n*©Alicia AI*`);
            break;
        }
        case ".ai": {
            try {
                const aiResponse = await retryRequest(() => axios.get('https://nue-api.vercel.app/api/lgpt', {
                    params: {
                        user: m.sender,
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
        case ".ytmp4": {
            try {
                const aiResponse = await retryRequest(() => axios.get('https://nue-api.vercel.app/api/lgpt', {
                    params: {
                        user: m.sender,
                        systemPrompt: `Kamu adalah AI yang ditugaskan untuk menganalisis teks dan menentukan apakah itu adalah link YouTube yang valid. Jika teks tersebut adalah link YouTube yang jelas dan valid, kembalikan hanya link tersebut sebagai string tanpa tanda kutip atau teks tambahan apa pun. Jika teks tersebut tidak jelas atau tidak mungkin merupakan link YouTube, kembalikan string 'null'.

Ingat, jangan memberikan penjelasan atau informasi tambahan apa pun. Tugasmu adalah memastikan bahwa output hanya berisi link YouTube atau 'null'.

Contoh:
- Input valid: https://youtube.com/xxxx //Output: https://youtube.com/xxxx
- Input tidak valid: .ytmp4 https://youtube.com/xxxx //Output: null`,
                        text: m.body
                    }
                }));
                const url = aiResponse.data.result.trim();
                if (url !== "null") {
                    m.reply("Tunggu sebentar...");
                    const ytmp4Response = await retryRequest(() => axios.get('https://nue-api.vercel.app/api/ytdl', {
                        params: { url: url }
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
        case ".ytmp3": {
            try {
                const aiResponse = await retryRequest(() => axios.get('https://nue-api.vercel.app/api/lgpt', {
                    params: {
                        user: m.sender,
                        systemPrompt: `Kamu adalah AI yang ditugaskan untuk menganalisis teks dan menentukan apakah itu adalah link YouTube yang valid. Jika teks tersebut adalah link YouTube yang jelas dan valid, kembalikan hanya link tersebut sebagai string tanpa tanda kutip atau teks tambahan apa pun. Jika teks tersebut tidak jelas atau tidak mungkin merupakan link YouTube, kembalikan string 'null'.

Ingat, jangan memberikan penjelasan atau informasi tambahan apa pun. Tugasmu adalah memastikan bahwa output hanya berisi link YouTube atau 'null'.

Contoh:
- Input valid: https://youtube.com/xxxx //Output: https://youtube.com/xxxx
- Input tidak valid: .ytmp3 https://youtube.com/xxxx //Output: null`,
                        text: m.body
                    }
                }));
                const url = aiResponse.data.result.trim();
                if (url !== "null") {
                    m.reply("Tunggu sebentar...");
                    const ytmp3Response = await retryRequest(() => axios.get('https://nue-api.vercel.app/api/ytdl', {
                        params: { url: url }
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
        default:
            m.reply(`Perintah tidak valid: ${cmd}`);
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
                        systemPrompt: `Kamu adalah BOT multifungsi yang dirancang untuk menangani berbagai perintah yang mungkin diberikan oleh pengguna. Berikut adalah daftar perintah yang bisa kamu jalankan:

${menunya}

Tugasmu adalah membaca teks yang diberikan oleh pengguna, memahami konteksnya, dan memilih salah satu perintah di atas yang paling sesuai. Jika teks yang diberikan tidak sesuai dengan salah satu perintah yang tersedia, kembalikan respons berupa '.ai'. Ingat, tugasmu adalah memastikan bahwa setiap perintah dijalankan dengan tepat dan sesuai dengan konteks pengguna. Jangan sertakan tanda kutip atau teks tambahan apa pun pada output perintah.

Contoh:
- Input valid: .play //Output: .play
- Input tidak valid: ".play" //Output: null`,
                        text: m.body
                    }
                }));
                const cmd = response.data.result.trim();
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
                m.reply("*Koneksi terputus, silahkan coba lagi dalam beberapa menit*");
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
