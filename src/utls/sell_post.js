// Import necessary models and libraries
const UserModel = require('../models/user');
const OpenTradesModel = require('../models/open_trades');
const TradeLogModel = require('../models/trade_log');
const path = require('path');
const fs = require('fs');

// Define the main function for selling with a limit order
module.exports = async function sellLimitPostExecution(order) {

    try {

        if (order.ordertime === "delivery") {
            // For delivery orders
            const user = await UserModel.findOne({ username: order.username });
            if (!user) {
                throw new Error("User not found");
            }

            const orderTotal = order.exprice * order.quantity;
            // Update user's balance and open trades balance
            await UserModel.findOneAndUpdate(
                { username: order.username },
                { $inc: { balance: orderTotal } }
            );

            await OpenTradesModel.findOneAndUpdate(
                { username: order.username },
                { $inc: { balance: orderTotal } }
            );

            // Prepare trade log entry for the user
            const tradeLogEntry = {
                date: new Date().toLocaleDateString(),
                ex_price: order.exprice,
                quantity: order.quantity,
                direction: "SELL"
            };
            const existingStock = user.portfolio.find(stock => stock.stockname === order.stockname);

            if (!existingStock) {
                throw new Error("Stock not found in user's portfolio");
            }
            const incAmount = (order.exprice - existingStock.buy_price) * order.quantity;
            // Update trade log with the sell details and realized profit
            const updatedTradeLog = await TradeLogModel.updateOne(
                { username: order.username, 'delivery.stockname': order.stockname },
                {
                    $push: { 'delivery.$.dlog': tradeLogEntry },
                    $inc: { 'delivery.$.realised': incAmount }
                }
            );

            // Remove stocks with non-positive quantities from user's portfolio
            await UserModel.updateOne(
                { username: order.username },
                { $pull: { portfolio: { stockname: order.stockname, quantity: { $lte: 0 }, buy_price : { $gte : 0.1 } } } }
            );

        } else {
            // For intraday orders
            const user = await OpenTradesModel.findOne({ username: order.username });

            if (!user) {
                throw new Error("User not found in open trades");
            }
            
            // Update user's balance and open trades balance
            await UserModel.findOneAndUpdate(
                { username: order.username },
                { $inc: { balance: order.exprice * order.quantity } }
            );

            await OpenTradesModel.findOneAndUpdate(
                { username: order.username },
                { $inc: { balance: order.exprice * order.quantity } }
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
            const incSellprice = (((logosEntry.sell_price * logosEntry.quantity) + (order.exprice * order.quantity)) /
                (logosEntry.quantity + order.quantity)) - logosEntry.sell_price;
            const incQuantity = order.quantity;
            const incRealised = (logosEntry.sell_price - logosEntry.buy_price + incSellprice) * (order.quantity);

            // Update the intraday trade log with the modified entry
            const result = await TradeLogModel.updateOne(
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
                }
            );

            if (!result) {
                throw new Error("Trade log not updated");
            }

            // Remove stocks with non-positive quantities from open trades log
            await OpenTradesModel.findOneAndUpdate(
                { username: order.username },
                { $pull: { log: { stockname: order.stockname, quantity: { $lte: 0 }, ex_price : { $gte : 0.1 } } } }
            );
        }
        // Return success message
        return { "success": "sell post limit exec" };
    } catch (error) {
        console.error("Error in sellLimitPostExecution:", error);
        return { "error": error.message };
    }
}
