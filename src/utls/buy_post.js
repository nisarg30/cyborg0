const UsersModel = require('../models/user');
const OpenTradesModel = require('../models/open_trades');
const TradeLogModel = require('../models/trade_log');
const fetchPrice = require('../utls/s_price');
const fs = require('fs');
const { json } = require('body-parser');
const path = require('path');

module.exports = async function executeBuyLimitOrder(order) {
    try {
        console.log("Executing buy limit order");

        if (order.ordertime === "delivery") {
            // Handle delivery order

            // Update user's portfolio
            const user = await UsersModel.findOne({ username: order.username });
            if (!user) {
                throw new Error("User not found");
            }

            const portfolio = user.portfolio;

            const existingStockIndex = portfolio.findIndex(item => item.stockname === order.stockname);

            if (existingStockIndex !== -1) {
                const existingItem = portfolio[existingStockIndex];
                existingItem.buy_price = ((existingItem.ex_price * existingItem.quantity) + (order.quantity * order.exprice)) / (order.quantity + existingItem.quantity);
                existingItem.quantity += order.quantity;
            } else {
                portfolio.push({
                    stockname: order.stockname,
                    buy_price: order.exprice,
                    quantity: order.quantity
                });
            }

            await UsersModel.updateOne(
                { "username": order.username },
                { $set: { portfolio } }
            );

            // Update delivery trade log
            const tradeEntry = {
                date: new Date().toLocaleDateString(),
                ex_price: order.exprice,
                quantity: order.quantity,
                direction: "BUY"
            };

            TradeLogModel.findOneAndUpdate(
                {
                    username: order.username,
                    'delivery.stockname': order.stockname
                },
                { $push: { 'delivery.$.dlog': tradeEntry } }, 
                async (err, updatedTradeLog) => {
                    if (err) {
                        console.error('Error:', err);
                    } else if (!updatedTradeLog) {
    
                        const newDeliveryEntry = {
                            stockname : order.stockname,
                            realised : 0,
                            dlog : [tradeEntry]
                        }
                        TradeLogModel.findOneAndUpdate(
                            {
                                username: order.username
                            },
                            { $push: { delivery: newDeliveryEntry } },
                            (err, updatedTradeLog) => {
                                if (err) {
                                    console.error('Error:', err);
                                } else if (!updatedTradeLog) {
                                    console.log('Document not found.');
                                } else {
                                    console.log('Updated TradeLog:');
                                }
                            }
                        );
                    } else {
                        console.log('Updated TradeLog:');
                    }
                }            
            );

        } else {
            // Handle non-delivery order

            // Update open trades
            const openTradesData = await OpenTradesModel.findOne({ "username": order.username });
            if (!openTradesData) {
                throw new Error("Open trades data not found");
            }

            const existingTradeIndex = openTradesData.log.findIndex(item => item.stockname === order.stockname);

            if (existingTradeIndex !== -1) {
                const existingTrade = openTradesData.log[existingTradeIndex];
                existingTrade.ex_price = ((existingTrade.ex_price * existingTrade.quantity) + (order.exprice * order.quantity)) / (existingTrade.quantity + order.quantity);
            } else {
                openTradesData.log.push({
                    stockname: order.stockname,
                    ex_price: order.exprice,
                    quantity: order.quantity,
                    direction: "BUY"
                });
            }

            await OpenTradesModel.updateOne(
                { "username": order.username },
                { $set: { log: openTradesData.log } }
            );

            // Update intraday trade log
            const intradayQuery = {
                "username": order.username,
                'intraday.date': new Date().toLocaleDateString()
            };

            const intradayData = await TradeLogModel.findOne(intradayQuery).select('intraday.$');

            if (!intradayData) {
                // Create new intraday log entry
                const newIntradayObject = {
                    date: new Date().toLocaleDateString(),
                    logos: [{
                        stockname: order.stockname,
                        quantity: order.quantity,
                        buy_price: order.exprice,
                        sell_price: 0,
                        realised: 0
                    }]
                }
                await TradeLogModel.updateOne(
                    { username: order.username },
                    { $push: { intraday: newIntradayObject } }
                );
            } else {
                const intradayArray = intradayData.intraday[0].logos;

                // Check if the stock is already in the intraday log
                const existingIntradayTradeIndex = intradayArray.findIndex(item => item.stockname === order.stockname);

                if (existingIntradayTradeIndex !== -1) {
                    // Update existing intraday trade
                    const existingIntradayTrade = intradayArray[existingIntradayTradeIndex];
                    existingIntradayTrade.buy_price = ((existingIntradayTrade.buy_price * existingIntradayTrade.quantity) + (order.quantity * order.exprice)) / (order.quantity + existingIntradayTrade.quantity);
                } else {
                    // Add a new intraday trade
                    intradayArray.push({
                        stockname: order.stockname,
                        quantity: order.quantity,
                        buy_price: order.exprice,
                        sell_price: 0,
                        realised: 0
                    });
                }

                // Update and save the intraday log
                const intradayUpdate = { 'intraday.$.logos': intradayArray };
                await TradeLogModel.findOneAndUpdate(
                    intradayQuery,
                    { $set: intradayUpdate }
                );
            }
        }

        return { "success": "Buy order post execution successful" };

    } catch (error) {
        console.error("Error:", error.message);
        return { "error": "An error occurred" };
    }
}
