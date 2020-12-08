// Database
const Datastore = require('nedb')
const database = new Datastore('data/stats.db')
database.loadDatabase()
database.count({}, (err, n) => {
    if (n === 0) {
        database.insert({
            cash: 0,
            pick_level: 0,
            pick_cost: 0,
            backpack_level: 0,
            backpack_cost: 0,
            rebirth: 0,
            prestige: 0,
            crates: 0
        })
    }
})


// Page elements
const authorization_field = document.getElementById('authorization')
const channel_field = document.getElementById('channel')
const start_button = document.getElementById('start')
const stop_button = document.getElementById('stop')


// User object
let user = {
    auth: '',
    channel_id: ''
}


// Bot object
let bot = {
    on: false,
    paused: false,
    loop: null,
    loop_time: 100
}


// Bot functions
function bot_on() {
    clearInterval(bot.loop)
    bot_loop_setup()
    bot.loop = setInterval(bot_loop, bot.loop_time)
    bot.on = true
    bot.paused = false
    console.log('The bot is on!')
}
function bot_off() {
    clearInterval(bot.loop)
    bot.loop = null
    bot.on = false
    bot.paused = false
    console.log('The bot is off!')
}
function bot_pause() {
    bot.paused = true
}
function bot_unpause() {
    bot.paused = false
}


// Button events
start_button.addEventListener('click', async () => {
    if (authorization_field.value !== '' &&
        channel_field.value !== '') {

        let response = await getMessage(
            authorization_field.value,
            channel_field.value
        )
        if (response.ok) {
            user.auth = authorization_field.value
            user.channel_id = channel_field.value
            bot_on()
        } else {
            console.log('Cannot start the bot!\n' +
                'Invalid authorization or channel id!')
        }
    } else {
        console.log('Cannot start the bot!\n' +
            'Fill out the fields!')
    }
})

stop_button.addEventListener('click', () => {
    bot_off()
})


// Bot loop
// get
let get_processed = true
let get_attempts = 0
let looking_for_more = false
let time_of_last_get = 0
let get_cooldown = 500
// post
let post_processed = true
let post_attempts = 0

let next_command = ''

let time_of_last_command = 0
let random_command_delay = 0
let command_cooldown = 3000

let time_of_last_hunt = 0
let hunt_cooldown = 310000

let time_of_last_fish = 0
let fish_cooldown = 310000

let time_of_last_quiz = 0
let quiz_cooldown = 310000

let time_of_last_wings = 0
let wings_cooldown = 430000

let time_of_last_rage = 0
let rage_cooldown = 430000

let time_of_last_eq = 0
let eq_cooldown = 430000

