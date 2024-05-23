const UserModel = require('../models/user');
const OpenTradesModel = require('../models/open_trades');
const TradeLogModel = require('../models/trade_log');
const { sendUserSpecificUpdate } = require('../socket.js')

function roundToTwo(value) {
    return Math.round(value * 100) / 100;
}

module.exports = async function sellLimitPostExecution(orders) {
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

        if (order.ordertime == "0") {
            const user = await UserModel.findOne({ username: order.username });
            if (!user) {
                throw new Error("User not found");
            }

            const orderTotal = roundToTwo(order.exprice * order.quantity);
            bulkOpsUsers.push({
                updateOne: {
                    filter: { username: order.username },
                    update: { $inc: { balance: orderTotal } }
                }
            });

            bulkOpsTrades.push({
                updateOne: {
                    filter: { username: order.username },
                    update: { $inc: { balance: orderTotal } }
                }
            });

            const tradeLogEntry = {
                date: new Date().toLocaleDateString(),
                ex_price: order.exprice,
                quantity: order.quantity,
                direction: 1,
            };
            const existingStock = user.portfolio.find(stock => stock.stockname === order.stockname);

            if (!existingStock) {
                throw new Error("Stock not found in user's portfolio");
            }
            const incAmount = roundToTwo((order.exprice - existingStock.buy_price) * order.quantity);

            bulkOpsLogs.push({
                updateOne: {
                    filter: { username: order.username, 'delivery.stockname': order.stockname },
                    update: {
                        $push: { 'delivery.$.dlog': tradeLogEntry },
                        $inc: { 'delivery.$.realised': incAmount }
                    }
                }
            });

            bulkOpsUsers.push({
                updateOne: {
                    filter: { username: order.username },
                    update: { $pull: { portfolio: { stockname: order.stockname, quantity: { $lte: 0 }, buy_price: { $gte: 0.1 } } } }
                }
            });

        } else {
            const user = await OpenTradesModel.findOne({ username: order.username });
            if (!user) {
                throw new Error("User not found in open trades");
            }

            const orderinc = roundToTwo(order.exprice * order.quantity);
            bulkOpsUsers.push({
                updateOne: {
                    filter: { username: order.username },
                    update: { $inc: { balance: orderinc } }
                }
            });

            bulkOpsTrades.push({
                updateOne: {
                    filter: { username: order.username },
                    update: { $inc: { balance: orderinc } }
                }
            });

            const today = new Date().toLocaleDateString();
            const trade = await TradeLogModel.findOne({ "username": order.username });
            const intradayEntry = trade.intraday.find(entry => entry.date === today);
            const logosEntry = intradayEntry.logos.find(logo => logo.stockname === order.stockname);

            if (!intradayEntry || !logosEntry) {
                throw new Error("Trade log entry not found");
            }

            const incSellprice = roundToTwo((((logosEntry.sell_price * logosEntry.quantity) + (order.exprice * order.quantity)) / (logosEntry.quantity + order.quantity)) - logosEntry.sell_price);
            const incQuantity = order.quantity;
            const incRealised = roundToTwo((logosEntry.sell_price - logosEntry.buy_price + incSellprice) * (order.quantity));

            bulkOpsLogs.push({
                updateOne: {
                    filter: { "username": order.username, 'intraday.date': today, 'intraday.logos.stockname': order.stockname },
                    update: {
                        $inc: {
                            'intraday.$[i].logos.$[j].sell_price': incSellprice,
                            'intraday.$[i].logos.$[j].quantity': incQuantity,
                            'intraday.$[i].logos.$[j].realised': incRealised,
                        }
                    },
                    arrayFilters: [
                        { 'i.date': today },
                        { 'j.stockname': order.stockname }
                    ]
                }
            });

            bulkOpsTrades.push({
                updateOne: {
                    filter: { username: order.username },
                    update: { $pull: { log: { stockname: order.stockname, quantity: { $lte: 0 }, ex_price: { $gte: 0.1 } } } }
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
            await UserModel.bulkWrite(bulkOpsUsers);
        }
        if (bulkOpsTrades.length > 0) {
            await OpenTradesModel.bulkWrite(bulkOpsTrades);
        }
        if (bulkOpsLogs.length > 0) {
            await TradeLogModel.bulkWrite(bulkOpsLogs);
        }
    } catch (error) {
        console.error("Error in sellLimitPostExecution:", error.message);
        return { "error": error.message };
    }
}
