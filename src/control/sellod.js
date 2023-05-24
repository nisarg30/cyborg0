var express = require('express');
var router = express.Router();
var Users = require('../models/user');
var op_logs = require('../models/open_trades');
var td_logs = require('../models/trade_log');
var request = require('request-promise');
const { parse } = require('path');
const { renderFile } = require('ejs');


module.exports = (req, res) => {
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

		console.log(parsedBody);
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

				await Users.updateOne(
					{ "username" : req.session.userId},
					{
						$set : {
							balance : data.balance + (req.body.quantity*parsedBody.exprice),
							portfolio : srr
						}
					}
				);

				await op_logs.updateOne(
					{ "username" : req.session.userId},
					{
						$set : {
							balance : data.balance + (req.body.quantity*parsedBody.exprice),
						}
					}
				);

				td_logs.findOne({username:req.session.userId},async function(err,data){

					var array = data.delivery;

					for(i in array)
					{
						if(array[i].stockname == req.body.stockname)
						{
							array[i].quantity = array[i].quantity - req.body.quantity;
							array[i].realised = array[i].realised + req.body.quantity*(parsedBody.exprice-array[i].ex_price);
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
					console.log(str[i]);
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
							balance : data.balance + (req.body.quantity*parsedBody.exprice),
						}
					}
				);
	
				await op_logs.updateOne(
					{ "username" : req.session.userId},
					{
						$set : {
							balance : data.balance + (req.body.quantity*parsedBody.exprice),
							log : str
						}
					}
				);

				td_logs.findOne({username:req.session.userId},async function(err,data){

					var array = data.intraday;
					for(i in array)
					{
						for(j in array[i].logos)
						{
							if(array[i].logos[j].stockname == req.body.stockname)
							{
								array[i].logos[j].quantity  = array[i].logos[j].quantity - req.body.quantity;
								array[i].logos[j].realised  = array[i].logos[j].realised + req.body.quantity*(parsedBody.exprice - array[i].logos[j].ex_price);
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
	});
};