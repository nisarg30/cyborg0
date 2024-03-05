const user = require('../models/user');

async function watchlist(username){
    const data = await user.findOne({username: username });
    return data.watchlist;
}

module.exports = watchlist;