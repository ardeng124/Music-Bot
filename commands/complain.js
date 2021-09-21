module.exports.help = {
    name: "complain",
    description: "leave a complaint in the console logs",
    usage: "-complain blab blah",
};

module.exports.run = async (client, message, args) => {
    
    console.log(`complaint from ${message.guild.name} user: ${message.author.username} complaint: ${args}`);
    // ... command logic
};
