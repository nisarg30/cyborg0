const UsersModel = require('../models/user');
const OpenTradesModel = require('../models/open_trades');
const TradeLogModel = require('../models/trade_log');
const { sendUserSpecificUpdate } = require('../socket.js');

function roundToTwo(value) {
    const roundedValue = Math.round(value * 100) / 100;
    return roundedValue;
}

module.exports = async function executeBuyLimitOrder(order) {
    console.log(order);
    try {

        await UsersModel.updateOne(
            { username : order.username },
            {
                $inc : {
                    limitcount : -1,
                }
            }
        );

        if (order.ordertime == 0) {
            // Handle delivery order

            // Update user's portfolio
            const pipeline = [
                { $match: { username : order.username } },
                { $unwind: '$portfolio' },
                { $match: { 'portfolio.stockname':  order.stockname} },
                { $replaceRoot: { newRoot: '$portfolio' } }
            ];
            
            const portfolioElement = await UsersModel.aggregate(pipeline);
            const incBuyprice = ((((portfolioElement[0].buy_price*portfolioElement[0].quantity) + (order.quantity * order.exprice))/(order.quantity + portfolioElement[0].quantity)) - portfolioElement[0].buy_price).toFixed(2);
            const incQuantity = order.quantity ;

            UsersModel.updateOne(
                { username : order.username, 'portfolio.stockname': order.stockname },
                {
                    $inc: {
                        'portfolio.$.quantity': incQuantity,
                        'portfolio.$.buy_price': incBuyprice
                    }
                },
                (err) => {
                    if(err) console.log(err);
                }
            );

            const tradeLogEntry = {
                date : new Date().toLocaleDateString(),
                ex_price : order.exprice,
                direction : 0,
                quantity : order.quantity
            }
            
            TradeLogModel.findOneAndUpdate(
                { username: order.username, 'delivery.stockname': order.stockname },
                {
                    $push: { 'delivery.$.dlog': tradeLogEntry }
                },
                (err) => {
                    if(err) console.log(err);
                }
            );

        } else {
            // Handle non-delivery order
            // Update open trades
            const pipeline = [
                { $match: { username : order.username } },
                { $unwind: '$log' },
                { $match: { 'log.stockname':  order.stockname} },
                { $replaceRoot: { newRoot: '$log' } }
            ];
            
            var logElement = await OpenTradesModel.aggregate(pipeline);
            console.log(logElement);
            logElement = logElement[0];
            const incBuyprice = ((((logElement.ex_price*logElement.quantity) + (order.quantity * order.exprice))/(order.quantity + logElement.quantity)) - logElement.ex_price).toFixed(2);
            console.log(incBuyprice, 'buy post inc price');
            const incQuantity = order.quantity ;

            OpenTradesModel.updateOne(
                { username : order.username, 'log.stockname': order.stockname },
                {
                $inc: {
                    'log.$.quantity': incQuantity,
                    'log.$.ex_price': incBuyprice
                }
                },
                (err) => {
                    if(err) console.log(err);
                }
            );
            // Update intraday trade log
                // console.log("xx");
            const todayDate = new Date().toLocaleDateString(); // Get today's date in yyyy-mm-dd format
            const usernameToFind = order.username; // Replace with the desired username
            
            const x = await TradeLogModel.aggregate([
            {
                $match: {
                    "username": usernameToFind,
                    "intraday": {
                        $elemMatch: {
                            "date": todayDate,
                            "logos": {
                                $elemMatch: {
                                "stockname": order.stockname
                            }
                        }
                        }
                    }
                }
                },
                { $unwind: "$intraday" },
                { $unwind: "$intraday.logos"},
                { $match: {
                    "intraday.logos.stockname": order.stockname
                }},
                { $replaceRoot: {
                    newRoot: "$intraday.logos"
                }}
            ]);

            const intradayEntry = x[0];
            const incIntratradebuyprice = roundToTwo((((intradayEntry.buy_price * intradayEntry.quantity) + (order.quantity*order.exprice))/(order.quantity + intradayEntry.quantity)) - intradayEntry.buy_price);
            
            TradeLogModel.updateOne(
                { "username": order.username, 'intraday.date': todayDate, 'intraday.logos.stockname': order.stockname },
                {
                    $inc: {
                        'intraday.$[i].logos.$[j].buy_price': incIntratradebuyprice
                    },
                },
                {
                    arrayFilters: [
                        { 'i.date': todayDate },
                        { 'j.stockname': order.stockname },
                    ],
                },
                (err) => {
                    if(err) console.log(err);
                }
            );
        }

        const criteria = {
            time : order.time,
            stockname : order.stockname,
            ex_price : order.exprice,
            quantity : order.quantity,
            ordertime : order.ordertime,
            direction : order.direction
        }
        
        TradeLogModel.updateOne(
            { username: order.username },
            { $pull: { limit: criteria } },
            (err, result) => {
                if (err) {
                    console.error('Error:', err);
                    return;
                }
                console.log('Element pulled from the limit array:', result);
            }
        );

        sendUserSpecificUpdate(order.username , criteria)

    } catch (error) {
        console.error("Error:", error.message);
        return { "error": "An error occurred" };
    }
}


