const Users = require('../models/user');
const op_logs = require('../models/open_trades');
const td_logs = require('../models/trade_log');
const limit = require('../models/limit.js');
const moment = require('moment-timezone');

async function buy_handle(order){

    console.log(order, "pre process buy");
    const exprice = order.exprice;
    const udata = await Users.findOne({username: order.username });
    if(udata){
        if(udata.balance < exprice*order.quantity)
				{
					return ({	case : 1001, 
										"availabel" : Math.floor(udata.balance/exprice)});
				}
    }

    await Users.updateOne(
        { "username" : order.username },
        {
            $set : {
                balance : udata.balance - (order.quantity*exprice),
            },
            $inc : {
                limitcount : 1
            }
        }
    );

    if(order.ordertime === 0){
        console.log('delivery order handle buy');
        const pipeline = [
            { $match: { username : order.username } },
            { $unwind: '$portfolio' },
            { $match: { 'portfolio.stockname':  order.stockname} },
            { $replaceRoot: { newRoot: '$portfolio' } }
        ];
        
        const portfolioElement = await Users.aggregate(pipeline);
        if(portfolioElement.length <= 0) {
            const newPortfolioElement = {
                stockname : order.stockname,
                quantity : 0,
                buy_price : 0
            }
            const filter = { username : order.username };
            const update = { $push: { portfolio: newPortfolioElement } };
            const result = await Users.updateOne(filter, update);
        }
    
        const tradeDeliveryele = await td_logs.aggregate([
            {
                $match: {
                    "username": order.username,
                    "delivery": {
                        $elemMatch: {
                            "stockname": order.stockname,
                        }
                    }
                }
                },
                { $unwind: "$delivery" },
                { $match: {
                    "delivery.stockname": order.stockname
                }},
                { $replaceRoot: {
                    newRoot: "$delivery"
                }}
            ]);
            
            if(tradeDeliveryele.length <= 0) {
                const newDeliveryItem = {
                    stockname: order.stockname,
                    realised: 0,
                    dlog: []
                };
                
                await td_logs.updateOne(
                    { username: order.username },
                    { $push: { delivery: newDeliveryItem } }
                )
            }
    }
    else {
        //new op_logs entry
        console.log("intraday order handle");
        const odata = await op_logs.findOne({username : order.username});
        if(!odata) {
            const newLogEntry = new op_logs({
                username: order.username,
                balance: udata.balance,
                log: []
            });
            await newLogEntry.save();
        }

        //op_logs presetting
        const logpipeline = [
            { $match: { username : order.username } },
            { $unwind: '$log' },
            { $match: { 'log.stockname':  order.stockname} },
            { $replaceRoot: { newRoot: '$log' } }
        ];
        
        const logElement = await op_logs.aggregate(logpipeline);
        // console.log(logElement);
        if(logElement.length <= 0) {
            const newlogElement = {
                stockname : order.stockname,
                quantity : 0,
                ex_price : 0
            }
            const filter = { username : order.username };
            const update = { $push: { log: newlogElement } };
            const result = await op_logs.updateOne(filter, update);
            // console.log(result);
        }

        // intraday presetting
        const intradayQuery = {
            "username": order.username,
            'intraday.date': new Date().toLocaleDateString()
        };
        const intradayData = await td_logs.findOne(intradayQuery).select('intraday.$');
    
        if (!intradayData) {
            // Create new intraday log entry
            const newIntradayObject = {
                date: new Date().toLocaleDateString(),
                logos: [{
                    stockname: order.stockname,
                    quantity: 0,
                    buy_price: 0,
                    sell_price: 0,
                    realised: 0
                }]
            }
            await td_logs.updateOne(
                { username: order.username },
                { $push: { intraday: newIntradayObject } }
            );
        } else {
            const intradayArray = intradayData.intraday[0].logos;
            // Check if the stock is already in the intraday log
            const existingIntradayTradeIndex = intradayArray.findIndex(item => item.stockname === order.stockname);
            if (existingIntradayTradeIndex === -1) {
                // Update existing intraday trade
                const entry = {
                    stockname: order.stockname,
                    quantity: 0,
                    buy_price: 0,
                    sell_price: 0,
                    realised: 0
                }

                await td_logs.findOneAndUpdate(
                    intradayQuery,
                    {
                        $push: { 'intraday.$.logos': entry }
                    },
                );
            }
            // Update and save the intraday log
        }    
    }

    await op_logs.updateOne(
        { "username" : order.username },
        {
            $set : {
                balance : udata.balance - (order.quantity*exprice),
            }
        }
    );
    
    const logTime = moment.tz(this.ordertime, 'Asia/Kolkata');
    const timeString = logTime.format('HH:mm:ss');
    var entry = {
        time : timeString,
        username: order.username,
        quantity: order.quantity,
        exprice: order.exprice,
        ordertime : order.ordertime,
        direction : order.direction
    }

    var uentry = {
        time : timeString,
        stockname : order.stockname,
        quantity: order.quantity,
        ex_price: order.exprice,
        ordertime : order.ordertime,
        direction : order.direction
    }

    limit.findOneAndUpdate(
        { stockname: order.stockname },
        { $push: { log: entry } },
        (err) => {
            if (err) {
                console.error('Error updating log:', err);
            } else {
                // Log successful update if needed
            }
        }
    );

    td_logs.findOneAndUpdate(
        { username: order.username },
        { $push: { limit: uentry } },
        (err, result) => {
            if (err) {
                console.log(err);
                return;
            }
        }
    );

    return ({ case : 1002 , entry : uentry });
}

