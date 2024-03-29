module.exports.help = {
    name: ["stop","die"],
    description: "stop music",
    usage: "-stop OR -die",
};

module.exports.run = async (client, message, args) => {
    const serverQueue = client.queue.get(message.guild.id);
    if (!message.member.voice.channel) {
        return message.reply("you have to be in a vc to stop!");
    }
    if (!serverQueue) {
        return message.reply("there are no songs to stop");
    }
    message.channel.send("**Stopping queue**");
    serverQueue.looping = false;
    serverQueue.songs = [];
    
    serverQueue.connection.destroy()
    client.queue.delete(message.guild.id)
};
