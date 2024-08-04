const {
    BufferJSON,
    WA_DEFAULT_EPHEMERAL,
    generateWAMessageFromContent,
    proto,
    generateWAMessageContent,
    generateWAMessage,
    prepareWAMessageMedia,
    areJidsSameUser,
    getContentType
} = require("@whiskeysockets/baileys");
const fs = require("fs");
const util = require("util");
const chalk = require("chalk");
const axios = require("axios");
const toUrl = require("./func/tools-toUrl.js");
const gameku = require('./func/fun-game.js');
//---
const botOwner = '6283894391287';
const noBot = '6283873321433'
const botGroup = 'https://chat.whatsapp.com/D6bHVUjyGj06bb6iZeUsOI';
//---
const arrMenuDownloader = ['instagram - pengunduh foto/video ig', 'ig - cmd singkat Instagram', 'tiktok - pengunduh video/foto tiktok', 'tt - cmd singkat tiktok', 'play - cari dan play video/audio YouTube', 'ytmp3 - pengunduh YouTube audio', 'ytmp4 - pengunduh YouTube video'];
const arrMenuAI = ['ai - Akses AI tercanggih dengan pengetahuan waktu nyata', 'anidif - pembuat gambar anime/diffusion'];
const arrMenuAnime = ['ongoing - list anime on-going', 'jadwal - list jadwal anime update'];
const arrMenuTools = ['hd - Gambar menjadi hd', 'remini - gambar menjadi hdv2', 'upscale - gambar menjadi 4× lebih hd', 'kl - cmd singkat kalkulator', 'kalkulator - penghitung soal mtk dasar', 'upload - upload foto ke server telegra.ph'];
const arrMenuFun = ['top - top pemain game', 'point - cek point kamu', 'nyerah - menyerah saat bermain', 'hint - bantuan saat bermain', 'tebakkata - game tebakkata', 'susunkata - game susunkata', 'slot - game taruhan slot', 'siapaaku - game tebak siapaaku', 'math - game mtk dasar', 'caklontong - game tebak2an nyeleneh', 'asahotak - game mengasah otak'];
const arrMenuMaker = [];
const arrMenuOther = ['owner - informasi pembuat bot', 'gcbot - group komunitas bot'];

const generateMenuOptions = (options) =>
options.map((option) => `║│─≽ .${option}\n`).join('');

const generateMenuCategory = (category) =>
`╔════「 ${category.title} MENU 」═════\n` +
`║╭───────────────────────\n` +
generateMenuOptions(category.options) +
`║╰───────────────────────\n` +
`╚════════════════════════\n\n`;

const menuCategories = [{
    title: 'AI',
    options: arrMenuAI,
},
    {
        title: 'Anime',
        options: arrMenuAnime,
    },
    {
        title: 'Downloader',
        options: arrMenuDownloader,
    },
    {
        title: 'Tools',
        options: arrMenuTools,
    },
    {
        title: 'Fun',
        options: arrMenuFun,
    },
    {
        title: 'Maker',
        options: arrMenuMaker,
    },
    {
        title: 'Other',
        options: arrMenuOther,
    },
];

// Sort the menu categories by title
menuCategories.sort((a, b) => a.title.localeCompare(b.title));

// Sort options within each category
menuCategories.forEach(category => {
    category.options.sort((a, b) => a.localeCompare(b));
});

const menu = menuCategories
.filter((category) => category.options.length > 0)
.map(generateMenuCategory)
.join('');

console.log(menu);
//---
//Database local
//---
let buttonData = {};
let buttonDate = {};
let buttonText = {};
//+++

