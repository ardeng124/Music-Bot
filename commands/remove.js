module.exports.help = {
        name: ["remove","r"],
        description: "removes a song from queue",
        usage: "-remove number OR -r number",
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
        if(index > serverQueue.songs.length-1 || index < 0) {
            return message.reply("That position isn't in the queue buddy")
        }
        let songToBeRemoved = serverQueue.songs[index];
        if(index == 0) {
            serverQueue.looping = false;
            serverQueue.connection.dispatcher.end()
        } else {
        serverQueue.songs.splice(index, 1);
        }
        message.channel.send(
            `\`${songToBeRemoved.title}\` by \`${songToBeRemoved.author}\` has been removed from the queue`
        );
};
