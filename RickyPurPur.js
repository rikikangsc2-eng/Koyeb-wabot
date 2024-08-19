const baileys = require("@whiskeysockets/baileys");
const fs = require("fs");
const util = require("util");
const chalk = require("chalk");
const axios = require("axios");

//---
const botOwner = '6283894391287';
const noBot = '6283873321433';
const botGroup = 'https://chat.whatsapp.com/D6bHVUjyGj06bb6iZeUsOI';
//---

module.exports = sansekai = async (client, m, chatUpdate) => {
    try {
        const body = m.mtype === "conversation" ? m.message.conversation :
            m.mtype === "imageMessage" ? m.message.imageMessage.caption :
            m.mtype === "videoMessage" ? m.message.videoMessage.caption :
            m.mtype === "extendedTextMessage" ? m.message.extendedTextMessage.text :
            m.mtype === "buttonsResponseMessage" ? m.message.buttonsResponseMessage.selectedButtonId :
            m.mtype === "listResponseMessage" ? m.message.listResponseMessage.singleSelectReply.selectedRowId :
            m.mtype === "templateButtonReplyMessage" ? m.message.templateButtonReplyMessage.selectedId :
            m.mtype === "messageContextInfo" ? m.message.buttonsResponseMessage?.selectedButtonId ||
            m.message.listResponseMessage?.singleSelectReply.selectedRowId || m.body :
            "";

        if (m.mtype === "viewOnceMessageV2") return;

        const budy = typeof body === "string" ? body : "";
        const prefix = /^[\\/!#.]/gi.test(body) ? body.match(/^[\\/!#.]/gi) : "/";
        const isCmd2 = body.startsWith(prefix);
        const command = body.replace(prefix, "").trim().split(/ +/).shift().toLowerCase();
        const args = body.trim().split(/ +/).slice(1);
        const pushname = m.pushName || "No Name";
        const botNumber = await client.decodeJid(client.user.id);
        const itsMe = m.sender === botNumber;
        const text = (q = args.join(" "));
        const arg = body.trim().substring(budy.indexOf(" ") + 1);
        const arg1 = body.trim().substring(arg.indexOf(" ") + 1);

        const msg = text;
        const from = m.chat;
        const reply = m.reply;
        const sender = m.sender;
        const mek = chatUpdate.messages[0];
        const messageType = m.mtype;
        const nomorUser = `@${m.sender.split('@')[0]}`;

        const color = (text, color) => {
            return !color ? chalk.green(text) : chalk.keyword(color)(text);
        };

        // Mentions
        function tagUser(text) {
            const regex = /@(\d+)/g;
            let matches;
            const numbers = [];

            while ((matches = regex.exec(text)) !== null) {
                numbers.push(`${matches[1]}@s.whatsapp.net`);
            }

            return numbers;
        }

        // Group
        const groupMetadata = m.isGroup ? await client.groupMetadata(m.chat).catch((e) => {}) : undefined;
        const groupSubject = groupMetadata ? groupMetadata.subject : "Gagal Fetch";
        const groupName = m.isGroup ? groupSubject : '';

        // Push Message To Console
        const argsLog = budy.length > 30 ? `${q.substring(0, 30)}...` : budy;

        if (isCmd2 && !m.isGroup) {
            console.log(
                chalk.black(chalk.bgWhite("[ LOGS ]")),
                color(argsLog, "turquoise"),
                chalk.magenta("From"),
                chalk.green(pushname),
                chalk.yellow(`[ ${m.sender.replace("@s.whatsapp.net", "")} ]`)
            );
        } else if (isCmd2 && m.isGroup) {
            console.log(
                chalk.black(chalk.bgWhite("[ LOGS ]")),
                color(argsLog, "turquoise"),
                chalk.magenta("From"),
                chalk.green(pushname),
                chalk.yellow(`[ ${m.sender.replace("@s.whatsapp.net", "")} ]`),
                chalk.blueBright("IN"),
                chalk.green(groupName)
            );
        }

        if (!m.body){
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
                if (cmd.startsWith(".")) {


    switch (cmd) {
        case ".ai":{
                const response = await axios.post('https://nue-api.vercel.app/api/lgpt', {
                    user: "BOTLU",
                    systemPrompt: "Selamat datang di Group OBROLAN ONLINE Dengan AI",
                    text: `CARD USER\nName: ${m.pushName},\nNumber:${m.sender.split("@")[0]}`
                });
            m.reply(`> ${cmd}\n`+response.data.result)
        }break;
        case ".404":{
            m.reply("Untuk melakukan itu saat ini alicia belum bisa")
        }break;
    }
                    
                } else {
                    m.reply("Aku belum mengerti");
                }
            } catch (error) {
                m.reply("Terjadi kesalahan pada BOT AI: "+error)
            }
        }


    } catch (err) {
        m.reply(util.format(err));
    }
};

let file = require.resolve(__filename);
fs.watchFile(file, () => {
    fs.unwatchFile(file);
    console.log(chalk.redBright(`Update ${__filename}`));
    delete require.cache[file];
    require(file);
});
