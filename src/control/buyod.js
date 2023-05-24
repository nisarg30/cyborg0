var express = require('express');
var router = express.Router();
var Users = require('../models/user');
var op_logs = require('../models/open_trades');
var td_logs = require('../models/trade_log');
var request = require('request-promise');
const { parse } = require('path');
const { renderFile } = require('ejs');

module.exports = (req, res) => {
    console.log(req.session.userId);
	if(!req.session.userId)
	{
		console.log(req.session.userId);
		res.send({Success : "login required."}).redirect("/");
		return;
		// return res.redirect("/");
	}

	var url = 'http://localhost:4001/';
	// console.log(req.body);
	if(req.body.ordertype  ==  "limit")
		url += 'limitorder';
	else
		url += 'marketorder';

	var info ={
		method : 'POST',
		uri    :  url,
		body   :  {'stockname': req.body.stockname},
		json   :  true
	};

	request(info).then(async function(parsedBody){
		// console.log(parsedBody);
		console.log(parsedBody);

		if(req.body.ordertime == "delivery")
		{
			Users.findOne({username:req.session.userId},async function(err,data){

				if(data.balance < parsedBody.exprice*req.body.quantity)
				{
					return res.send({	"success" : "insufficient funds.", 
										"availabel" : Math.floor(data.balance/parsedBody.exprice)});
				}

				var xarr = data.portfolio;
				var flag = 1;
				for (i in xarr)
				{
					if(xarr[i].stockname == req.body.stockname)
					{
						flag = 0;
						xarr[i].buyprice = (xarr[i].buyprice*xarr[i].quantity)+(parsedBody.exprice*req.body.quantity)/(req.body.quantity+xarr[i].quantity);
						xarr[i].quantity = xarr[i].quantity + req.body.quantity;
					}
				}

				await op_logs.updateOne(
					{"username" : req.session.userId},
					{
						$set : {
							balance : data.balance - (req.body.quantity*parsedBody.exprice)
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
									buy_price : parsedBody.exprice,
									quantity : req.body.quantity
								}
							},
							$set : {
								balance : data.balance - (req.body.quantity*parsedBody.exprice)
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
								balance : data.balance - (req.body.quantity*parsedBody.exprice),
								portfolio : xarr
							}
						}
					)
				}

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
								xary[i].quantity = xary[i].quantity + req.body.quantity;
								xary[i].ex_price =  (xary[i].buyprice*xary[i].quantity)+(parsedBody.exprice*req.body.quantity)/(req.body.quantity+xary[i].quantity);
							}
						}
	
						if(!flag)
						{
							console.log("yyy");
							var stt = {
								stockname : req.body.stockname,
								quantity : req.body.quantity,
								ex_price : parsedBody.exprice,
								realised : 0
							}
							xary.push(stt);
						}
	
						await td_logs.updateOne(
							{username : req.session.userId}, 
							{
								$set : {
									delivery : xary
								}
							});
					}
					else{
						console.log("else");
					}
				});
				return res.send({"success" : "delivery trade executed."});
			});
		}
		else
		{
			op_logs.findOne({username:req.session.userId},async function(err,data){
				
				if(data)
				{
					if(data.balance < parsedBody.exprice*req.body.quantity){
						return res.send({	"success" : "insufficient funds.", 
											"availabel" : Math.floor(data.balance/parsedBody.exprice)});
					}
					
					var xar = data.log;
					var fla = 1;
					for (i in xar)
					{
						if(xar[i].stockname == req.body.stockname)
						{
							fla = 0;
							xar[i].buyprice = (xar[i].ex_price*xar[i].quantity)+(parsedBody.exprice*req.body.quantity)/(req.body.quantity+xar[i].quantity);
							xar[i].quantity = xar[i].quantity + req.body.quantity;
						}
					}

					await Users.updateOne(
						{"username" : req.session.userId},
						{
							$set :{
								balance : data.balance - (req.body.quantity*parsedBody.exprice)
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
										ex_price : parsedBody.exprice,
										direction : req.body.direction,
									}
								},
								$set :{
									balance : data.balance - (req.body.quantity*parsedBody.exprice)
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
									balance : data.balance - (req.body.quantity*parsedBody.exprice),
									log : xar
								}
							} 
						);
					}
				}
				else
				{
					console.log(req.session.userId);
					var rex;
					Users.findOne({username:req.session.userId},async function(err,data)
					{
						rex = data.balance - (parsedBody.exprice*req.body.quantity);
						if(rex < 0)
						{
							res.send({	"success" : "insufficient funds.", 
										"availabel" : Math.floor(data.balance/parsedBody.exprice)});
							return;
						}
						console.log(rex);

						var newentry = new op_logs({
							username : req.session.userId,
							balance : rex,
							log : [{
								stockname : req.body.stockname,
								quantity : req.body.quantity,
								ex_price : parsedBody.exprice,
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
									balance : data.balance - (req.body.quantity*parsedBody.exprice)
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
										xara[i].logos[j].quantity = xara[i].logos[j].quantity + req.body.quantity;
										xara[i].logos[j].ex_price = ((xara[i].logos[j].ex_price*xara[i].logos[j].quantity)+(parsedBody.exprice*req.body.quantity))/(req.body.quantity+xara[i].logos[j].quantity);
									}
								}
							}
						}

						if(!flag2 && flag)
						{
							console.log("sss");
							var sta = {
								stockname : req.body.stockname,
								quantity : req.body.quantity,
								ex_price : parsedBody.exprice,
								realised : 0
							};
							xara[index].logos.push(sta);
						}

						if(!flag)
						{
							console.log("xxx");
							var d = new Date().toLocaleDateString();
							var y = [{
								stockname : req.body.stockname,
								quantity  : req.body.quantity,
								ex_price  : parsedBody.exprice,
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
	})
	return;
};