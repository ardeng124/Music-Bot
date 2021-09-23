const Discord = require("discord.js");

module.exports.help = {
    name: ["queue", "q"],
    description: "whatever",
    usage: "whatever",
};

module.exports.run = async (client, message, args) => {
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
        //All this is for calculating the remaning duration of the song
        if(i ==0 ) {
            var time;
            var duration;
            try {
                time = await serverQueue.connection.dispatcher.streamTime;
                duration = await serverQueue.songs[0].length;
            } catch (err) {
                return message.reply("Give me a sec to start playing first");
            }
            time = time /1000;
            time = duration - time;
            let hours = Math.floor(time / 3600);
            time = time - hours *3600
            let mins = Math.floor(time /60); //convert to mins
            let secs = Math.floor(time - mins * 60);
            let timeString ="";
            timeString += ((hours < 10? `0${hours}` :`${hours}`)+":"+(mins < 10? `0${mins}`:`${mins}`)+":"+(secs < 10? `0${secs}` : `${secs}`))
            //time = (Math.round(time *100)/100).toFixed(2);
            embed.addFields({
                name: serverQueue.songs[i].title,
                value: `Position ${i + 1}    *[${timeString}]*`,
            });
        } else {
            embed.addFields({
                name: serverQueue.songs[i].title,
                value: `Position ${i + 1}`, 
            });
        }
    }
    message.channel.send(embed);
};
