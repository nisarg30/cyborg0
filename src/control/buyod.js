const express = require('express');
const router = express.Router();

const Users = require('../models/user');
const op_logs = require('../models/open_trades');
const td_logs = require('../models/trade_log');
const fetchStockPrice = require('../utls/s_price');

function roundToTwo(value) {
    const roundedValue = Math.round(value * 100) / 100;
    return roundedValue;
}

module.exports = async function (req, res) {
    console.log(req.session.userId);

    if (!req.session.userId) {
        return res.send({ Success: "login required." });
    }

    const stockName = req.body.stockname;
    const orderTime = req.body.ordertime;
    const quantity = req.body.quantity;

    // Fetch the current stock price
    const exPrice = parseFloat(await fetchStockPrice(stockName));

    try {
        // Find the user's data
        const user = await Users.findOne({ username: req.session.userId });

        if (orderTime === "delivery") {
            // Handle delivery order
            if (user.balance < exPrice * quantity) {
                return res.send({
                    success: "insufficient funds.",
                    available: Math.floor(user.balance / exPrice)
                });
            }

            const portfolio = user.portfolio;
            const existingStock = portfolio.find(stock => stock.stockname === stockName);

            // Update user's balance and portfolio
            const amttoinc = roundToTwo(quantity*exPrice);
            await op_logs.updateOne(
                { username: req.session.userId },
                { $inc: { balance: - amttoinc } }
            );

            if (!existingStock) {
                // Add new stock to user's portfolio
                const element = {
                    stockname: stockName,
                    buy_price: exPrice,
                    quantity: quantity
                };

                await Users.updateOne(
                    { username: req.session.userId },
                    { $push: { portfolio : element} },
                    { $inc : { balance : amttoinc } }
                );
            } else {
                // Update existing stock's details in the portfolio
                existingStock.buy_price = (existingStock.buy_price * existingStock.quantity + exPrice * quantity) / (existingStock.quantity + quantity);
				existingStock.quantity += quantity;

                await Users.updateOne(
                    { username: req.session.userId },
                    { $set: { balance: user.balance - (quantity * exPrice), portfolio: portfolio } }
                );
            }

            // Update delivery trade logs
            const tradeLog = await td_logs.findOne({ username: req.session.userId });

            if (tradeLog) {
                const stockLog = tradeLog.delivery.find(log => log.stockname === stockName);

                if (!stockLog) {
                    // Add new stock entry in trade logs
                    tradeLog.delivery.push({
                        stockname: stockName,
						realised: 0,
                        dlog: [{
                            date: new Date().toLocaleDateString(),
                            ex_price: exPrice,
                            direction: "BUY",
                            quantity: quantity
                        }]
                    });
                } else {
                    // Update existing stock entry in trade logs
                    stockLog.dlog.push({
                        date: new Date().toLocaleDateString(),
                        ex_price: exPrice,
                        direction: "BUY",
                        quantity: quantity
                    });
                }

                await td_logs.updateOne(
                    { username: req.session.userId },
                    { $set: { delivery: tradeLog.delivery } }
                );
            }

            return res.send({ success: "delivery trade executed." });
        } 
		else {
            // Handle intraday order
            const opLog = await op_logs.findOne({ username: req.session.userId });
            var bprice = 0;
            if (opLog) {
                if (opLog.balance < exPrice * quantity) {
                    return res.send({
                        success: "insufficient funds.",
                        available: Math.floor(opLog.balance / exPrice)
                    });
                }

                const stockLog = opLog.log.find(log => log.stockname === stockName);

                // Update user's balance
                await Users.updateOne(
                    { username: req.session.userId },
                    { $set: { balance: opLog.balance - (quantity * exPrice) } }
                );

                if (!stockLog) {
                    // Add new stock entry in operation logs
                    opLog.log.push({
                        stockname: stockName,
                        quantity: quantity,
                        ex_price: exPrice,
                        direction: req.body.direction,
                    });

                    await op_logs.updateOne(
                        { username: req.session.userId },
                        { $set: { 	balance: opLog.balance - (quantity * exPrice), 
									log : opLog.log} }
                    );
                } else {
                    // Update existing stock entry in operation logs
                    stockLog.ex_price = (stockLog.ex_price * stockLog.quantity + exPrice * quantity) / (stockLog.quantity + quantity);
					stockLog.quantity += quantity;
                    bprice = stockLog.ex_price;
                    await op_logs.updateOne(
                        { username: req.session.userId },
                        { $set: { balance: opLog.balance - (quantity * exPrice), log: opLog.log } }
                    );
                }
            } else {
                // Handle case where operation log doesn't exist
                const userData = await Users.findOne({ username: req.session.userId });
                const remainingBalance = userData.balance - (exPrice * quantity);

                if (remainingBalance < 0) {
                    return res.send({
                        success: "insufficient funds.",
                        available: Math.floor(userData.balance / exPrice)
                    });
                }

                // Create a new operation log entry
                const newEntry = new op_logs({
                    username: req.session.userId,
                    balance: remainingBalance,
                    log: [{
                        stockname: stockName,
                        quantity: quantity,
                        ex_price: exPrice,
                        direction: req.body.direction
                    }]
                });

                await newEntry.save();

                await Users.updateOne(
                    { username: req.session.userId },
                    { $set: { balance: remainingBalance } }
                );
            }

            // Update intraday trade logs
            const tdLog = await td_logs.findOne({ username: req.session.userId });

            if (tdLog) {
                const stockLog = tdLog.intraday.find(log => log.date === new Date().toLocaleDateString());

                if (!stockLog) {
                    const currentDate = new Date().toLocaleDateString();
                    tdLog.intraday.push({
                        date: currentDate,
                        logos: [{
                            stockname: stockName,
                            quantity: 0,
                            buy_price: exPrice,
                            sell_price: 0,
                            realised: 0
                        }]
                    });
                } else {
                    const stockIntradayLog = stockLog.logos.find(log => log.stockname === stockName);

                    if (!stockIntradayLog) {
                        stockLog.logos.push({
                            stockname: stockName,
                            quantity: 0,
                            buy_price: exPrice,
                            sell_price: 0,
                            realised: 0
                        });
                    }
                    else{
                        stockIntradayLog.buy_price = bprice;
                    }
                }

                await td_logs.updateOne(
                    { username: req.session.userId },
                    { $set: { intraday: tdLog.intraday } }
                );
            }

            return res.send({ success: "intraday trade executed." });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).send({ error: "An error occurred." });
    }
};
