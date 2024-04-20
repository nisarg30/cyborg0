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

// 1000 = login required
// 1001 = insufficient funds
// 1002 = order executed 
// 1005 = error

module.exports = async function (req, res) {

    const stockName = req.body.stockname;
    const orderTime = req.body.ordertime;
    const quantity = req.body.quantity;

    // Fetch the current stock price
    const exPrice = parseFloat(await fetchStockPrice(stockName));
    console.log(exPrice);
    try {
        // Find the user's data
        const user = await Users.findOne({ username: req.session.userId });

        if (orderTime === 0) {
            // Handle delivery order
            if (user.balance < exPrice * quantity) {
                return res.status(200).send({
                    case: 1001,
                    available: Math.floor(user.balance / exPrice)
                });
            }

            const portfolio = user.portfolio;
            const existingStock = portfolio.find(stock => stock.stockname === stockName);

            // Update user's balance and portfolio
            const amttoinc = roundToTwo(quantity*exPrice);
            console.log(amttoinc, req.session.userId);

            op_logs.updateOne(
                { username: req.session.userId },
                { $inc: { balance: -amttoinc } },
                (err) => {
                    if (err) {
                        console.error(err);
                        return res.status(500).send({ error: 1005 });
                    }
                }
            );

            if (!existingStock) {
                // Add new stock to user's portfolio
                const element = {
                    stockname: stockName,
                    buy_price: exPrice,
                    quantity: quantity
                };

                const x = Users.updateOne(
                    { username: req.session.userId },
                    {
                        $push: { portfolio: element },
                        $inc: { balance: -amttoinc }
                    },
                    (err) => {
                        if (err) {
                            console.error(err);
                            return res.status(500).send({ error: 1005 });
                        }
                    }
                );
                
            } else {
                // Update existing stock's details in the portfolio
                existingStock.buy_price = (existingStock.buy_price * existingStock.quantity + exPrice * quantity) / (existingStock.quantity + quantity);
				existingStock.quantity += quantity;

                Users.updateOne(
                    { username: req.session.userId },
                    { $set: { balance: user.balance - (quantity * exPrice), portfolio: portfolio } },
                    (err) => {
                        if (err) {
                            console.error(err);
                            return res.status(500).send({ error: 1005 });
                        }
                    }
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
                            direction: 1,
                            quantity: quantity
                        }]
                    });
                } else {
                    // Update existing stock entry in trade logs
                    stockLog.dlog.push({
                        date: new Date().toLocaleDateString(),
                        ex_price: exPrice,
                        direction: 1,
                        quantity: quantity
                    });
                }

                td_logs.updateOne(
                    { username: req.session.userId },
                    { $set: { delivery: tradeLog.delivery } },
                    (err) => {
                        if (err) {
                            console.error(err);
                            return res.status(500).send({ error: 1005 });
                        }
                    }
                );
            }

            return res.status(200).send({ case: 1002, price : exPrice });
        } 
		else {
            // Handle intraday order
            const opLog = await op_logs.findOne({ username: req.session.userId });
            var bprice = 0;
            if (opLog) {
                if (opLog.balance < exPrice * quantity) {
                    return res.send({
                        case: 1001,
                        available: Math.floor(opLog.balance / exPrice)
                    });
                }

                const stockLog = opLog.log.find(log => log.stockname === stockName);

                // Update user's balance
                Users.updateOne(
                    { username: req.session.userId },
                    { $set: { balance: opLog.balance - (quantity * exPrice) } },
                    (err) => {
                        if (err) {
                            console.error(err);
                            return res.status(500).send({ error: 1005 });
                        }
                    }
                );

                if (!stockLog) {
                    // Add new stock entry in operation logs
                    opLog.log.push({
                        stockname: stockName,
                        quantity: quantity,
                        ex_price: exPrice,
                        direction: req.body.direction,
                    });

                    op_logs.updateOne(
                        { username: req.session.userId },
                        { $set: { 	balance: opLog.balance - (quantity * exPrice), 
									log : opLog.log
                                } },
                                (err) => {
                                    if (err) {
                                        console.error(err);
                                        return res.status(500).send({ error: 1005 });
                                    }
                                }
                    );
                } else {
                    // Update existing stock entry in operation logs
                    stockLog.ex_price = (stockLog.ex_price * stockLog.quantity + exPrice * quantity) / (stockLog.quantity + quantity);
					stockLog.quantity += quantity;
                    bprice = stockLog.ex_price;
                    op_logs.updateOne(
                        { username: req.session.userId },
                        { $set: { balance: opLog.balance - (quantity * exPrice), log: opLog.log } },
                        (err) => {
                            if (err) {
                                console.error(err);
                                return res.status(500).send({ error: 1005 });
                            }
                        }
                    );
                }
            } else {
                // Handle case where operation log doesn't exist
                const userData = await Users.findOne({ username: req.session.userId });
                const remainingBalance = userData.balance - (exPrice * quantity);

                if (remainingBalance < 0) {
                    return res.send({
                        case: 1001,
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

                newEntry.save();

                Users.updateOne(
                    { username: req.session.userId },
                    { $set: { balance: remainingBalance } },
                    (err) => {
                        if (err) {
                            console.error(err);
                            return res.status(500).send({ error: 1005 });
                        }
                    }
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

                td_logs.updateOne(
                    { username: req.session.userId },
                    { $set: { intraday: tdLog.intraday } },
                    (err) => {
                        if (err) {
                            console.error(err);
                            return res.status(500).send({ error: 1005 });
                        }
                    }
                );
            }
            
            return res.send({ case : 1002, price : exPrice });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).send({ error: 1005 });
    }
};
