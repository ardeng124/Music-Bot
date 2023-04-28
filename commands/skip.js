module.exports.help = {
    name: ["skip"],
    description: "skips music",
    usage: "-skip",
};

module.exports.run = async (client, message, args) => {
    const serverQueue = client.queue.get(message.guild.id);
    if (!message.member.voice.channel) {
        return message.reply("Join a vc first!");
    }
    if (!serverQueue) {
        return message.reply("No song to skip");
    }
    if (serverQueue.songs.size >= 1)
        message.channel.send(`Skipped \`${serverQueue.songs[0].title}\` `)

    serverQueue.looping = false;
    try {
        serverQueue.player.stop();
        // return message.reply("Skipped")
    } catch (e) {
        console.log(e)
    }
    // serverQueue.connection.dispatcher.end();
    // serverQueue.songs.shift();
};
