//buyorder routes
var express = require('express');
var router = express.Router();
var Users = require('../models/user');
var op_logs = require('../models/open_trades');
var td_logs = require('../models/trade_log');
var request = require('request-promise');
const { parse } = require('path');
const { renderFile } = require('ejs');
const fetch123 = require('../utls/s_price');

module.exports = async function (req, res){

    //fetch stock price
    console.log(req.session.userId);
	if(!req.session.userId)
	{
		console.log(req.session.userId);
		return res.send({Success : "login required."});
	}

	// var url = 'http://localhost:4001/';
	// // console.log(req.body);
	// if(req.body.ordertype  ==  "limit")
	// 	url += 'limitorder';
	// else
	// 	url += 'marketorder';

	// var info ={
	// 	method : 'POST',
	// 	uri    :  url,
	// 	body   :  {'stockname': req.body.stockname},
	// 	json   :  true
	// };

        //async execution then
	var exprice = await fetch123(req.body.stockname);
	exprice = parseFloat(exprice);
		// console.log(parsedBody);
        //if-else to diffrentiate deliver and intraday trades
		if(req.body.ordertime == "delivery")
		{
            //find user in users database
			Users.findOne({username:req.session.userId},async function(err,data){

                //account balance check
				if(data.balance < exprice*req.body.quantity)
				{
					return res.send({	"success" : "insufficient funds.", 
										"availabel" : Math.floor(data.balance/exprice)});
				}

                //portfolio fetch manage update
				var xarr = data.portfolio;
				var flag = 1;
				for (i in xarr)
				{
					if(xarr[i].stockname == req.body.stockname)
					{
						flag = 0;
						xarr[i].buyprice = (xarr[i].buyprice*xarr[i].quantity)+(exprice*req.body.quantity)/(req.body.quantity+xarr[i].quantity);
						xarr[i].quantity = xarr[i].quantity + req.body.quantity;
					}
				}

                //update balance in oplogs
				await op_logs.updateOne(
					{"username" : req.session.userId},
					{
						$set : {
							balance : data.balance - (req.body.quantity*exprice)
						}
					}
				)

				if(flag)
				{
					await Users.updateOne(
						{ "username" : req.session.userId},
						{
							$push : {
								portfolio : {
									stockname : req.body.stockname,
									buy_price : exprice,
									quantity : req.body.quantity
								}
							},
							$set : {
								balance : data.balance - (req.body.quantity*exprice)
							}
						}
					);
				}
				else
				{
					await Users.updateOne(
						{"username" : req.session.userId},
						{
							$set : {
								balance : data.balance - (req.body.quantity*exprice),
								portfolio : xarr
							}
						}
					)
				}

                //update in td logs
				td_logs.findOne({username:req.session.userId},async function(err,data){

					var flag = 0;
					if(data)
					{
						console.log("ddd");
						var xary = data.delivery;
						for(i in xary)
						{
							if(xary[i].stockname == req.body.stockname)
							{
								flag = 1;
								var tuy = {
									date : new Date().toLocaleDateString(),
									ex_price: exprice,
									direction : "BUY",
									quantity : req.body.quantity
								}
								xary[i].dlog.push(tuy);
							}
						}
	
						if(!flag)
						{
							console.log("yyy");
							var stt = {
								stockname : req.body.stockname,
								dlog : [{
									date : new Date().toLocaleDateString(),
									ex_price : exprice,
									direction : "BUY",
									quantity : req.body.quantity
								}]
							}
							xary.push(stt);
						}
	
						await td_logs.updateOne(
							{username : req.session.userId}, 
							{
								$set : {
									delivery : xary
								}
							}
						);
					}
					else{
						console.log("else");
					}
				});
				return res.send({"success" : "delivery trade executed."});
			});
		}

        //intraday update
		else
		{
            // go to oplogs no change in users
			op_logs.findOne({username:req.session.userId},async function(err,data){
				//check if entry availabel or not
				if(data)
				{
                    //balance check
					if(data.balance < exprice*req.body.quantity){
						return res.send({	"success" : "insufficient funds.", 
											"availabel" : Math.floor(data.balance/exprice)});
					}
					
                    //update
					var xar = data.log;
					var fla = 1;
					for (i in xar)
					{
						if(xar[i].stockname == req.body.stockname)
						{
							fla = 0;
							xar[i].buyprice = (xar[i].ex_price*xar[i].quantity)+(exprice*req.body.quantity)/(req.body.quantity+xar[i].quantity);
							xar[i].quantity = xar[i].quantity + req.body.quantity;
						}
					}

                    //balance update in users
					await Users.updateOne(
						{"username" : req.session.userId},
						{
							$set :{
								balance : data.balance - (req.body.quantity*exprice)
							}
						}
					);
	
					if(fla)
					{
						await op_logs.updateOne(
							{"username" : req.session.userId },
							{
								$push : {
									log : { 
										stockname : req.body.stockname,
										quantity : req.body.quantity,
										ex_price : exprice,
										direction : req.body.direction,
									}
								},
								$set :{
									balance : data.balance - (req.body.quantity*exprice)
								}
							}
						);
					}
					else
					{
						await op_logs.updateOne(
							{"username" : req.session.userId},
							{
								$set :{
									balance : data.balance - (req.body.quantity*exprice),
									log : xar
								}
							} 
						);
					}
				}
                
                //new entry if data not added in oplogs
				else
				{
					console.log(req.session.userId);
					var rex;
					Users.findOne({username:req.session.userId},async function(err,data)
					{
						rex = data.balance - (exprice*req.body.quantity);
						if(rex < 0)
						{
							res.send({	"success" : "insufficient funds.", 
										"availabel" : Math.floor(data.balance/exprice)});
							return;
						}
						console.log(rex);

						var newentry = new op_logs({
							username : req.session.userId,
							balance : rex,
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

						await Users.updateOne(
							{"username" : req.session.userId},
							{
								$set :{
									balance : data.balance - (req.body.quantity*exprice)
								}
							} 
						);
					});
				}

				td_logs.findOne({username:req.session.userId},async function(err,data){

					if(data)
					{
						var xara = data.intraday;
						var flag = 0;
						var flag2 = 0;
						var index = 0;
						for( i in xara)
						{
							if(xara[i].date == new Date().toLocaleDateString())
							{
								index = i;
								flag = 1;
								for(j in xara[i].logos)
								{
									if(xara[i].logos[j].stockname == req.body.stockname)
									{
										flag2 = 1;
										console.log("yess");
										xara[i].logos[j].buy_price = ((xara[i].logos[j].buy_price*xara[i].logos[j].quantity)+(exprice*req.body.quantity))/(req.body.quantity+xara[i].logos[j].quantity);
									}
								}
							}
						}

						if(!flag2 && flag)
						{
							console.log("sss");
							var sta = {
								stockname : req.body.stockname,
								quantity : 0,
								buy_price : exprice,
								sell_price : 0,
								realised : 0
							};
							xara[index].logos.push(sta);
						}

						if(!flag)
						{
							console.log("xxx");
							var d = new Date().toLocaleDateString();
							// var d = "26/05/2023";
							var y = [{
								stockname : req.body.stockname,
								quantity  : 0,
								buy_price  : exprice,
								sell_price : 0,
								realised  : 0,
							}];
		
							var stri = 	{date : d , logos : y};
							xara.push(stri);
						}
						
						await td_logs.updateOne(
							{username : req.session.userId}, 
							{
								$set : {
									intraday : xara
								}
							});
					}
				});
				return res.send({"success" : "intraday trade executed."});
			});
		}
	return;
};

