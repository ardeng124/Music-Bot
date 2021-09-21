const Discord = require("discord.js");

module.exports.help = {
  name: ["queue", "q"],
  description: "whatever",
  usage: "whatever",
};

module.exports.run = async (client, message, args) => {
  // ... command logic
  const serverQueue = client.queue.get(message.guild.id);

  if (!serverQueue) {
    return message.reply("Queue is empty");
  }
  const embed = new Discord.MessageEmbed()
    .setTitle("🎵 Queue 🎵")
    .setColor(0x78b0f0)
    .setFooter(`server id ${message.guild.id}`)
    .setTimestamp();
  for (let i = 0; i < serverQueue.songs.length; i++) {
    //let length = parseInt(serverQueue.songs[i].duration,10);
    //console.log(serverQueue.songs[i].duration);
    // console.log(length);
    embed.addFields({
      name: serverQueue.songs[i].title,
      value: `Position ${i + 1}`,
    });
  }
  message.channel.send(embed);
};
