module.exports.help = {
    name: "shuffle",
    description: "shuffles the queue",
    usage: "-shuffle",
};

module.exports.run = async (client, message, args) => {
    const serverQueue = client.queue.get(message.guild.id);
    if (!message.member.voice.channel) {
        return message.reply("you have to be in a vc to shuffle!");
    }
    if (!serverQueue) {
        return message.reply("there are no songs to shuffle");
    }
    if (serverQueue.songs.length < 2) {
        return message.reply("not enough songs to shuffle");
    }
    var first = serverQueue.songs[0];
    let index = serverQueue.songs.length,
    randomIndex;
    while (index != 0) {
        randomIndex = Math.floor(Math.random() * index);
        index--;
        [serverQueue.songs[index], serverQueue.songs[randomIndex]] = [
            serverQueue.songs[randomIndex],
            serverQueue.songs[index],
        ];
        //swap so serverQueue[0] is always whats currently playing:
    }
        var temp = serverQueue.songs[0];
        if (serverQueue.songs[0] != serverQueue.currentSong) {
            for (let i = 0; i < serverQueue.songs.length; i++) {
                if (serverQueue.songs[i] == first) {
                    serverQueue.songs[0] = serverQueue.songs[i];
                    serverQueue.songs[i] = temp;
                    break;
                }
            }
        }
    // ... command logic
    message.channel.send("Queue has been shuffled")
};
