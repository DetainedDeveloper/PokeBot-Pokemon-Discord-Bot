const discord = require('discord.js');

const dev = require('./data/dev.json');
// Import data and file containing BOT_TOKEN
const data = require('./data/data.json');
const config = require('./data/config.json');

const client = new discord.Client();

// Prefix will be used to call bot ( p!info Pikachu ), it can be anything
const prefix = 'p!';

// Cram abilitites in one string (There has to be a better option)
function getAbilities(abilities) {
    ability = '';
    abilities.map((element, index) => ability += element['name'] + ' : ' + (element['is_hidden'] === true ? 'Hidden' : 'Not Hidden') + '\n');
    return ability;
};

// Cram stats in one string (There has to be a better option)
function getStats(stats) {
    stat = '';
    stats.map((element, index) => stat += element['name'] + ' : ' + element['base_stat'] + '\n');
    return stat;
};

// Cram types in one string (There has to be a better option)
function getTypes(types) {
    type = '';
    types.map((element, index) => type += element['name'] + '\n');
    return type;
};

function devCard() {
    return new discord.MessageEmbed()
        .setColor('#0099ff')
        .setTitle(dev.title)
        .setDescription(dev.desc)
        .setURL(dev.url)
        .setThumbnail(dev.image_url)
        .addFields(
            { name: dev.bio, value: dev.bio_value },
            { name: dev.github, value: dev.github_value, inline: true },
            { name: dev.insta, value: dev.insta_value, inline: true },
        );
};

// Will be used to send help about commands
function helpCard() {
    return new discord.MessageEmbed()
        .setColor('#0099ff')
        .setTitle('PokeBot Commands')
        .addFields(
            { name: 'p!dev', value: 'Get information about the Developer'},
            { name: 'p!info pokemon_name', value: 'Get information about a specific pokemon' },
            { name: 'p!random', value: 'Get information about a random pokemon' },
            { name: 'p!battle pokemon 1, pokemon 2, ..., pokemon n', value: 'Battle two or multiple pokemons' },
            { name: 'p!ping', value: 'Ping PokeBot' },
            { name: 'p!help', value: 'List all PokeBot commands' },
        );
};

// Will be used to send pokemon info
function pokemonCard(pokemon) {

    return new discord.MessageEmbed()
        .setColor('#0099ff')
        .setTitle(pokemon['name'])
        .setDescription('Click ☝️ to read more!')
        .setURL(pokemon['pokemon_url'])
        .setThumbnail(pokemon['image_url'])
        .addFields(
            { name: 'Height', value: pokemon['height'] + ' cm', inline: true },
            { name: 'Weight', value: pokemon['weight'] + ' kg', inline: true },
            { name: 'XP', value: pokemon['xp'], inline: true },
        )
        .addFields(
            { name: 'Abilities', value: getAbilities(pokemon['abilities']), inline: true },
            { name: 'Stats', value: getStats(pokemon['stats']), inline: true },
            { name: 'Types', value: getTypes(pokemon['types']), inline: true },
        );
};

// Will be used to send winner pokemon
function winnerCard(winner, time) {

    return new discord.MessageEmbed()
        .setColor('#0099ff')
        .setTitle(winner['name'] + ' won!')
        .setDescription('Click ☝️ to read more!')
        .setURL(winner['pokemon_url'])
        .setThumbnail(winner['image_url'])
        .addFields(
            { name: 'XP', value: winner['xp'] },
            { name: 'Stats', value: getStats(winner['stats']) },
        )
        .setFooter('Calulation took ' + time + ' ms');
};

