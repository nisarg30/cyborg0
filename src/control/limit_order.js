var express = require('express');
var router = express.Router();
const Users = require('../models/user');
const op_logs = require('../models/open_trades');
const td_logs = require('../models/trade_log');
const limit = require('../models/limit.js');
const fetch123 = require('../utls/s_price');

async function buy_handle(order){

    const exprice = order.ex_price;
    const udata = await Users.findOne({username: order.username });
    if(udata){
        if(udata.balance < exprice*order.quantity)
				{
					return ({	"success" : "insufficient funds.", 
										"availabel" : Math.floor(udata.balance/exprice)});
				}
    }

    var entry = {
        username: order.username,
        quantity: order.quantity,
        ex_price: order.ex_price,
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

    await Users.updateOne(
        { "username" : order.username },
        {
            $set : {
                balance : udata.balance - (order.quantity*exprice),
            }
        }
    );
    
    if(order.ordertime == 'intraday'){
        const odata = await op_logs.findOne({username : order.username});
        if(!odata) {
            const newLogEntry = new op_logs({
                username: order.username,
                balance: udata.balance,
                log: []
            });
            const savedLogEntry = await newLogEntry.save();
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

    return ({"success":"buy order placed but pending"});
}

async function sell_handle(order) {

    if(order.ordertime == "delivery"){

        const udata = await Users.findOne({
            "username" : order.username,
        });
        // console.log(udata);
        const portfolioElement = udata.portfolio.find(item => item.stockname === order.stockname);
        console.log(portfolioElement);
        if(!portfolioElement){
            return ({"success" : "You don't own this stock"});
        }
        
        if(portfolioElement.quantity < order.quantity){
            return ({"success" : "insufficient quantity", "available" : portfolioElement.quantity});
        }

        await Users.updateOne(
            { "username" : order.username, "portfolio.stockname" : order.stockname},
            {
                $inc : {
                    'portfolio.$.quantity': -order.quantity
                }
            }
        );
    }
    else{

        const odata = await op_logs.findOne({
            "username" : order.username, 
        });

        const udata = await Users.findOne({username: order.username });

        if(!odata){
                var newentry = new op_logs({
                    username : order.username,
                    balance : udata.balance,
                    log : [{
                        stockname : order.stockname,
                        quantity : order.quantity,
                        ex_price : exprice,
                        direction : order.direction
                    }]
                });

                newentry.save(function(err, Person){
                    if(err)
                        console.log(err);
                    else
                        console.log('Success entry');
                });
        }

        const logElement = odata.log.find(item => item.stockname === order.stockname);
        if(!logElement){
            return send({"success" : "You don't own this stock"});
        }
        
        if(logElement.quantity < order.quantity){
            return send({"success" : "insufficient quantity", "available" : logElement.quantity});
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

    var entry = {
        username: order.username,
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
    return ({"success" : "order placed but pending"});
}

module.exports = {
    buy_handle,
    sell_handle
}