// Import necessary models and libraries
const UserModel = require('../models/user');
const OpenTradesModel = require('../models/open_trades');
const TradeLogModel = require('../models/trade_log');
const path = require('path');
const fs = require('fs');
const { sendUserSpecificUpdate } = require('../socket.js')

function roundToTwo(value) {
    const roundedValue = Math.round(value * 100) / 100;
    return roundedValue;
}
// Define the main function for selling with a limit order
module.exports = async function sellLimitPostExecution(order) {

    try {
        UserModel.updateOne(
            { username : order.username },
            {
                $inc : {
                    limitcount : -1,
                }
            },
            (err) => {
                if(err) console.log(err);
            }
        );

        if (order.ordertime == "0") {
            // For delivery orders
            const user = await UserModel.findOne({ username: order.username });
            if (!user) {
                throw new Error("User not found");
            }

            const orderTotal = roundToTwo(order.exprice * order.quantity);
            // Update user's balance and open trades balance
            UserModel.updateOne(
                { username: order.username },
                { $inc: { balance: orderTotal } },
                (err) => {
                    if(err) console.log(err);
                }
            );

            OpenTradesModel.updateOne(
                { username: order.username },
                { $inc: { balance: orderTotal } },
                (err) => {
                    if(err) console.log(err);
                }
            );

            // Prepare trade log entry for the user
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
            // Update trade log with the sell details and realized profit
            TradeLogModel.updateOne(
                { username: order.username, 'delivery.stockname': order.stockname },
                {
                    $push: { 'delivery.$.dlog': tradeLogEntry },
                    $inc: { 'delivery.$.realised': incAmount }
                },
                (err) => {
                    if(err) console.log(err);
                }
            );

            // Remove stocks with non-positive quantities from user's portfolio
            UserModel.updateOne(
                { username: order.username },
                { $pull: { portfolio: { stockname: order.stockname, quantity: { $lte: 0 }, buy_price : { $gte : 0.1 } } } },
                (err) => {
                    if(err) console.log(err);
                }
            );

        } else {
            // For intraday orders
            const user = await OpenTradesModel.findOne({ username: order.username });

            if (!user) {
                throw new Error("User not found in open trades");
            }
            
            // Update user's balance and open trades balance
            const orderinc = roundToTwo(order.exprice * order.quantity)
            UserModel.updateOne(
                { username: order.username },
                { $inc: { balance: orderinc } },
                (err) => {
                    if(err) console.log(err);
                }
            );

            OpenTradesModel.findOneAndUpdate(
                { username: order.username },
                { $inc: { balance: orderinc } },
                (err) => {
                    if(err) console.log(err);
                }
            );

            // Get today's date and relevant trade log entry
            const today = new Date().toLocaleDateString();
            const trade = await TradeLogModel.findOne({ "username": order.username });
            const intradayEntry = trade.intraday.find(entry => entry.date === today);
            const logosEntry = intradayEntry.logos.find(logo => logo.stockname === order.stockname);

            if (!intradayEntry || !logosEntry) {
                throw new Error("Trade log entry not found");
            }

            // Calculate updated sell price, quantity, and realized profit for intraday trade
            const incSellprice = roundToTwo((((logosEntry.sell_price * logosEntry.quantity) + (order.exprice * order.quantity)) /
                (logosEntry.quantity + order.quantity)) - logosEntry.sell_price);
            const incQuantity = order.quantity;
            const incRealised = roundToTwo((logosEntry.sell_price - logosEntry.buy_price + incSellprice) * (order.quantity));

            // Update the intraday trade log with the modified entry
            TradeLogModel.updateOne(
                { "username": order.username, 'intraday.date': today, 'intraday.logos.stockname': order.stockname },
                {
                    $inc: {
                        'intraday.$[i].logos.$[j].sell_price': incSellprice,
                        'intraday.$[i].logos.$[j].quantity': incQuantity,
                        'intraday.$[i].logos.$[j].realised': incRealised,
                    },
                },
                {
                    arrayFilters: [
                        { 'i.date': today },
                        { 'j.stockname': order.stockname },
                    ],
                },
                (err) => {
                    if(err) console.log(err);
                }
            );

            // Remove stocks with non-positive quantities from open trades log
            OpenTradesModel.findOneAndUpdate(
                { username: order.username },
                { $pull: { log: { stockname: order.stockname, quantity: { $lte: 0 }, ex_price : { $gte : 0.1 } } } },
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

        sendUserSpecificUpdate(order.username , criteria);
        
    } catch (error) {
        console.error("Error in sellLimitPostExecution:", error);
        return { "error": error.message };
    }
}
