const UsersModel = require('../models/user');
const OpenTradesModel = require('../models/open_trades');
const TradeLogModel = require('../models/trade_log');
const fetchPrice = require('../utls/s_price');
const fs = require('fs');
const { json } = require('body-parser');
const path = require('path');

module.exports = async function executeBuyLimitOrder(order) {
    try {

        if (order.ordertime === "delivery") {
            // Handle delivery order

            // Update user's portfolio
        const pipeline = [
            { $match: { username : order.username } },
            { $unwind: '$portfolio' },
            { $match: { 'portfolio.stockname':  order.stockname} },
            { $replaceRoot: { newRoot: '$portfolio' } }
        ];
        
        const portfolioElement = await UsersModel.aggregate(pipeline);
        const incBuyprice = (((portfolioElement[0].buy_price*portfolioElement[0].quantity) + (order.quantity * order.exprice))/(order.quantity + portfolioElement[0].quantity)) - portfolioElement[0].buy_price;
        const incQuantity = order.quantity ;

        await UsersModel.updateOne(
            { username : order.username, 'portfolio.stockname': order.stockname },
            {
            $inc: {
                'portfolio.$.quantity': incQuantity,
                'portfolio.$.buy_price': incBuyprice
            }
            },
        );

        const tradeLogEntry = {
            date : new Date().toLocaleDateString(),
            ex_price : order.exprice,
            direction : "BUY",
            quantity : order.quantity
        }
        
        await TradeLogModel.findOneAndUpdate(
            { username: order.username, 'delivery.stockname': order.stockname },
            {
                $push: { 'delivery.$.dlog': tradeLogEntry }
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
            logElement = logElement[0];
            const incBuyprice = (((logElement.ex_price*logElement.quantity) + (order.quantity * order.exprice))/(order.quantity + logElement.quantity)) - logElement.ex_price;
            const incQuantity = order.quantity ;
            await OpenTradesModel.updateOne(
                { username : order.username, 'log.stockname': order.stockname },
                {
                $inc: {
                    'log.$.quantity': incQuantity,
                    'log.$.ex_price': incBuyprice
                }
                },
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
            const incIntratradebuyprice = (intradayEntry.buy_price * intradayEntry.quantity) + (order.quantity*order.exprice)/(order.quantity + intradayEntry.quantity) - intradayEntry.buy_price;
            
            const result = await TradeLogModel.updateOne(
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
                }
            );
        }

        return { "success": "Buy order post execution successful" };

    } catch (error) {
        console.error("Error:", error.message);
        return { "error": "An error occurred" };
    }
}
