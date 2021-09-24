module.exports.help = {
    name: "loop",
    description: "loop the first song in the queue",
    usage: "-loop",
};

module.exports.run = async (client, message, args) => {
    const serverQueue = client.queue.get(message.guild.id)
    if (!message.member.voice.channel) {
        return message.reply(
            "you have to be in a vc to loop a track!"
        )
    }
    if (!serverQueue) {
        return message.reply("Nothing in the queue to loop")
    }
    if(serverQueue.looping) {
        serverQueue.looping = false;
        message.channel.send("**Looping disabled 🔃❌**")
    } else {
        serverQueue.looping = true;
        message.channel.send(`**Looping enabled** 🔃\n now looping track \`\`${serverQueue.songs[0].title}\`\` `)
    }

};
