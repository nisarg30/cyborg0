var Users = require('../models/user');
var op_logs = require('../models/open_trades');
var td_logs = require('../models/trade_log');
const path = require('path');
const fs = require('fs');

module.exports = async function sell_limit_postexecution(order){

    console.log("sell_limit_postexecution");
    console.log(order);
    if(order.ordertime == "delivery"){

        const user = await Users.findOne({username : order.username});
            
        if (user.portfolio.some(item => item.stockname === order.stockname && item.quantity <= 0)) {
            await Users.findOneAndUpdate(
                { username: order.username },
                { $pull: { portfolio: { stockname: order.stockname, quantity: { $lte: 0 } } } }
            );
        }

        const ot = order.exprice*order.quantity;
        console.log(ot);
        await Users.findOneAndUpdate(
            { username : order.username },
            { $inc: { balance: ot } },
            { new : true}
        );

        await op_logs.findOneAndUpdate(
            { username : order.username },
            { $inc: { balance: ot } },
            { new : true}
        );

        const tdpush = {
            date : new Date().toLocaleDateString(),
            ex_price : order.exprice,
            quantity : order.quantity,
            direction : "SELL"
        };

        const updatedTradeLog = await td_logs.findOneAndUpdate(
            { username : order.username, 'delivery.stockname': order.stockname },
            { $push: { 'delivery.$.dlog': tdpush } },
        );
    }
    else{

        const user = await op_logs.findOne({username: order.username});
            
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