module.exports = sansekai = async (client, m, chatUpdate) => {
    try {
        var body = m.mtype === "conversation" ? m.message.conversation:
        m.mtype == "imageMessage" ? m.message.imageMessage.caption:
        m.mtype == "videoMessage" ? m.message.videoMessage.caption:
        m.mtype == "extendedTextMessage" ? m.message.extendedTextMessage.text:
        m.mtype == "buttonsResponseMessage" ? m.message.buttonsResponseMessage.selectedButtonId:
        m.mtype == "listResponseMessage" ? m.message.listResponseMessage.singleSelectReply.selectedRowId:
        m.mtype == "templateButtonReplyMessage" ? m.message.templateButtonReplyMessage.selectedId:
        m.mtype === "messageContextInfo" ? m.message.buttonsResponseMessage?.selectedButtonId ||
        m.message.listResponseMessage?.singleSelectReply.selectedRowId || m.body:
        "";
        if (m.mtype === "viewOnceMessageV2") return
        var budy = typeof body == "string" ? body: "";
        // var prefix = /^[\\/!#.]/gi.test(body) ? body.match(/^[\\/!#.]/gi) : "/"
        var prefix = /^[\\/!#.]/gi.test(body) ? body.match(/^[\\/!#.]/gi): "/";
        const isCmd2 = body.startsWith(prefix);
        const command = body.replace(prefix, "").trim().split(/ +/).shift().toLowerCase();
        const args = body.trim().split(/ +/).slice(1);
        const pushname = m.pushName || "No Name";
        const botNumber = await client.decodeJid(client.user.id);
        const itsMe = m.sender == botNumber ? true: false;
        let text = (q = args.join(" "));
        const arg = body.trim().substring(budy.indexOf(" ") + 1);
        const arg1 = body.trim().substring(arg.indexOf(" ") + 1);

        const msg = text
        const from = m.chat;
        const reply = m.reply;
        const sender = m.sender;
        const mek = chatUpdate.messages[0];
        const messageType = m.mtype
        const nomorUser = `@${m.sender.split('@')[0]}`

        const color = (text, color) => {
            return !color ? chalk.green(text): chalk.keyword(color)(text);
        };

        const cekCmd = (pesan) => {
            const lowerCaseMessage = pesan.toLowerCase();
            return lowerCaseMessage.startsWith(prefix) && !lowerCaseMessage.startsWith(prefix+' ');
        };

        //Mentions
        function tagUser(text) {
            const regex = /@(\d+)/g;
            let matches;
            const numbers = [];

            while ((matches = regex.exec(text)) !== null) {
                numbers.push(matches[1] + '@s.whatsapp.net');
            }

            return numbers;
        }
        // Loading
        const loading = async () => {
            const reactionMessage = {
                react: {
                    text: '⏳',
                    key: m.key,
                },
            };

            await client.sendMessage(m.chat, reactionMessage);
        };

        // Group
        const groupMetadata = m.isGroup ? await client.groupMetadata(m.chat).catch((e) => {}): undefined;
        const groupSubject = groupMetadata ? groupMetadata.subject: "gagal Fetch";
        const groupName = m.isGroup ? groupSubject: '';

        // Push Message To Console
        let argsLog = budy.length > 30 ? `${q.substring(0, 30)}...`: budy;

        if (isCmd2 && !m.isGroup) {
            console.log(chalk.black(chalk.bgWhite("[ LOGS ]")), color(argsLog, "turquoise"), chalk.magenta("From"), chalk.green(pushname), chalk.yellow(`[ ${m.sender.replace("@s.whatsapp.net", "")} ]`));
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

        //Jawab soal game
        if (m.quoted) {
            if (m.quoted.text.includes("> mau *.nyerah* apa *.hint*") && !isCmd2) {
                const topSkor = await gameku.jawabSoal(nomorUser, m.body);
                const userMentions = tagUser(topSkor);
                const response = await axios.get('https://nue-api.vercel.app/api/lgpt', {
                                params: {
                                    user: m.chat, 
                                    text: m.body,
                                    systemPrompt: '-',
                                    aiMessage: `Pengguna menjawab soal ${m.quoted.text}, dan jawabannya adalah "${topSkor}". Beri tau pengguna bahwa jawabannya adalah "${topSkor}".`
                                }
                });
                return client.sendMessage(m.chat, {
                    text: response.data.result,
                    mentions: userMentions
                }, {
                    quoted: m
                });
            }
        }
        //button text
        if (!buttonData[m.sender]) {
            buttonData[m.sender] = {};
        }

        if (!buttonDate[m.sender]) {
            buttonDate[m.sender] = Date.now();
        }

        if (!buttonText[m.sender]) {
            buttonText[m.sender] = undefined;
        }

        if (m.quoted && m.quoted.text.includes('alicia-metadata:')) {
            if (!m.quoted.text.includes(m.sender.split('@')[0])) {
                return m.reply('Bukan buat kamu😉');
            }
            if (!buttonText[m.sender]) {
                return m.reply("data tidak di temukan!");
            }
            if (!m.quoted.text.includes(buttonDate[m.sender])) {
                return m.reply("Sudah tidak berlaku!");
            }

            // Memeriksa apakah m.body hanya berisi angka
            if (!/^\d+$/.test(m.body)) {
                return m.reply('Reply dan berikan nomor pilihanmu saja tanpa tambahan apapun, dan pastikan pilihanmu ada dalam menu');
            }

            try {
                const json = buttonText[m.sender];
                if (json[m.body]) {
                    return await eval(json[m.body]);
                } else {
                    return m.reply('Reply dan berikan nomor pilihanmu saja tanpa tambahan apapun, dan pastikan pilihanmu ada dalam menu');
                }
            } catch (e) {
                console.error(e);
                return m.reply('Maaf kak sepertinya ada yang error saat mengakse button: ' + e.message);
            }
        }
        //Auto Ai
        const allMenus = [...arrMenuDownloader, ...arrMenuAI, ...arrMenuAnime, ...arrMenuTools, ...arrMenuFun, ...arrMenuMaker, ...arrMenuOther];
const sortedMenus = allMenus.sort();
const formattedMenus = sortedMenus.map(menu => `/${menu}`);
        const prompt = `Anda adalah Alicia AI, AI model terbaru yang paling canggih, Anda mempunyai sikap seperti remaja perempuan. Anda mempunyai fitur unggulan seperti:\n${formattedMenus}\nAnda tidak boleh membuat fitur sendiri, Anda hanya boleh memberikan fitur pada list yang tertera saja. Anda berinteraksi layaknya anak remaja.${m.quoted ? `\n\nPengguna membalas pesan Anda yang ini: "${m.quoted.text || ''}"` : ''}. Note : Anda hanya program berbasis text dan tidak dapat menjalankan cmd nya, anda hanya dapat menyuruh pengguna untuk melakukanya secara manual.`;
const autoAI = async () => {
            try {

                const response = await axios.get('https://nue-api.vercel.app/api/lgpt', {
                                params: {
                                    user: m.chat, 
                                    text: m.body,
                                    systemPrompt: prompt
                                }
                });
                const hasil = response.data.result;
                m.reply(hasil);
            } catch (error) {
                console.error('Error:', error.message);
                m.reply('Terjadi kesalahan saat mengakses API');
            }
        };

        // Function to handle messages
        if (!m.isGroup && !cekCmd(m.body) && m.body) {
            if (m.quoted) {
                if (!m.quoted.text.includes('alicia-metadata:')) {
                    return autoAI();
                }
            } else {
                return autoAI();
            }
        }
        if (m.quoted && m.quoted.sender.includes(noBot) && !cekCmd(m.body)) {
            return autoAI();
        }

        if (cekCmd(m.body)) {
            switch (command) {
                case 'anidif': {
                    if (!msg) return m.reply('.anidif 17 year old girl standing on the street\n> lakukan seperti contoh');
                    try {
                        loading()
                        const response = await axios.get(`https://nue-api.vercel.app/api/diffpreset?model=breakdomain_M2150.safetensors [15f7afca]&preset=anime&prompt=${msg}`);
                        const imageUrl = response.data.data.imageUrl;
                        await client.sendImage(from, imageUrl, '> Gunakan fitur HD, remini, atau upscale untuk menjernihkan', mek);
                    } catch (error) {
                        m.reply('Sorry terjadi error:\n> '+error.message)
                    }
                } break;
                case 'remini':
                    case 'hd':
                        case 'upscale': {
                            if (!messageType.includes('imageMessage')) return m.reply("Kirim gambar dengan caption *.upscale* untuk memperjelas gambar\n\n> Lakukan seperti contoh");
                            loading()
                            const urlGambar = await toUrl.get(m, client);
                            const apiUrl = `https://nue-api.vercel.app/api/upscale?url=${encodeURIComponent(urlGambar)}`;

                            try {
                                const response = await axios.get(apiUrl);
                                const {
                                    data
                                } = response;

                                if (data.data.imageUrl) {
                                    await client.sendMessage(m.chat, {
                                        image: {
                                            url: data.data.imageUrl
                                        }, caption: 'gambar berhasil di upscale ', mimetype: 'image/jpeg'
                                    }, {
                                        quoted: m
                                    })
                                } else {
                                    m.reply("upscale photo failed")
                                }
                            } catch (error) {
                                console.error('Terjadi kesalahan:', error);
                                m.reply("Terjadi kesalahan " + error.message)
                            }
                        }break;
                        
                    
                case 'ai': {
                    if (!msg) return m.reply('*masukan query*');
                    loading();
                    try {
                        const response = await axios.get('https://nue-api.vercel.app/api/nuego',{params:{
                            q: msg,
                            user: m.chat+'v1'
                        }});
                        m.reply(response.data.result);
                    } catch (error) {
                        m.reply(error.message)
                    }
                }break;

                        case 'ongoing': {
                            if (!msg) return m.reply('*Contoh :* .ongoing 1\n\n> Contoh di atas akan mengarah ke daftar ongoing yang ada di otakudesu pada page 1');
                            loading()
                            axios.get('https://nya-otakudesu.vercel.app/api/v1/ongoing/'+msg)
                            .then(response => {
                                let hasil = '';
                                response.data.ongoing.forEach(anime => {
                                    let judul = anime.title;
                                    let eps = anime.total_episode;
                                    let lastUp = anime.updated_on;
                                    let JadwalUp = anime.updated_day;
                                    let link = anime.endpoint.replace('https:/otakudesu.cloud', 'https://otakudesu.cloud');

                                    hasil += `> ${link}\n*Judul:* ${judul}\n*Eps terbaru:* ${eps}\n*terakhir up:* ${lastUp}\n*up Setiap:* ${JadwalUp}\n\n`;
                                });
                                m.reply(hasil)
                            })
                            .catch(error => {
                                m.reply(error.message)
                            });

                        } break;
                        case 'kl':
                            case 'kalkulator': {
                                if (!text) return m.reply('*Contoh :* .kalkulator 2+2=\n\n`Untuk melakukan operasi kalkulator sederhana`');
                                try {
                                    const result = client.kalkulator(msg);
                                    if (result !== false) {
                                        m.reply(`${result}`);
                                    } else {
                                        m.reply('Invalid mathematical expression');
                                    }
                                } catch (error) {
                                    m.reply(error.message);
                                }
                                break;
                            }
                                case 'owner': {
                                    m.reply(`*Kontak Owner*\n*WA :* wa.me/6283894391287\n*Email :* rikipurpur98@gmail.com\n> mau request fitur atau bertanya tentang bot chat aja yo`);
                                }break;
                                case 'ig':
                                    case 'instagram': {
                                        if (!msg) {
                                            return m.reply(`*.${command}* https://xxx\n> Lakukan seperti contoh`);
                                        }
                                        loading()
                                        try {
                                            const response = await axios.get(`https://nue-api.vercel.app/api/snapsave?url=${msg}`);
                                            const data = response.data;
                                            const waktu = Date.now()+m.sender.split('@')[0];
                                            buttonDate[m.sender] = waktu
                                            buttonData[m.sender] = data;
                                            if (buttonData[m.sender].result[0].url) {
                                                buttonText[m.sender] = {
                                                    1: `client.sendMessage(m.chat, {image: {url: buttonData[m.sender].result[0].url}, mimetype: 'image/jpeg'});`,
                                                    2: `client.sendMessage(m.chat, {video: {url: buttonData[m.sender].result[0].url}, mimetype: 'video/mp4'});`
                                                };
                                                m.reply(`> Reply Chat Dan Pilih Nomornya!\n1. unduh photo\n2. unduh video\n\nalicia-metadata: ${waktu}`);
                                            } else {
                                                m.reply("Terjadi kesalahan!")
                                            }
                                        } catch (e) {
                                            m.reply(e.message)
                                        }
                                    }break;
                                    case 'play': {
                                        if (!msg) {
                                            return m.reply(`*.${command}* DJ ya odna\n> Lakukan seperti contoh`);
                                        }
                                        loading();
                                        try {
                                            const response = await axios.get(`https://nue-api.vercel.app/api/play?query=${msg}`);
                                            const data = response.data;
                                            const waktu = Date.now()+m.sender.split('@')[0]
                                            buttonDate[m.sender] = waktu
                                            buttonData[m.sender] = data;



                                            if (!data.status) {
                                                return m.reply('Terjadi kesalahan');
                                            }

                                            buttonText[m.sender] = {
                                                1: `m.reply(buttonData[m.sender].info.title);
                                                client.sendMessage(m.chat, {
                                                video: { url: buttonData[m.sender].download.video },
                                                mimetype: 'video/mp4',
                                                caption: '> © s.id/nueapi',
                                                }, { quoted: m });`,
                                                2: `m.reply(buttonData[m.sender].info.title);
                                                client.sendMessage(m.chat, {
                                                audio: { url: buttonData[m.sender].download.audio },
                                                mimetype: 'audio/mpeg'
                                                }, { quoted: m });`
                                            };

                                            m.reply(`> Reply Chat Dan Pilih Nomornya!\n1. Video format\n2. Audio format\n\nalicia-metadata: ${waktu}`);
                                        } catch (error) {
                                            m.reply(error.message);
                                        }
                                        break;
                                    }

                                        case 'tt':
                                            case 'tiktok': {
                                                const url = msg;

                                                if (!url) return m.reply(`.${command} https://×××\n> Lakukan seperti contoh`);

                                                loading();
                                                try {
                                                    const response = await axios.get(`https://nue-api.vercel.app/api/tt-dl?url=${url}`);

                                                    if (response.data.status === 'success') {
                                                        const result = response.data.result;
                                                        const authorInfo = result.author;
                                                        const waktu = Date.now()+m.sender.split('@')[0]
                                                        buttonDate[m.sender] = waktu
                                                        buttonData[m.sender] = {
                                                            result,
                                                            authorInfo
                                                        };
                                                        buttonText[m.sender] = {
                                                            1: `client.sendMessage(m.chat, {
                                                            video: { url: buttonData[m.sender].result.video },
                                                            mimetype: 'video/mp4'
                                                            }, { quoted: m });`,
                                                            2: `const images = buttonData[m.sender].result.images;
                                                            images.forEach(image => {
                                                            client.sendMessage(m.chat, {image: {url: image}, mimetype: 'image/jpeg'});
                                                            });`
                                                        };

                                                        m.reply(`> Reply Chat Dan Pilih Nomornya!\n1. Video format\n2. Image Format\n\nalicia-metadata: ${waktu}`);
                                                    } else {
                                                        m.reply('Gagal mengambil data video TikTok');
                                                    }
                                                } catch (error) {
                                                    m.reply(error.message);
                                                }
                                                break;
                                            }

                                                case 'jadwal': {
                                                    if (!msg) return m.reply(`.${command} sabtu\n> Lakukan seperti contoh`)
                                                    try {
                                                        const response = await axios.get('https://nue-api.vercel.app/api/anime-jadwal?hari='+msg);
                                                        const data = response.data;
                                                        const animeMinggu = data.template_text;

                                                        m.reply(animeMinggu);
                                                    } catch (error) {
                                                        m.reply(error.message)
                                                        console.error(error);
                                                    }
                                                }break;
                                                case 'nyerah': {
                                                    client.sendMessage(m.chat, {
                                                        text: await gameku.nyerah(nomorUser),
                                                        mentions: [m.sender]
                                                    }, {
                                                        quoted: m
                                                    });
                                                    break;
                                                }
                                                    case 'top': {
                                                        const topSkor = await gameku.topskor(nomorUser)
                                                        const userMentions = tagUser(topSkor)
                                                        client.sendMessage(m.chat, {
                                                            text: topSkor,
                                                            mentions: userMentions
                                                        }, {
                                                            quoted: m
                                                        });
                                                        break;
                                                    }
                                                        case 'point': {
                                                            client.sendMessage(m.chat, {
                                                                text: await gameku.skor(nomorUser)+'\n\n> anda bisa cek *.top* point',
                                                                mentions: [m.sender]
                                                            }, {
                                                                quoted: m
                                                            });
                                                            break;
                                                        }
                                                            case 'hint': {
                                                                const h = await gameku.hint(nomorUser, text);
                                                                client.sendMessage(m.chat, {
                                                                    text: `${h}`,
                                                                    mentions: [m.sender]
                                                                }, {
                                                                    quoted: m
                                                                });
                                                                break;
                                                            }
                                                                case 'slot': {
                                                                    if (!text) return m.reply('*Contoh :* .slot 2\n\n> Jika menang point anda di lipat gandakan');
                                                                    const h = await gameku.jackpot(nomorUser, msg);
                                                                    client.sendMessage(m.chat, {
                                                                        text: `${h}\n\n> anda bisa cek *.point* dan *.top* point`,
                                                                        mentions: [m.sender]
                                                                    }, {
                                                                        quoted: m
                                                                    });
                                                                    break;
                                                                }
                                                                    case 'jawab': {
                                                                        m.reply("*Reply* soal untuk menjawab pertanyaan")
                                                                        break;
                                                                    }
                                                                        case 'siapaaku': {
                                                                            try {
                                                                                const hasil = await gameku.game('siapaaku', nomorUser);
                                                                                client.sendMessage(m.chat, {
                                                                                    text: `${hasil}\n\n> mau *.nyerah* apa *.hint*`,
                                                                                    mentions: [m.sender]
                                                                                }, {
                                                                                    quoted: m
                                                                                });
                                                                            } catch (error) {
                                                                                console.log(error)
                                                                                m.reply(error.message);
                                                                            }
                                                                        } break;
                                                                        case 'math': {
                                                                            try {
                                                                                const hasil = await gameku.game('math', nomorUser);
                                                                                client.sendMessage(m.chat, {
                                                                                    text: `${hasil}\n\n> mau *.nyerah* apa *.hint*`,
                                                                                    mentions: [m.sender]
                                                                                }, {
                                                                                    quoted: m
                                                                                });
                                                                            } catch (error) {
                                                                                console.log(error)
                                                                                m.reply(error.message);
                                                                            }
                                                                        } break;
                                                                        case 'caklontong': {
                                                                            try {
                                                                                const hasil = await gameku.game('caklontong', nomorUser);
                                                                                client.sendMessage(m.chat, {
                                                                                    text: `${hasil}\n\n> mau *.nyerah* apa *.hint*`,
                                                                                    mentions: [m.sender]
                                                                                }, {
                                                                                    quoted: m
                                                                                });
                                                                            } catch (error) {
                                                                                console.log(error)
                                                                                m.reply(error.message);
                                                                            }
                                                                        } break;
                                                                        case 'susunkata': {
                                                                            try {
                                                                                const hasil = await gameku.game('susunkata', nomorUser);
                                                                                client.sendMessage(m.chat, {
                                                                                    text: `${hasil}\n\n> mau *.nyerah* apa *.hint*`,
                                                                                    mentions: [m.sender]
                                                                                }, {
                                                                                    quoted: m
                                                                                });
                                                                            } catch (error) {
                                                                                console.log(error)
                                                                                m.reply(error.message);
                                                                            }
                                                                        } break
                                                                        case 'asahotak': {
                                                                            try {
                                                                                const hasil = await gameku.game('asahotak', nomorUser);
                                                                                client.sendMessage(m.chat, {
                                                                                    text: `${hasil}\n\n> mau *.nyerah* apa *.hint*`,
                                                                                    mentions: [m.sender]
                                                                                }, {
                                                                                    quoted: m
                                                                                });
                                                                            } catch (error) {
                                                                                console.log(error)
                                                                                m.reply(error.message);
                                                                            }
                                                                        } break;
                                                                        case 'tebakkata': {
                                                                            try {
                                                                                const hasil = await gameku.game('tebakkata', nomorUser);
                                                                                client.sendMessage(m.chat, {
                                                                                    text: `${hasil}\n\n> mau *.nyerah* apa *.hint*`,
                                                                                    mentions: [m.sender]
                                                                                }, {
                                                                                    quoted: m
                                                                                });
                                                                            } catch (error) {
                                                                                console.log(error)
                                                                                m.reply(error.message);
                                                                            }
                                                                        } break;

                                                                        case 'ytmp3':
                                                                            case 'ytmp4': {
                                                                                if (!msg) {
                                                                                    return m.reply(`*.${command}* https://×××\n> Lakukan seperti contoh`);
                                                                                }
                                                                                loading()
                                                                                try {
                                                                                    const response = await axios.get(`https://nue-api.vercel.app/api/ytdl?url=${msg}`);
                                                                                    const data = response.data;

                                                                                    if (!data.status) {
                                                                                        return m.reply('Terjadi kesalahan');
                                                                                    }

                                                                                    const downloadUrl = command === 'ytmp3' ? data.download.audio: data.download.video;
                                                                                    m.reply(`\`Card Info:\`\n*Title:* ${data.info.title}\n*Author:* ${data.info.author.name}`);

                                                                                    const messageOptions = command === 'ytmp4'
                                                                                    ? {
                                                                                        video: {
                                                                                            url: downloadUrl
                                                                                        },
                                                                                        mimetype: 'video/mp4'
                                                                                    }: {
                                                                                        audio: {
                                                                                            url: downloadUrl
                                                                                        },
                                                                                        mimetype: 'audio/mpeg'
                                                                                    };

                                                                                    await client.sendMessage(m.chat, messageOptions, {
                                                                                        quoted: m
                                                                                    });
                                                                                } catch (error) {
                                                                                    m.reply(error.message);
                                                                                }
                                                                                break;
                                                                            }

                                                                                case 'gcbot': {
                                                                                    m.reply('Gabung sini bareng alicia\n'+botGroup)
                                                                                }break;

                                                                                case 'menu': {
                                                                                    const response = await axios.get('https://nue-api.vercel.app/api/date');
                                                                                    m.reply(`> ${response.data.template}\n\n`+menu);
                                                                                }break;

                                                                                case 'upload': case 'tourl': {
                                                                                    if (messageType.includes('imageMessage') || messageType.includes('videoMessage')) {
                                                                                        try {
                                                                                            const hasil = await toUrl.get(m, client);
                                                                                            m.reply(hasil);
                                                                                        } catch (e) {
                                                                                            m.reply(e.message)}
                                                                                    } else {
                                                                                        m.reply("*kirim gambar/video dengan caption .tourl*\n> Lakukan seperti contoh");
                                                                                    }
                                                                                }break;

                                                                                    case 'q': {
                                                                                        m.reply(JSON.stringify(m, null, 2))
                                                                                    }break

                                                                                    default: {
                                                                                        if (isCmd2 && budy.toLowerCase() != undefined) {
                                                                                            if (m.chat.endsWith("broadcast")) return;
                                                                                            if (m.isBaileys) return;
                                                                                            if (!budy.toLowerCase()) return;
                                                                                            if (argsLog || (isCmd2 && !m.isGroup)) {
                                                                                                // client.sendReadReceipt(m.chat, m.sender, [m.key.id])
                                                                                                console.log(chalk.black(chalk.bgRed("[ ERROR ]")), color("command", "turquoise"), color(`${prefix}${command}`, "turquoise"), color("tidak tersedia", "turquoise"));
                                                                                            } else if (argsLog || (isCmd2 && m.isGroup)) {
                                                                                                // client.sendReadReceipt(m.chat, m.sender, [m.key.id])
                                                                                                console.log(chalk.black(chalk.bgRed("[ ERROR ]")), color("command", "turquoise"), color(`${prefix}${command}`, "turquoise"), color("tidak tersedia", "turquoise"));
                                                                                            }
                                                                                        }
                                                                                    }
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