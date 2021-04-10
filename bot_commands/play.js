const ytdl = require("ytdl-core");
// TODO: set queue size
// TODO: When queue is empty unlock
// TODOL add whole playlist
module.exports = {
  name: "play",
  description: "Play a song in your channel!",
  async execute(message, args) {
    try {
      const queue = message.client.queue;
      const serverQueue = queue.get(message.guild.id);

      const voiceChannel = message.member.voice.channel;
      if (!voiceChannel)
        return message.channel.send(
          "You need to be in a voice channel to play music!"
        );
      const permissions = voiceChannel.permissionsFor(message.client.user);
      if (!permissions.has("CONNECT") || !permissions.has("SPEAK")) {
        return message.channel.send(
          "I need the permissions to join and speak in your voice channel!"
        );
      }

      const songInfo = await ytdl.getInfo(args[0]);
      const song = {
        title: songInfo.videoDetails.title,
        url: songInfo.videoDetails.video_url
      };

      if (!serverQueue) {
        const queueContruct = {
          textChannel: message.channel,
          voiceChannel: voiceChannel,
          connection: null,
          songs: [],
          volume: 5,
          playing: true,
          locked: false
        };

        queue.set(message.guild.id, queueContruct);

        queueContruct.songs.push(song);

        try {
          this.play(message, queueContruct.songs[0]);
        } catch (err) {
          console.log(err);
          queue.delete(message.guild.id);
          return message.channel.send(err);
        }
      } 
      else if (serverQueue.locked) {
        message.channel.send(`Sorry looks like the queue is locked.`);
        return;
      }
      else if (serverQueue.songs.length == 0) {
        serverQueue.songs.push(song);

        try {
          this.play(message, serverQueue.songs[0]);
        } catch (err) {
          console.log(err);
          queue.delete(message.guild.id);
          return message.channel.send(err);
        }
      }
      else {
        serverQueue.songs.push(song);
        return message.channel.send(
          `${song.title} has been added to the queue!`
        );
      }
    } catch (error) {
      console.log(error);
      message.channel.send("Dumbass made me crash... " + error.message);
    }
  },

  async play(message, song) {
    const queue = message.client.queue;
    const guild = message.guild;
    const serverQueue = queue.get(message.guild.id);
    
    var connection = await serverQueue.voiceChannel.join();
    serverQueue.connection = connection;

    if (!song) {
      serverQueue.voiceChannel.leave();
      queue.delete(guild.id);
      return;
    }

    const dispatcher = serverQueue.connection
      .play(ytdl(song.url))
      .on("finish", () => {
        serverQueue.songs.shift();
        this.play(message, serverQueue.songs[0]);
      })
      .on("error", error => console.error(error));
    dispatcher.setVolumeLogarithmic(serverQueue.volume / 10);
    serverQueue.textChannel.send(`Start playing: **${song.title}**`);
  }
};