var Users = require('../models/user');
var op_logs = require('../models/open_trades');
var td_logs = require('../models/trade_log');
const fetch123 = require('../utls/s_price');

module.exports = async function buy_limit_postexecution(order){

    if(order.ordertime == "delivery"){
        
        const udata = await Users.findOne({username : order.username});
        var array = udata.portfolio;
        var flag = 1;

        for (i in array)  {
            if(array[i].stockname == order.stockname)
            {
                flag = 0;
                array[i].ex_price = ((array[i].ex_price*array[i].quantity) + (order.quantity, order.exprice)) / (order.quantity+ array[i].quantity);
            }
        }

        if(flag){
            const op = {
                stockname : order.stockname,
                ex_price : order.exprice,
                quantity : order.quantity
            }
            array.push(op);
        }

        await Users.updateOne(
            {"username" : order.username},
            {
                $set : {
                    portfolio : array
                }
            }
        );

        const entry = {
            date : new Date().toLocaleString(),
            ex_price : order.ex_price,
            quantity : order.quantity,
            direction : "BUY"
        }

        await td_logs.findOneAndUpdate(
            {
                username: order.username,
                'delivery.stockname': order.stockname
            },
            { $push: { 'delivery.$.dlog': entry } }, // This option returns the updated document
            async (err, updatedTradeLog) => {
                if (err) {
                    console.error('Error:', err);
                } else if (!updatedTradeLog) {

                    const newDeliveryEntry = {
                        stockname : order.stockname,
                        dlog : [entry]
                    }
                    await td_logs.findOneAndUpdate(
                        {
                            username: order.username
                        },
                        { $push: { delivery: newDeliveryEntry } },
                        { new: true },
                        (err, updatedTradeLog) => {
                            if (err) {
                                console.error('Error:', err);
                            } else if (!updatedTradeLog) {
                                console.log('Document not found.');
                            } else {
                                console.log('Updated TradeLog:', updatedTradeLog);
                            }
                        }
                    );
                } else {
                    console.log('Updated TradeLog:', updatedTradeLog);
                }
            }
        );
    }
    else{

        const odata = await op_logs.findOne({"username" : order.username});
        if(!odata){
            const udata = await Users.findOne({"username" : order.username});
            const newLogEntry = new OpenLog({
                username: order.username,
                balance: udata.balance,
                log: [
                    {
                        stockname: order.stockname,
                        quantity: order.quantity,
                        ex_price: order.exprice,
                        direction: 'BUY'
                    }
                ]
                });
                const savedLogEntry = await newLogEntry.save();
        }

        var flag = 1;
        for(i in odata.log){
            if(odata.log[i].stockname == order.stockname){
                flag = 0;
                odata.log[i].ex_price = (odata.log[i].ex_price * odata.log[i].quantity) + (order.exprice*order.quantity) / (odata.log[i].quantity + order.quantity);
                odata.log[i].quantity = odata.log[i].quantity + order.quantity;
            }
        }

        if(flag){
            const entry = {
                stockname : order.stockname,
                ex_price : order.exprice,
                quantity : order.quantity,
                direction : "BUY"
            }
            odata.log.push(entry);
        }

        await op_logs.updateOne(
            {"username" : order.username},
            {
                $set : {
                    log : odata.log
                }
            }
        )

        var tdata = await td_logs.findOne({
            "username" : "pn",
            'intraday.date': "8/6/2023"
        }).select('intraday.$');

        var array = tdata.intraday[0].logos;
        var tf = 1;
        for(i in array){
            if(array[i].stockname == order.stockname){
                tf = 0;
                array[i].buy_price = ((array[i].buy_price*array[i].quantity) + (order.quantity*order.exprice))/(order.quantity + array[i].quantity);
            }
        }

        if(tf){
            const rtg = {
                stockname : order.stockname,
                quantity : order.quantity,
                buy_price : order.exprice,
                sell_price : 0,
                realised : 0
            }
            array.push(rtg);
        }

        var upd = { 'intraday.$.logos': array }
        await td_log.findOneAndUpdate(
            {
                "username" : "pn",
                'intraday.date': "8/6/2023"
            },
            { $set: upd }
        );
    }

    return ({"success" : "success buy post execution"});
}