// Perform actions on message received
client.on('message', function (message) {

    // If message is sent by bot itself, return
    if (message.author.bot) return;

    // If message does not start with prefix ( p! ), return
    if (!message.content.startsWith(prefix)) return;

    // Cut out prefix from message
    const commandBody = message.content.slice(prefix.length);

    // Split rest of the string with space ' '
    // p!info Pikachu => ['info', 'pikachu']
    const args = commandBody.split(' ');

    // Removes command from array
    // ['info', 'Pikachu'] => ['Pikachu']
    // info is returned and assigned to command
    const command = args.shift().toLowerCase();

    if (command === 'dev') {
        message.reply(devCard());
    } else if (command === 'ping') {

        // Measures time difference between message received and current time
        const timeTaken = Date.now() - message.createdTimestamp;
        message.reply(`pong!\nReplying with the latency of ${timeTaken}ms`);

    } else if (command === 'help') {
        message.reply(helpCard());
    } else if (command === 'info') {

        // If args[] contains no pokemons
        // send an error message and return
        if (args.length < 1) {
            message.reply('Pokemon name is required.');
            return;
        }

        // Just takes first element from args[]
        // So even if command was p!info Pikachu random_text
        // It would only take 0th element (Pikachu)
        // and convert it to all lower case, Pikachu => pikachu
        // and tries to access it from data
        // where pikachu is now used as key
        const pokemon = data[args[0].toLowerCase()];

        // If key (pikachu) is not in map, it will return undefined
        // So, if undefined it not returned, send pokemonCard
        // Otherwise send an error message
        if (!(pokemon === undefined)) {
            message.reply(pokemonCard(pokemon));
        } else {
            message.reply('Sorry! ' + args[0] + ' is not in my database.');
        }

    } else if (command === 'battle') {

        // If args[] contains only one pokemon
        // send an error message and return
        if (args.length < 2) {
            message.reply('At least two pokemons are requied for battle.');
            return;
        }

        // Takes multiple pokemons as input ['Pikachu', 'Bulbasaur', 'Squirtle', 'Charmander']
        // and converts all of them to lower case one by one
        // ['pikachu', 'bulbasaur', 'squirtle', 'charmander']
        // and then tries to access them from data
        // ['pikachu' : { pikachu_data }, ..., 'charmander' : { charmander_data }]
        const poke_data = args.map((poke, index) => data[poke.toLowerCase()]);

        invalid = false;
        invalid_index = -1;

        // If any of the pokemon was invalid, it would have returned undefined
        for (i = 0; i < poke_data.length; i++) {
            
            // If any value is undefined, invalid = true and its index is assigned
            // and for loop is broken
            if (poke_data[i] === undefined) {
                invalid = true;
                invalid_index = i;
                break;
            }
        }

        // If no value was undefined move ahead otherwise send an error message
        if (!invalid) {

            // Pulls out all base_stat data of every pokemon
            // Use console.log(stats_data) to see the output
            const stats_data = poke_data.map((poke, index) => poke['stats'].map((stat, index) => stat['base_stat']));

            // Create an array filled with 0s of the length of input elements (pokemons)
            // This will be stored to keep count of wins of each pokemon
            win_count = new Array(stats_data.length).fill(0);

            // Compares stats of each pokemon against others
            // and increases score by 1 if stat of that pokemon is greater than other pokeomon's stat

            // I will try to implement a better solution in future
            // For now, this is the very first thing I thought of

            // Let's go through the for loop!
            
            for (i = 0; i < stats_data.length; i++) {

                // assume i = 0, which means we have { 'pikachu' : { pikachu_data } }
                current = stats_data[i];

                // j = 1
                for (j = i + 1; j < stats_data.length; j++) {

                    // Now, get the data of first opponent, { 'bulbasaur' : { bulbasaur_data } }
                    next = stats_data[j];

                    // k = 0
                    for (k = 0; k < current.length; k++) {

                        // If 0th stat of pikachu > 0th stat of bulbasaur
                        // pikachu's score in win_count increases by 1
                        
                        // But in reality, 35 > 45 is false
                        // So, bulbasaur wins and its score increases by 1
                        // Now, win_count becomes [0, 0, 0, 0] => [0, 1, 0, 0]

                        // This happens for every stat and for every pokemon
                        // This for loop can be more efficient by eleminating the pokemons
                        // who already had a fight, but that's for later

                        current[k] > next[k] ? win_count[i] += 1 : win_count[j] += 1;
                    }
                }
            }

            // Pulls out pokemons' xp and retirns an array
            xp_data = poke_data.map((poke, index) => poke['xp']);

            // Picks the highest xp amongst the arary
            // and the returns it's index to know which pokemon it belongs to
            xp_winner = xp_data.indexOf(Math.max.apply(null, xp_data));

            // and increases that pokemon's score in win_count array
            win_count[xp_winner] += 1;

            // At last, it picks the highest win count
            // and returns it's index to get the pokemon's name from arguments
            // here bulbasaur wins
            const winner = data[args[win_count.indexOf(Math.max.apply(null, win_count))].toLowerCase()];

            // Just to keep track of how much time the calulation took
            message.reply(winnerCard(winner, (Date.now() - message.createdTimestamp)));

        } else {
            message.reply('Can\'t battle pokemons because ' + args[invalid_index] + ' is an invalid pokemon.');
        }
    } else if (command === 'random') {
        // Yet to be implemented
        // Nobody remembers all pokemons, so random will send data of random pokemons
        // and maybe make muliple random pokemons fight with eachother, who knows!
        message.reply('Yet to be implemented!');
    } else {

        // If nothing worked, send an error message
        message.reply('Unknown command, please try p!help to list all PokeBot commands.');
    }
});

// This line is extremely important !!!
// If you don't provide the correct token, your bot won't be running !
client.login(config.BOT_TOKEN);
