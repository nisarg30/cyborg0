const fetch123 = require('./limit_fetch');
const limit = require('../models/limit.js');
const buy_post = require('./buy_post');
const sell_post = require('./sell_post');
const moment = require('moment-timezone');

module.exports = async function limit_execution(stockname) {

    if(stockname == undefined ) return;
        console.log(stockname);
    // stockname = stockname.toUpperCase();
    let fetchResult = await fetch123(stockname);
    const minExPrice = Math.min(fetchResult.curr, fetchResult.prev);
    const maxExPrice = Math.max(fetchResult.curr, fetchResult.prev);

    const logTime = moment.tz(this.ordertime, 'Asia/Kolkata');
    const timeString = logTime.format('HH:mm:ss');

    console.log(timeString);
    let limitData = await limit.aggregate([
        { $match: { 'stockname': stockname } },
        { $project: {
            log: {
                $filter: {
                    input: '$log',
                    as: 'item',
                    cond: {
                        $and: [
                            { $lte: ['$$item.time', timeString] },
                            { $gte: ['$$item.exprice', minExPrice] },
                            { $lte: ['$$item.exprice', maxExPrice] }
                        ]
                    }
                }
            }
        }}
    ]);
    

    console.log(limitData);

    if (!limitData || limitData.length === 0) {
        return;
    }
    
    await limit.updateMany(
        { stockname: stockname },
        { $pull: { log: { exprice: { $gte: minExPrice, $lte: maxExPrice }, time: { $lte: timeString } } } }
    );

    // Assuming we have data and each item has `log` which is not empty.
    const logs = limitData[0].log || [];
    for (let i = 0; i < logs.length; i++) {
        const log = logs[i];
        const order = {
            username: log.username,
            time: log.time,
            stockname: stockname,
            exprice: log.exprice,
            quantity: log.quantity,
            ordertime: log.ordertime,
            direction: log.direction
        };

        console.log(order);
        
        try {
            if (order.direction === 0) {
                buy_post(order).then((error) => {
                    if(error) console.log(error);
                }) 
            } else {
                sell_post(order).then((error) => { 
                    if(error) console.log(error);                    
                });
            } 
        } catch (error) {
            console.error('Error processing order:', error);
        }
    }
    return;
}