async function sell_handle(order) {

    console.log(order), "pre process sell";
    if(order.ordertime == 0){

        console.log('delivery orde rhandle sell');
        const udata = await Users.findOne({
            "username" : order.username,
        });
        // console.log(udata);
        const portfolioElement = udata.portfolio.find(item => item.stockname === order.stockname);

        if(!portfolioElement){
            return ({ case : 1003 });
        }
        
        if(portfolioElement.quantity < order.quantity){
            return ({case : 1004, "available" : portfolioElement.quantity});
        }

        await Users.updateOne(
            { "username" : order.username, "portfolio.stockname" : order.stockname},
            {
                $inc : {
                    'portfolio.$.quantity': -order.quantity,
                    'limitcount' : 1
                }
            }
        );
    }
    else{
        console.log('intraday order handle sell')

        await Users.updateOne(
            { "username" : order.username},
            {
                $inc : {
                    'limitcount' : 1
                }
            }
        );

        const odata = await op_logs.findOne({
            "username" : order.username, 
        });

        const udata = await Users.findOne({username: order.username });
        if(!odata){
            return { case : 1003 };
        }

        const logElement = odata.log.find(item => item.stockname === order.stockname);
        if(!logElement){
            return { case : 1003 };
        }
        
        if(logElement.quantity < order.quantity){
            return ({ case : 1004, "available" : logElement.quantity});
        }

        await op_logs.updateOne(
            { "username" : order.username, "log.stockname" : order.stockname},
            {
                $inc : {
                    'log.$.quantity': -order.quantity
                }
            }
        );
    }

    const logTime = moment.tz(this.ordertime, 'Asia/Kolkata');
    const timeString = logTime.format('HH:mm:ss');
    var entry = {
        time : timeString,
        username: order.username,
        quantity: order.quantity,
        exprice: order.exprice,
        ordertime : order.ordertime,
        direction : order.direction
    }

    var uentry = {
        time : timeString,
        stockname : order.stockname,
        quantity: order.quantity,
        ex_price: order.exprice,
        ordertime : order.ordertime,
        direction : order.direction
    }


    limit.findOneAndUpdate(
        { stockname: order.stockname },
        { $push: { log: entry } },
        (err) => {
            if (err) {
                console.error('Error updating log:', err);
            } else {
                // Log successful update if needed
        }
        }
    );

    td_logs.findOneAndUpdate(
        { username: order.username },
        { $push: { limit: uentry } },
        (err, result) => {
            if (err) {
                console.log(err);
                return;
            }
        }
    );
    return ({ case : 1002 , entry : uentry });
}

module.exports = {
    buy_handle,
    sell_handle
}