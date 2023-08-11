var express = require('express');
var router = express.Router();
var Users = require('../models/user');
var op_logs = require('../models/open_trades');
var td_logs = require('../models/trade_log');
const fetch123 = require('../utls/s_price');

module.exports = async (req, res) => {
    if(!req.session.userId)
	{
		console.log(req.session.userId);
		res.send({Success : "login required."});
		return;
	}

	
	var exprice = await fetch123(req.body.stockname);
	exprice = parseFloat(exprice);
		if(req.body.ordertime == "delivery")
		{
			Users.findOne({username:req.session.userId},async function(err,data){

				var flag = 1,  flag2 = 1;
				var srr = data.portfolio;
				var index = 0;
				for(i in srr)
				{
					if(srr[i].stockname == req.body.stockname)
					{
						// flag = 0;
						if(req.body.quantity > srr[i].quantity)
						{
							flag = 0;
							return res.send({"success" : "insufficient quantity.", availabel : srr[i].quantity});
						}          

						srr[i].quantity = srr[i].quantity - req.body.quantity;
						if(srr[i].quantity == 0)
						{
							index = i;
							flag2 = 0;
						}	
						flag = 0;
						break;
					}
				}

				if(flag2==0)
					srr.splice(index, 1);

				if(flag)
				{
					return res.send({"success" : "you dont own this stock."});
				}
				console.log(data.balance + (req.body.quantity*exprice));
				await Users.updateOne(
					{ "username" : req.session.userId},
					{
						$set : {
							balance : data.balance + (req.body.quantity*exprice),
							portfolio : srr
						}
					}
				);

				await op_logs.updateOne(
					{ "username" : req.session.userId},
					{
						$set : {
							balance : data.balance + (req.body.quantity*exprice),
						}
					}
				);

				td_logs.findOne({username:req.session.userId},async function(err,data){

					var array = data.delivery;

					for(i in array)
					{
						if(array[i].stockname == req.body.stockname)
						{
							var tuy = {
                                date : new Date().toLocaleDateString(),
                                exprice: exprice,
                                direction : "SELL",
                                quantity : req.body.quantity
                            }
                            array[i].dlog.push(tuy);
							break;
						}
					}

					await td_logs.updateOne(
						{ "username" : req.session.userId},
						{
							$set : {
								delivery : array
							}
						}
					);
				});
				return res.send("sell delivery exec!");
			});

			
		}
		else
		{
			op_logs.findOne({username:req.session.userId},async function(err,data){

				if(data == null)
				{
					return res.send("you don't own this stock");
				}
				var str = data.log;
				var sex = 1,sex2 = 1;
				var ind = 0;
				for(i in str)
				{
					// console.log(str[i]);
					if(str[i].stockname == req.body.stockname)
					{
						if(req.body.quantity > str[i].quantity)
						{
							sex = 0;
							return res.send({"success" : "insufficient quantity.", availabel : str[i].quantity});
						}
						sex = 0;
						str[i].quantity = (str[i].quantity - req.body.quantity);

						if(str[i].quantity == 0)
						{
							ind = i;
							sex2 = 0;
						}
					}
				}

				if(sex == 1)
				{
					return res.send({"success" : "you dont own this stock."});
				}

				if(sex2==0)
					str.splice(ind, 1);
				
				await Users.updateOne(
					{ "username" : req.session.userId},
					{
						$set : {
							balance : data.balance + (req.body.quantity*exprice),
						}
					}
				);
	
				await op_logs.updateOne(
					{ "username" : req.session.userId},
					{
						$set : {
							balance : data.balance + (req.body.quantity*exprice),
							log : str
						}
					}
				);

				td_logs.findOne({username:req.session.userId},async function(err,data){

					var array = data.intraday;
					for(i in array)
					{
						if(array[i].date == new Date().toLocaleDateString() ){
                            
                            for(j in array[i].logos)
						    {
							    if(array[i].logos[j].stockname == req.body.stockname)
							    {
                                    array[i].logos[j].quantity = (array[i].logos[j].quantity + req.body.quantity);
									array[i].logos[j].sell_price = ((array[i].logos[j].sell_price*array[i].logos[j].quantity)+(exprice*req.body.quantity))/(array[i].logos[j].quantity); 
								    array[i].logos[j].realised  = (array[i].logos[j].sell_price - array[i].logos[j].buy_price) * array[i].logos[j].quantity;
							    }
						    }
                        }
					}

					await td_logs.updateOne(
						{ "username" : req.session.userId},
						{
							$set : {
								intraday : array
							}
						}
					);
				});
				return res.send("sell intraday exec!");
			});
		}
	
};