let time_of_last_sell = 0
let sell_cooldown = 5000
function bot_loop_setup() {
    // test get fail
    // user.auth = 'sdafasdfas'
    get_processed = true
    get_attempts = 0
    looking_for_more = false
    time_of_last_get = 0

    post_processed = true
    post_attempts = 0

    next_command = ''

    time_of_last_command = 0
    random_command_delay = 0

    time_of_last_hunt = 0

    time_of_last_fish = 0

    time_of_last_quiz = 0

    time_of_last_wings = 0

    time_of_last_rage = 0

    time_of_last_eq = 0

    time_of_last_sell = 0
}
async function bot_loop() {
    // check if the last command finished processing
    if (!get_processed) {
        console.log('processing get...')
        return
    }

    // only consider sending another command if the previous 
    // command has found and processed its response
    if (!looking_for_more) {
        // check if a command has been sent already
        if (!post_processed) {
            console.log('processing post...')
            return
        }

        // check if the command cooldown is over
        if (Date.now() - time_of_last_command < command_cooldown + random_command_delay) return


        // bot logic
        /**
         * order of operations
         * hunt
         * fish
         * quiz
         * wings
         * up pick/backpack
         * rebirth
         * sell
         */

        // decide which command to send
        let now = Date.now()
        let stats = getStats()
        if (now - time_of_last_hunt > hunt_cooldown) {
            next_command = ';h'
        } else if (now - time_of_last_fish > fish_cooldown) {
            next_command = ';f'
            // } else if (now - time_of_last_quiz > quiz_cooldown) {
            //     next_command = ';s'
        } else if (now - time_of_last_wings > wings_cooldown) {
            next_command = ';wings'
        } else if (now - time_of_last_rage > rage_cooldown) {
            next_command = ';rage'
        } else if (now - time_of_last_eq > eq_cooldown) {
            next_command = ';eq'
        }
        else if ((stats.pick_level < 200 || stats.backpack_level < 200) &&
            (stats.cash > stats.pick_cost || stats.cash > stats.backpack_cost)) {
            if (stats.pick_level < 25) {
                next_command = ';up p max'
            } else if (stats.backpack_level < 25) {
                next_command = ';up b max'

            } else if (stats.pick_level < 50) {
                next_command = ';up p max'
            } else if (stats.backpack_level < 50) {
                next_command = ';up b max'

            } else if (stats.pick_level < 100) {
                next_command = ';up p max'
            } else if (stats.backpack_level < 100) {
                next_command = ';up b max'

            } else if (stats.pick_level < 200) {
                next_command = ';up p max'
            } else if (stats.backpack_level < 200) {
                next_command = ';up b max'
            }
        } else if (stats.rebirth > 24 && stats.pick_level > 199 && stats.backpack_level > 199) {
            next_command = ';prestige'
        } else if (stats.pick_level > 199 && stats.backpack_level > 199) {
            next_command = ';rebirth'
        } else if (now - time_of_last_sell > sell_cooldown) {
            next_command = ';s'
        } else {
            return
        }


        post_processed = false

        let post_response = await sendMessage(user.auth, user.channel_id, next_command)
        // console.log(post_response)
        console.log(`Sent ${next_command}`)

        // update the timers
        switch (next_command) {
            case ';h':
                time_of_last_hunt = Date.now()
                break
            case ';f':
                time_of_last_fish = Date.now()
                break
            case ';q':
                time_of_last_quiz = Date.now()
                break
            case ';wings':
                time_of_last_wings = Date.now()
                break
            case ';rage':
                time_of_last_rage = Date.now()
                break
            case ';eq':
                time_of_last_eq = Date.now()
                break
            case ';s':
                time_of_last_sell = Date.now()
                break
        }
        time_of_last_command = Date.now()
        random_command_delay = Math.round(Math.random() * 2000)

        if (!post_response.ok) {
            console.log('Post failed!')
            post_attempts++
            if (post_attempts > 2) {
                console.log('Post failed 3 times!')
                bot_off()
            }
            post_processed = true
            return
        }

        post_processed = true
    }
    // look for a response after a command has been sent

    if (Date.now() - time_of_last_get < get_cooldown) return

    get_processed = false

    let get_response = await getMessage(user.auth, user.channel_id)
    // console.log(get_response)
    time_of_last_get = Date.now()

    if (!get_response.ok) {
        console.log('Get failed!')
        get_attempts++
        if (get_attempts > 2) {
            console.log('Get failed 3 times!')
            bot_off()
        }
        get_processed = true
        return
    }

    // process the response
    let message = (await get_response.json())[0]

    // check if the answer comes from the bot
    if (message.author.id !== '518759221098053634') {
        get_processed = true
        looking_for_more = true
        return
    }
    looking_for_more = false

    console.log(message)

    // update the database
    let result = null
    switch (next_command) {
        case ';s':
            result = sell(message)
            if (result.success) {
                await setValue('cash', result.cash)
            }
            break
        case ';up p max':
            result = upPick(message)
            if (result.success) {
                await setValue('cash', getStats().cash - result.cost)
                await setValue('pick_level', result.level)
            } else {
                await setValue('cash', 0)
                await setValue('pick_cost', result.cost)
            }
            break
        case ';up b max':
            result = upPick(message)
            if (result.success) {
                await setValue('cash', getStats().cash - result.cost)
                await setValue('backpack_level', result.level)
            } else {
                await setValue('cash', 0)
                await setValue('backpack_cost', result.cost)
            }
            break
        case ';prestige':
            await setValue('cash', 0)
            await setValue('pick_level', 0)
            await setValue('pick_cost', 0)
            await setValue('backpack_level', 0)
            await setValue('backpack_cost', 0)
            await setValue('rebirth', 0)
            await setValue('prestige', getStats().prestige + 1)
            break
        case ';rebirth':
            await setValue('cash', 0)
            await setValue('pick_level', 0)
            await setValue('pick_cost', 0)
            await setValue('backpack_level', 0)
            await setValue('backpack_cost', 0)
            await setValue('rebirth', getStats().rebirth + 1)
            break
    }

    console.log('Stats', getStats())

    get_processed = true
}


