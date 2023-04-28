module.exports.help = {
    name: "bump",
    description: "bump a song to the front of the queue",
    usage: "-bump position",
};

module.exports.run = async (client, message, args) => {
    const serverQueue = client.queue.get(message.guild.id);
    var index = args[1];
    if (!message.member.voice.channel) {
      return message.reply(
        "you have to be in a vc to remove items from queue!"
      );
    }
    if (!serverQueue) {
      return message.reply("Nothing in the queue to remove");
    }
    if (isNaN(index)) {
      return message.reply(
        "What do I do with that letter? do you count in letters?"
      );
    }
    index--;
    if (index > serverQueue.songs.length - 1 || index < 0) {
        return message.reply("That position isn't in the queue buddy")
    }
    if(index == 0) {
        return message.reply("that is the first item in the queue");
    }
    let songToBump = serverQueue.songs[index]
    // let i = serverQueue.songs.length;
    // while (i >= 0) {
        //     if(serverQueue)
        //     serverQueue.songs[i+1] = serverQueue.songs[i];
        //     i--;
        // }
    let currentSong = serverQueue.songs[0];
    serverQueue.songs.unshift(songToBump)
    serverQueue.songs.splice(index + 1, 1)
    serverQueue.songs.splice(1,0,songToBump);
    serverQueue.looping = false;
    serverQueue.player.stop()
    message.channel.send(
        ` \`${songToBump.title}\` has been moved to the front of the queue`
    )
};

