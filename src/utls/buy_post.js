const UsersModel = require('../models/user');
const OpenTradesModel = require('../models/open_trades');
const TradeLogModel = require('../models/trade_log');
const { sendUserSpecificUpdate } = require('../socket.js');

function roundToTwo(value) {
    return Math.round(value * 100) / 100;
}

module.exports = async function executeBuyLimitOrder(orders) {
    console.log(orders);

    const bulkOpsUsers = [];
    const bulkOpsTrades = [];
    const bulkOpsLogs = [];

    for (let order of orders) {
        bulkOpsUsers.push({
            updateOne: {
                filter: { username: order.username },
                update: { $inc: { limitcount: -1 } }
            }
        });

        if (order.ordertime == 0) {
            const pipeline = [
                { $match: { username: order.username } },
                { $unwind: '$portfolio' },
                { $match: { 'portfolio.stockname': order.stockname } },
                { $replaceRoot: { newRoot: '$portfolio' } }
            ];
            const portfolioElement = await UsersModel.aggregate(pipeline);
            const incBuyprice = ((((portfolioElement[0].buy_price * portfolioElement[0].quantity) + (order.quantity * order.exprice)) / (order.quantity + portfolioElement[0].quantity)) - portfolioElement[0].buy_price).toFixed(2);
            const incQuantity = order.quantity;

            bulkOpsUsers.push({
                updateOne: {
                    filter: { username: order.username, 'portfolio.stockname': order.stockname },
                    update: {
                        $inc: {
                            'portfolio.$.quantity': incQuantity,
                            'portfolio.$.buy_price': incBuyprice
                        }
                    }
                }
            });

            const tradeLogEntry = {
                date: new Date().toLocaleDateString(),
                ex_price: order.exprice,
                direction: 0,
                quantity: order.quantity
            };

            bulkOpsLogs.push({
                updateOne: {
                    filter: { username: order.username, 'delivery.stockname': order.stockname },
                    update: { $push: { 'delivery.$.dlog': tradeLogEntry } }
                }
            });

        } else {
            const pipeline = [
                { $match: { username: order.username } },
                { $unwind: '$log' },
                { $match: { 'log.stockname': order.stockname } },
                { $replaceRoot: { newRoot: '$log' } }
            ];
            var logElement = await OpenTradesModel.aggregate(pipeline);
            logElement = logElement[0];
            const incBuyprice = ((((logElement.ex_price * logElement.quantity) + (order.quantity * order.exprice)) / (order.quantity + logElement.quantity)) - logElement.ex_price).toFixed(2);
            const incQuantity = order.quantity;

            bulkOpsTrades.push({
                updateOne: {
                    filter: { username: order.username, 'log.stockname': order.stockname },
                    update: {
                        $inc: {
                            'log.$.quantity': incQuantity,
                            'log.$.ex_price': incBuyprice
                        }
                    }
                }
            });

            const todayDate = new Date().toLocaleDateString();
            const x = await TradeLogModel.aggregate([
                {
                    $match: {
                        "username": order.username,
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
                { $unwind: "$intraday.logos" },
                { $match: { "intraday.logos.stockname": order.stockname } },
                { $replaceRoot: { newRoot: "$intraday.logos" } }
            ]);

            const intradayEntry = x[0];
            const incIntratradebuyprice = roundToTwo((((intradayEntry.buy_price * intradayEntry.quantity) + (order.quantity * order.exprice)) / (order.quantity + intradayEntry.quantity)) - intradayEntry.buy_price);

            bulkOpsLogs.push({
                updateOne: {
                    filter: { "username": order.username, 'intraday.date': todayDate, 'intraday.logos.stockname': order.stockname },
                    update: {
                        $inc: {
                            'intraday.$[i].logos.$[j].buy_price': incIntratradebuyprice
                        }
                    },
                    arrayFilters: [
                        { 'i.date': todayDate },
                        { 'j.stockname': order.stockname }
                    ]
                }
            });
        }

        const criteria = {
            time: order.time,
            stockname: order.stockname,
            ex_price: order.exprice,
            quantity: order.quantity,
            ordertime: order.ordertime,
            direction: order.direction
        };

        bulkOpsLogs.push({
            updateOne: {
                filter: { username: order.username },
                update: { $pull: { limit: criteria } }
            }
        });

        sendUserSpecificUpdate(order.username, criteria);
    }

    try {
        if (bulkOpsUsers.length > 0) {
            await UsersModel.bulkWrite(bulkOpsUsers);
        }
        if (bulkOpsTrades.length > 0) {
            await OpenTradesModel.bulkWrite(bulkOpsTrades);
        }
        if (bulkOpsLogs.length > 0) {
            await TradeLogModel.bulkWrite(bulkOpsLogs);
        }
    } catch (error) {
        console.error("Error:", error.message);
        return { "error": "An error occurred" };
    }
}
