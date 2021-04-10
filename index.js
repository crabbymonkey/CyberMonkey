const fs = require('fs')
const Discord = require('discord.js');
const Client = require('./client/Client');
const WS = require('./ws/ws')
const config = require('./config.json');

const client = new Client();
client.commands = new Discord.Collection();
var ws = new WS(config.ws.token, config.ws.port, client);

const commandFiles = fs.readdirSync('./bot_commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const command = require(`./bot_commands/${file}`);
	client.commands.set(command.name, command);
}

client.once('ready', () => {
    console.log(`${client.user.tag} is Online!`)
});

client.once('reconnecting', () => {
	console.log('Reconnecting!');
});

client.once('disconnect', () => {
	console.log('Disconnect!');
});

client.on('message', async message => {
	if (message.author.bot) return;
    if (!message.content.startsWith(config.prefix)) return;

	const args = message.content.slice(config.prefix.length).split(/ +/);
	const commandName = args.shift().toLowerCase();
	const command = client.commands.get(commandName);

	try {
		if(commandName == "ban" || commandName == "userinfo") {
			command.execute(message, args, client);
        } 
        else if(commandName == "play" || commandName == "purge") {
			command.execute(message, args);
        } 
        else {
			command.execute(message);
		}
	} catch (error) {
		console.error(error);
		message.reply('There was an error trying to execute that command!');
	}
});

client.login(config.token);