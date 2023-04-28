const Discord = require("discord.js");

const fs = require("fs");
module.exports.help = {
    name: "help",
    description: "shows command list with descriptions",
    usage: "-help",
};

module.exports.run = async (client, message, args) => {
    let commands = fs
        .readdirSync("./commands")
        .filter((file) => file.endsWith(".js"))
    const embed = {
        title: "Help",
        color: 0x78b0f0,
        description: "prefix: `-`",
        fields: [],
    }
    commands.forEach((element) => {
        const command = require(`./${element}`)
        embed.fields.push({
            name: `${command.help.name}`,
            value: `**desc:** ${command.help.description} \n **usage:** \`${command.help.usage}\` `,
        })
    })
    message.channel.send({ embeds: [embed] })
};
