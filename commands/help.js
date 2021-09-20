const Discord = require("discord.js");
const fs = require("fs");
module.exports.help = {
    name: "help",
    description: "shows command list with descriptions",
    usage: "-help",
};

module.exports.run = async (client, message, args) => {
    const embed = new Discord.MessageEmbed()
        .setTitle("Help")
        .setColor(0x78b0f0)
        .setDescription("prefix: -");
    let commands = fs.readdirSync("./commands").filter((file) => file.endsWith(".js"));
    commands.forEach((element) => {
        const command = require(`./${element}`);
        embed.addFields({name: command.help.name, value: `**desc:** ${command.help.description} \n **usage:** ${command.help.usage}`})
    });

    message.channel.send(embed);
    // ... command logic
};
