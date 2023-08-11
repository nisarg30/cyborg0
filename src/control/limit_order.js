var express = require('express');
var router = express.Router();
const Users = require('../models/user');
const op_logs = require('../models/open_trades');
const td_logs = require('../models/trade_log');
const limit = require('../models/limit.js');
const fetch123 = require('../utls/s_price');

async function buy_handle(order){

    const exprice = order.exprice;

    const udata = await Users.findOne({username: order.username });
    if(udata){
        if(udata.balance < exprice*order.quantity)
				{
					return res.send({	"success" : "insufficient funds.", 
										"availabel" : Math.floor(udata.balance/exprice)});
				}
    }

    var order = {
        username: order.username,
        quantity: order.quantity,
        ex_price: order.exprice,
        ordertime : order.ordertime,
        direction : order.direction
    }

    await limit.findOneAndUpdate(
        { stockname: order.stockname },
        { $push: { log: order} },
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

    await op_logs.updateOne(
        { "username" : order.username },
        {
            $set : {
                balance : udata.balance - (order.quantity*exprice),
            }
        }
    );

    return ({"success":"order placed but pending"});
}

async function sell_handle(order) {

    if(order.ordertime == "delivery"){

        const udata = await Users.findOne({
            "username" : order.username,
        });

        const portfolioElement = udata.portfolio.find(item => item.stockname === order.stockname);

        if(!portfolioElement){
            return res.send({"success" : "You don't own this stock"});
        }
        
        if(portfolioElement.quantity < order.quantity){
            return res.send({"success" : "insufficient quantity", "available" : portfolioElement.quantity});
        }

        await Users.updateOne(
            { "username" : req.session.userId, "portfolio.stockname" : order.stockname},
            {
                $inc : {
                    'portfolio.$.quantity': -order.quantity
                }
            }
        );
    }
    else{

        const odata = await Users.findOne({
            "username" : order.username, 
        });

        const udata = await Users.findOne({username: order.username });

        if(!odata){
                var newentry = new op_logs({
                    username : order.username,
                    balance : udata.balance,
                    log : [{
                        stockname : req.body.stockname,
                        quantity : req.body.quantity,
                        ex_price : exprice,
                        direction : req.body.direction
                    }]
                });

                newentry.save(function(err, Person){
                    if(err)
                        console.log(err);
                    else
                        console.log('Success entry');
                });
        }

        const logElement = odata.log.find(item => item.stockname === stockName);
        if(!logElement){
            return res.send({"success" : "You don't own this stock"});
        }
        
        if(logElement.quantity < order.quantity){
            return res.send({"success" : "insufficient quantity", "available" : logElement.quantity});
        }

        await op_logs.updateOne(
            { "username" : req.session.userId, "log.stockname" : order.stockname},
            {
                $inc : {
                    'log.$.quantity': -order.quantity
                }
            }
        );
    }

    var order = {
        username: order.username,
        quantity: order.quantity,
        ex_price: order.exprice,
        ordertime : order.ordertime,
        direction : order.direction
    }

    await limit.findOneAndUpdate(
        { stockname: order.stockname },
        { $push: { log: order} },
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