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
        "What the fuck do I do with that letter? do you count in letters?"
      );
    }
    index--;
    let songToBeRemoved = serverQueue.songs[index];
    serverQueue.songs.splice(index, 1);
    message.channel.send(
      `**${songToBeRemoved.title}** by *${songToBeRemoved.author}* has been removed from the queue`
    );
};