// Database function wrappers
/**
 * @returns {Object}
 */
function getStats() {
    database.persistence.compactDatafile()
    return database.getAllData()[0]
}

/**
 * @param {String} key 
 * @param {any} value 
 */
async function setValue(key, value) {
    await dbUpdateWrapper(database, {}, {
        $set: {
            [key]: value
        }
    })
}

/**
 * @param {Nedb<any>} database 
 * @param {any} query 
 * @param {any} update 
 * @param {Nedb.UpdateOptions} options 
 * @returns {Promise}
 */
function dbUpdateWrapper(database, query, update, options = {}) {
    return new Promise((resolve, reject) => {
        database.update(query, update, options, (err, numberOfUpdated, upsert) => {
            if (err) {
                reject(err)
            } else {
                resolve(numberOfUpdated, upsert)
            }
        })
    })
}


// Read Messages Functions
/**
 * Gets the amount of cash from the sell message if the request was successful
 * @param {Object} message
 * @returns {Object} success, cash
 */
function sell(message) {
    let success = message.embeds[0] !== undefined
    return {
        success: success,
        cash: success ? parseInt(
            message.embeds[0].description
                .split(/\n/).pop()
                .replace(/\D/g, '', 10)
        ) : -1
    }
}

/**
 * Returns if the upgrade was successful, the cost of the upgrade and the level of the pickaxe
 * @param {Object} message 
 * @returns {Object} success, cost, level
 */
function upPick(message) {
    let lastLine = message.content.split(/\n/).pop()
    let success = /-/g.test(lastLine)
    let level = null
    try {
        level = success ? parseInt(
            message.content.split(/\n/)[0]
                .match(/>> \**\d+/g)[0]
                .match(/\d+/g)[0]
        ) : -1
    } catch (err) {
        level = success ? parseInt(
            message.content.split(/\n/)[1]
                .match(/>> \**\d+/g)[0]
                .match(/\d+/g)[0]
        ) : -1
    }
    return {
        success: success,
        cost:
            parseInt(
                success ? lastLine.replace(/\D/g, '') :
                    lastLine.replace(/\D/g, '').substring(1)
            )
        ,
        level: level
    }
}


// API functions
/**
 * @param {String} authorization user
 * @param {String} channelId channel
 * @returns {Promise<Response>} response
 */
async function getMessage(authorization, channelId) {
    return await fetch(`https://discord.com/api/v8/channels/${channelId}/messages?limit=1`,
        {
            method: 'GET',
            headers: {
                Accept: '*/*',
                'Accept-Language': 'en-US',
                Authorization: authorization,
                'Content-Type': 'application/json',
            }
        })
}

/**
 * @param {String} authorization user
 * @param {String} channelId channel
 * @param {String} text text
 * @returns {Promise<Response>} response
 */
async function sendMessage(authorization, channelId, text) {
    return await fetch(`https://discord.com/api/v8/channels/${channelId}/messages`,
        {
            method: 'POST',
            headers: {
                Accept: '*/*',
                'Accept-Language': 'en-US',
                Authorization: authorization,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                content: text
            })
        })
}