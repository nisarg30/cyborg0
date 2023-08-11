const fetch123 = require('./limit_fetch');
const limit = require('../models/limit.js');
const buy_post = require('./buy_post');
const sell_post = require('./sell_post');

module.exports = async function limit_execution(stockname){

    stockname = stockname.toUpperCase();
    const info = await fetch123(stockname);
    const minExPrice = Math.min(info[1], info[2]);
    const maxExPrice = Math.max(info[1], info[2]);
    const data = await limit.find({
        'stockname': stockname,
        'log.ex_price': { $gte: minExPrice, $lte: maxExPrice }
    });

    if(data.length <= 0){
        return;
    }

    for(i in data){

        const order = {
            username : data[i].username,
            stockname : stockname,
            exprice : data[i].ex_price,
            quantity : data[i].quantity,
            ordertime : data[i].ordertime,
            direction : data[i].direction
        }

        if(order.direction === "buy"){
            const x = await buy_post(order);
            console.log(x);
        }
        else{
            const x = await sell_post(order);
            console.log(x);
        }
    }
}