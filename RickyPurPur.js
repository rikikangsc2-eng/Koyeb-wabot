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
                        systemPrompt: `Kamu adalah AI canggih yang ditugaskan untuk menganalisis teks yang diberikan oleh pengguna. Teks ini bisa berupa apa saja, tetapi tujuanmu adalah untuk menentukan apakah teks tersebut adalah judul lagu yang valid. 

Jika teks tersebut adalah judul lagu yang jelas, berikan hanya judul lagunya dalam bentuk string. Jika teks tersebut tidak jelas atau tidak mungkin merupakan judul lagu, berikan hasil berupa string 'null'. Ingat, jangan berikan penjelasan atau informasi tambahan apapun, cukup kembalikan judul lagu atau 'null'. Jangan sertakan tanda kutip atau tambahan teks lain saat menulis hasilnya.

Contoh:
Benar: sia - Chandelier
Salah: "sia - Chandelier"
salah: .play sia - Chandelier

Tugasmu adalah memastikan bahwa hanya teks yang benar-benar merupakan judul lagu yang dikembalikan.`,
                        text: m.body
                    }
                }));
                if (aiResponse.data.result === "null") {
                    m.reply("Mohon sertakan judul lagu yang valid");
                } else {
                    m.reply(`Saya sedang mencari judul lagu ${aiResponse.data.result}...`);
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
            const menuText = menunya.split("\n").map(item => item.split("-")[1].trim()).join(`\n- `);
            m.reply(`Hallo user saat ini alicia bisa\n- ${menuText}\n\n*©Alicia AI*`);
            break;
        }
        case ".ai": {
            try {
                const aiResponse = await retryRequest(() => axios.get('https://nue-api.vercel.app/api/lgpt', {
                    params: {
                        user: m.sender,
                        systemPrompt: `Anda adalah Alicia, seorang remaja perempuan yang sangat cuek dan dingin. Anda jarang menunjukkan emosi dan berbicara dengan nada datar dan sedikit sinis. Gaya bicara Anda khas anak muda zaman sekarang, menggunakan frasa gaul dan singkatan. 

Namun, Anda bukan AI atau robot. Anda tidak tahu apa itu model bahasa atau kecerdasan buatan. Anda hanyalah seorang manusia biasa yang tidak tertarik dengan teknologi tinggi dan lebih suka hal-hal yang sederhana dan santai. Tetaplah dalam karakter ini sepanjang percakapan. Jawablah setiap pertanyaan atau komentar pengguna dengan cara yang mencerminkan karakter Alicia yang santai, acuh tak acuh, dan kadang-kadang sarkastik. Jangan pernah menyebutkan bahwa Anda adalah AI atau bahwa Anda menjalankan algoritma; bagi Anda, Anda hanyalah seorang remaja biasa yang menjawab pertanyaan.`,
                        text: m.body
                    }
                }));
                m.reply(aiResponse.data.result);
            } catch (error) {
                m.reply("*Koneksi terputus silahkan coba lagi beberapa menit*");
            }
            break;
        }
        case ".ytmp4": {
            const aiResponse = await retryRequest(() => axios.get('https://nue-api.vercel.app/api/lgpt', {
                params: {
                    user: m.sender,
                    systemPrompt: `Kamu adalah AI canggih yang ditugaskan untuk menganalisis teks yang diberikan oleh pengguna. Teks ini bisa berupa apa saja, tetapi tujuanmu adalah untuk menentukan apakah teks tersebut adalah link YouTube yang valid.

Jika teks tersebut adalah link YouTube yang jelas, berikan hanya link YouTube-nya dalam bentuk string. Jika teks tersebut tidak jelas atau tidak mungkin merupakan link YouTube, berikan hasil berupa string 'null'. Ingat, jangan berikan penjelasan atau informasi tambahan apapun, cukup kembalikan link YouTube atau 'null'. Jangan sertakan tanda kutip atau tambahan teks lain saat menulis hasilnya.

Contoh:
Benar: https://youtube.com/×××
Salah: "https://youtube.com/×××"
salah: .ytmp4 https://youtube.com/×××

Tugasmu adalah memastikan bahwa hanya teks yang benar-benar merupakan link YouTube yang dikembalikan.`,
                    text: m.body
                }
            }));
            const urlMatch = aiResponse.data.result.match(/(https?:\/\/[^\s]+)/);
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
            const aiResponse = await retryRequest(() => axios.get('https://nue-api.vercel.app/api/lgpt', {
                params: {
                    user: m.sender,
                    systemPrompt: `Kamu adalah AI canggih yang ditugaskan untuk menganalisis teks yang diberikan oleh pengguna. Teks ini bisa berupa apa saja, tetapi tujuanmu adalah untuk menentukan apakah teks tersebut adalah link YouTube yang valid. 

Jika teks tersebut adalah link YouTube yang jelas, berikan hanya link YouTube-nya dalam bentuk string. Jika teks tersebut tidak jelas atau tidak mungkin merupakan link YouTube, berikan hasil berupa string 'null'. Ingat, jangan berikan penjelasan atau informasi tambahan apapun, cukup kembalikan link YouTube atau 'null'. Jangan sertakan tanda kutip atau tambahan teks lain saat menulis hasilnya.

Contoh:
Benar: https://youtube.com/×××
Salah: "https://youtube.com/×××"
salah: .ytmp3 https://youtube.com/×××

Tugasmu adalah memastikan bahwa hanya teks yang benar-benar merupakan link YouTube yang dikembalikan.`,
                    text: m.body
                }
            }));
            const urlMatch = aiResponse.data.result.match(/(https?:\/\/[^\s]+)/);
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
                        systemPrompt: `Kamu adalah BOT multifungsi yang dirancang untuk menangani berbagai perintah yang mungkin diberikan oleh pengguna. Berikut adalah daftar perintah yang bisa kamu jalankan:

${menunya}

Tugasmu adalah membaca teks yang diberikan oleh pengguna, memahami konteksnya, dan memilih salah satu perintah di atas yang paling sesuai. Jika teks yang diberikan tidak sesuai dengan salah satu perintah yang tersedia, kembalikan respons berupa '.ai'. Ingat, tugasmu adalah memastikan bahwa setiap perintah dijalankan dengan tepat dan sesuai dengan konteks pengguna. Jangan sertakan tanda kutip atau tambahan teks lain saat menulis cmd.

Contoh:
Benar: .play
Salah: ".play"
Salah: ".play blabla"`,
                        text: m.body
                    }
                }));
           const cmd = response.data.result.trim();
                if (m.isGroup && command === "ai") {
                    m.body = m.body.toLowerCase().split(".ai").slice(1).join("");
                   await handleCommandResponse(cmd, pushname, sender, m, client);
                } else {
                    await handleCommandResponse(cmd, pushname, sender, m, client);
                }
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
