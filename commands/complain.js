module.exports.help = {
    name: "complain",
    description: "leave a complaint in the console logs",
    usage: "-complain blab blah",
};

module.exports.run = async (client, message, args) => {
    //let complaint = args.toString();
    let complaint = args.join(" ")
    complaint = complaint.substring(10);
    console.log(`complaint from ${message.guild.name} guild id: ${message.guild.id} user: ${message.author.username} complaint: ${complaint}`);
    // ... command logic
};
