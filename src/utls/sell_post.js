var Users = require('../models/user');
var op_logs = require('../models/open_trades');
var td_logs = require('../models/trade_log');

module.exports = async function sell_limit_postexecution(order){
    if(order.ordertime == "delivery"){
        const user = await Users.findOneAndUpdate(
            { username : order.username, 'portfolio.stockname': order.stockname },
            {
                $inc: { 'portfolio.$.quantity': -order.quantity }
            },
        );
            
        if (user.portfolio.some(item => item.stockname === order.stockname && item.quantity <= 0)) {
            await Users.findOneAndUpdate(
                { username: order.username },
                { $pull: { portfolio: { stockname: order.stockname, quantity: { $lte: 0 } } } }
            );
        }

        await Users.findOneAndUpdate(
            { username : order.username },
            { $inc: { balance: order.exprice*order.quantity } },
        );

        await op_logs.findOneAndUpdate(
            { username : order.username },
            { $inc: { balance: order.exprice*order.quantity } },
        );

        const tdpush = {
            date : new Date().toLocaleDateString(),
            ex_price : order.exprice,
            quantity : order.quantity,
            direction : "SELL"
        };

        const updatedTradeLog = await TradeLog.findOneAndUpdate(
            { username : order.username, 'delivery.stockname': order.stockname },
            { $push: { 'delivery.$.dlog': tdpush } },
        );
    }
    else{

        const user = await op_logs.findOneAndUpdate(
            { username : order.username, 'log.stockname': order.stockname },
            {
                $inc: { 'log.$.quantity': -order.quantity }
            },
        );
            
        if (user.log.some(item => item.stockname === order.stockname && item.quantity <= 0)) {
            await op_logs.findOneAndUpdate(
                { username: order.username },
                { $pull: { log : { stockname: order.stockname, quantity: { $lte: 0 } } } }
            );
        }

        await Users.findOneAndUpdate(
            { username : order.username },
            { $inc: { balance: order.exprice*order.quantity } },
        );

        await op_logs.findOneAndUpdate(
            { username : order.username },
            { $inc: { balance: order.exprice*order.quantity } },
        );
        
        const today = new Date().toLocaleDateString();
        const trade = await td_logs.findOne({ "username" : order.username });
        const intradayEntry = trade.intraday.find(entry => entry.date === today);
        var logosEntry = intradayEntry.logos.find(logo => logo.stockname === stockname);

        logosEntry.quantity = (logosEntry.quantity + order.quantity);
		logosEntry.sell_price = ((logosEntry.sell_price*logosEntry.quantity)+(order.exprice*order.quantity))/(logosEntry.quantity); 
		logosEntry.realised  = (logosEntry.sell_price - logosEntry.buy_price) * logosEntry.quantity;

        const result = await TradeLog.updateOne(
            { "username" : order.username, 'intraday.date': today, 'intraday.logos.stockname': order.stockname },
            {
                $set: {
                    'intraday.$[i].logos.$[j]': logosEntry
                },
            },
            {
                arrayFilters: [
                    { 'i.date': today },
                    { 'j.stockname': order.stockname },
                ],
            }
        );
    }

    return ({"success" : "sell post limit exec"});
}