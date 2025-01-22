require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const axios = require('axios');

// Inisialisasi bot Discord
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ]
});

// Fungsi untuk mencoba login ulang jika bot terputus
async function reconnectBot() {
    try {
        console.log("Reconnecting bot...");
        await client.login(process.env.DISCORD_TOKEN);
        console.log("Bot successfully reconnected.");
    } catch (error) {
        console.error("Failed to reconnect bot:", error);
        // Tunggu 5 detik sebelum mencoba kembali
        setTimeout(reconnectBot, 5000);
    }
}

// Event ketika bot berhasil online
client.once('ready', () => {
    console.log(`Bot is online as ${client.user.tag}`);
});

// Event ketika menerima pesan
client.on('messageCreate', async (message) => {
    if (message.author.bot) return; // Abaikan pesan dari bot lain

    if (message.content.startsWith('.talent')) {
        const keyword = message.content.split(' ')[1];

        if (!keyword) {
            message.channel.send("Please input Commander Name.");
            return;
        }

        try {
            // Mengambil data dari Google Apps Script
            const response = await axios.get(`https://script.google.com/macros/s/AKfycbxgUDSMNHWjZSs8DefUY3Ms0xvuxOgu69-xc8HLBCY_0sHNzaTbrGnIbnVFsD4Bu1l5/exec?keyword=${keyword}`);
            const { imageUrl, description } = response.data;

            if (!imageUrl || !description) {
                message.channel.send(`Keyword '${keyword}' Not Found.`);
            } else {
                // Kirim gambar beserta deskripsi
                message.channel.send({ 
                    content: `Here is the talent for ${keyword}`,
                    files: [imageUrl]
                }).then(() => {
                    message.channel.send(`**Utility :** ${description}`);
                });
            }
        } catch (error) {
            console.error("Error fetching data:", error);

            if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
                message.channel.send("Unable to connect to server. Please check your internet connection or server.");
            } else {
                message.channel.send("An error occurred while fetching the data. Please try again later.");
            }
        }
    }
});

// Event ketika bot terputus
client.on('disconnect', () => {
    console.log("Bot disconnected. Attempting to reconnect...");
    reconnectBot();
});

// Event ketika terjadi error pada bot
client.on('error', (error) => {
    console.error("Bot encountered an error:", error);
    reconnectBot();
});

// Event ketika koneksi websocket bot terputus
client.on('shardDisconnect', (event, shardId) => {
    console.log(`Shard ${shardId} disconnected. Attempting to reconnect...`);
    reconnectBot();
});

// Login bot dengan token
client.login(process.env.DISCORD_TOKEN).catch((error) => {
    console.error("Failed to login bot:", error);
    reconnectBot();
});
