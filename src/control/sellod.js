const Users = require('../models/user');
const op_logs = require('../models/open_trades');
const td_logs = require('../models/trade_log');
const fetchStockPrice = require('../utls/s_price');

module.exports = async (req, res) => {
    if (!req.session.userId) {
        return res.send({ Success: "login required." });
    }

    const stockName = req.body.stockname;
    const orderTime = req.body.ordertime;
    const quantity = req.body.quantity;

    try {
        // Fetch the current stock price
        const exPrice = parseFloat(await fetchStockPrice(stockName));

        if (orderTime === "delivery") {
            // Handle delivery sell order
            const user = await Users.findOne({ username: req.session.userId });

            const stock = user.portfolio.find(item => item.stockname === stockName);

            if (!stock) {
                return res.send({ success: "you don't own this stock" });
            }

            if (quantity > stock.quantity) {
                return res.send({ success: "insufficient quantity.", available: stock.quantity });
            }

            stock.quantity -= quantity;

            if (stock.quantity === 0) {
                user.portfolio = user.portfolio.filter(item => item.stockname !== stockName);
            }

            const newBalance = user.balance + quantity * exPrice;

            await Users.updateOne(
                { username: req.session.userId },
                { $set: { balance: newBalance, portfolio: user.portfolio } }
            );

            await op_logs.updateOne(
                { username: req.session.userId },
                { $set: { balance: newBalance } }
            );

            const tradeLog = await td_logs.findOne({ username: req.session.userId });
            if (tradeLog) {
                const stockLog = tradeLog.delivery.find(log => log.stockname === stockName);

                if (stockLog) {
					stockLog.realised += ( exPrice - stock.buy_price) * quantity;
                    stockLog.dlog.push({
                        date: new Date().toLocaleDateString(),
                        ex_price: exPrice,
                        direction: "SELL",
                        quantity: quantity
                    });
                }

                await td_logs.updateOne(
                    { username: req.session.userId },
                    { $set: { delivery: tradeLog.delivery } }
                );
            }

            return res.send("sell delivery executed!");
        } else {
            // Handle intraday sell order
            const opLog = await op_logs.findOne({ username: req.session.userId });

            if (!opLog) {
                return res.send("you don't own this stock");
            }

            const stock = opLog.log.find(item => item.stockname === stockName);

            if (!stock) {
                return res.send({ success: "you don't own this stock" });
            }

            if (quantity > stock.quantity) {
                return res.send({ success: "insufficient quantity.", available: stock.quantity });
            }

            stock.quantity -= quantity;

            if (stock.quantity === 0) {
                opLog.log = opLog.log.filter(item => item.stockname !== stockName);
            }

            const newBalance = opLog.balance + quantity * exPrice;

            await Users.updateOne(
                { username: req.session.userId },
                { $set: { balance: newBalance } }
            );

            await op_logs.updateOne(
                { username: req.session.userId },
                { $set: { balance: newBalance, log: opLog.log } }
            );

            const tdLog = await td_logs.findOne({ username: req.session.userId });
            if (tdLog) {
                const stockLog = tdLog.intraday.find(log => log.date === new Date().toLocaleDateString());

                if (stockLog) {
                    const stockIntradayLog = stockLog.logos.find(item => item.stockname === stockName);

                    if (stockIntradayLog) {
                        stockIntradayLog.sell_price = ((stockIntradayLog.sell_price * stockIntradayLog.quantity) + (exPrice * quantity)) / (stockIntradayLog.quantity + quantity);
                        stockIntradayLog.quantity += quantity;
                        stockIntradayLog.realised = (stockIntradayLog.sell_price - stockIntradayLog.buy_price) * stockIntradayLog.quantity;
                    }
                }

                await td_logs.updateOne(
                    { username: req.session.userId },
                    { $set: { intraday: tdLog.intraday } }
                );
            }

            return res.send("sell intraday executed!");
        }
    } catch (error) {
        console.error(error);
        return res.status(500).send({ error: "An error occurred." });
    }
};

