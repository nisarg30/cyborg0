var express = require('express');
var router = express.Router();
var Users = require('../models/user');
var op_logs = require('../models/open_trades');
var td_logs = require('../models/trade_log');
var request = require('request-promise');
const { parse } = require('path');
const { renderFile } = require('ejs');

const sellod = require('../control/sellod');
const buyod = require('../control/buyod');

//login routes
router.get('/', function (req, res, next) {
	return res.render('login.ejs');
});

router.post('/', function (req, res, next) {
	//console.log(req.body);
	Users.findOne({username:req.body.username},function(err,data){
		if(data){
			
			if(data.password==req.body.password){
				//console.log("Done Login");
				req.session.userId = data.username;

				res.send({"Success":"You are logged in now."});
			}else{
				res.send({"Success":"Wrong password!"});
			}
		}else{
			res.send({"Success":"This Email Is not regestered!"});
		}
	});
});

//registration routes
router.get('/reg', function (req, res, next) {
	return res.render('reg.ejs');
});

router.post('/reg', function(req, res, next) {
	console.log(req.body);
	var personInfo = req.body;

	if(!personInfo.email || !personInfo.username || !personInfo.password || !personInfo.passwordConf){
		res.send();
	} else {
		if (personInfo.password == personInfo.passwordConf) {

			Users.findOne({username:personInfo.username},function(err,data){
				if(!data){
					
					Users.findOne({},function(err,data){

						var newPerson = new Users({
							email:personInfo.email,
							username: personInfo.username,
							password: personInfo.password,
							passwordConf: personInfo.passwordConf,
							balance : 1000000,
							portfolio: []
						});

						newPerson.save(function(err, Person){
							if(err)
								console.log(err);
							else
								console.log('Success');
						});
					}).sort({_id: -1}).limit(1);

					td_logs.findOne({}, async(err,data) => {
						var d = new Date().toLocaleDateString();
						var entry = new td_logs({
							username : personInfo.username,
							delivery : [],
							intraday : 	[],
						});

						entry.save(async(err,d)=>{
							if(err)
								console.log(err);
							else 
								console.log("td success");
						})
					});

					res.send({"Success":"You are regestered,You can login now."});
				}else{
					res.send({"Success":"username is already used."});
				}
			});
		}else{
			res.send({"Success":"password is not matched"});
		}
	}
});

router.post('/sellorder',sellod)

// 	if(!req.session.userId)
// 	{
// 		console.log(req.session.userId);
// 		res.send({Success : "login required."}).redirect("/");
// 		return;
// 		// return res.redirect("/");
// 	}

// 	var url = 'http://localhost:4001/';
// 	// console.log(req.body);
// 	if(req.body.ordertype  ==  "limit")
// 		url += 'limitorder';
// 	else
// 		url += 'marketorder';
	
// 	var info ={
// 		method : 'POST',
// 		uri    :  url,
// 		body   :  {'stockname': req.body.stockname},
// 		json   :  true
// 	};

// 	request(info).then(async function(parsedBody){

// 		console.log(parsedBody);
// 		if(req.body.ordertime == "delivery")
// 		{
// 			Users.findOne({username:req.session.userId},async function(err,data){

// 				var flag = 1,  flag2 = 1;
// 				var srr = data.portfolio;
// 				var index = 0;
// 				for(i in srr)
// 				{
// 					if(srr[i].stockname == req.body.stockname)
// 					{
// 						// flag = 0;
// 						if(req.body.quantity > srr[i].quantity)
// 						{
// 							flag = 0;
// 							return res.send({"success" : "insufficient quantity.", availabel : srr[i].quantity});
// 						}          

// 						srr[i].quantity = srr[i].quantity - req.body.quantity;
// 						if(srr[i].quantity == 0)
// 						{
// 							index = i;
// 							flag2 = 0;
// 						}	
// 						flag = 0;
// 						break;
// 					}
// 				}

// 				if(flag2==0)
// 					srr.splice(index, 1);

// 				if(flag)
// 				{
// 					return res.send({"success" : "you dont own this stock."});
// 				}

// 				await Users.updateOne(
// 					{ "username" : req.session.userId},
// 					{
// 						$set : {
// 							balance : data.balance + (req.body.quantity*parsedBody.exprice),
// 							portfolio : srr
// 						}
// 					}
// 				);

// 				await op_logs.updateOne(
// 					{ "username" : req.session.userId},
// 					{
// 						$set : {
// 							balance : data.balance + (req.body.quantity*parsedBody.exprice),
// 						}
// 					}
// 				);

// 				td_logs.findOne({username:req.session.userId},async function(err,data){

// 					var array = data.delivery;

// 					for(i in array)
// 					{
// 						if(array[i].stockname == req.body.stockname)
// 						{
// 							array[i].quantity = array[i].quantity - req.body.quantity;
// 							array[i].realised = array[i].realised + req.body.quantity*(parsedBody.exprice-array[i].ex_price);
// 							break;
// 						}
// 					}

// 					await td_logs.updateOne(
// 						{ "username" : req.session.userId},
// 						{
// 							$set : {
// 								delivery : array
// 							}
// 						}
// 					);
// 				});
// 				return res.send("sell delivery exec!");
// 			});

			
// 		}
// 		else
// 		{
// 			op_logs.findOne({username:req.session.userId},async function(err,data){

// 				if(data == null)
// 				{
// 					return res.send("you don't own this stock");
// 				}
// 				var str = data.log;
// 				var sex = 1,sex2 = 1;
// 				var ind = 0;
// 				for(i in str)
// 				{
// 					console.log(str[i]);
// 					if(str[i].stockname == req.body.stockname)
// 					{
// 						if(req.body.quantity > str[i].quantity)
// 						{
// 							sex = 0;
// 							return res.send({"success" : "insufficient quantity.", availabel : str[i].quantity});
// 						}
// 						sex = 0;
// 						str[i].quantity = (str[i].quantity - req.body.quantity);

// 						if(str[i].quantity == 0)
// 						{
// 							ind = i;
// 							sex2 = 0;
// 						}
// 					}
// 				}

// 				if(sex == 1)
// 				{
// 					return res.send({"success" : "you dont own this stock."});
// 				}

// 				if(sex2==0)
// 					str.splice(ind, 1);
				
// 				await Users.updateOne(
// 					{ "username" : req.session.userId},
// 					{
// 						$set : {
// 							balance : data.balance + (req.body.quantity*parsedBody.exprice),
// 						}
// 					}
// 				);
	
// 				await op_logs.updateOne(
// 					{ "username" : req.session.userId},
// 					{
// 						$set : {
// 							balance : data.balance + (req.body.quantity*parsedBody.exprice),
// 							log : str
// 						}
// 					}
// 				);

// 				td_logs.findOne({username:req.session.userId},async function(err,data){

// 					var array = data.intraday;
// 					for(i in array)
// 					{
// 						for(j in array[i].logos)
// 						{
// 							if(array[i].logos[j].stockname == req.body.stockname)
// 							{
// 								array[i].logos[j].quantity  = array[i].logos[j].quantity - req.body.quantity;
// 								array[i].logos[j].realised  = array[i].logos[j].realised + req.body.quantity*(parsedBody.exprice - array[i].logos[j].ex_price);
// 							}
// 						}
// 					}

// 					await td_logs.updateOne(
// 						{ "username" : req.session.userId},
// 						{
// 							$set : {
// 								intraday : array
// 							}
// 						}
// 					);
// 				});
// 				return res.send("sell intraday exec!");
// 			});
// 		}
// 	});
// });


router.post('/buyorder',buyod)

	// console.log(req.session.userId);
	// if(!req.session.userId)
	// {
	// 	console.log(req.session.userId);
	// 	res.send({Success : "login required."}).redirect("/");
	// 	return;
	// 	// return res.redirect("/");
	// }

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

	// request(info).then(async function(parsedBody){
	// 	// console.log(parsedBody);
	// 	console.log(parsedBody);

	// 	if(req.body.ordertime == "delivery")
	// 	{
	// 		Users.findOne({username:req.session.userId},async function(err,data){

	// 			if(data.balance < parsedBody.exprice*req.body.quantity)
	// 			{
	// 				return res.send({	"success" : "insufficient funds.", 
	// 									"availabel" : Math.floor(data.balance/parsedBody.exprice)});
	// 			}

	// 			var xarr = data.portfolio;
	// 			var flag = 1;
	// 			for (i in xarr)
	// 			{
	// 				if(xarr[i].stockname == req.body.stockname)
	// 				{
	// 					flag = 0;
	// 					xarr[i].buyprice = (xarr[i].buyprice*xarr[i].quantity)+(parsedBody.exprice*req.body.quantity)/(req.body.quantity+xarr[i].quantity);
	// 					xarr[i].quantity = xarr[i].quantity + req.body.quantity;
	// 				}
	// 			}

	// 			await op_logs.updateOne(
	// 				{"username" : req.session.userId},
	// 				{
	// 					$set : {
	// 						balance : data.balance - (req.body.quantity*parsedBody.exprice)
	// 					}
	// 				}
	// 			)

	// 			if(flag)
	// 			{
	// 				await Users.updateOne(
	// 					{ "username" : req.session.userId},
	// 					{
	// 						$push : {
	// 							portfolio : {
	// 								stockname : req.body.stockname,
	// 								buy_price : parsedBody.exprice,
	// 								quantity : req.body.quantity
	// 							}
	// 						},
	// 						$set : {
	// 							balance : data.balance - (req.body.quantity*parsedBody.exprice)
	// 						}
	// 					}
	// 				);
	// 			}
	// 			else
	// 			{
	// 				await Users.updateOne(
	// 					{"username" : req.session.userId},
	// 					{
	// 						$set : {
	// 							balance : data.balance - (req.body.quantity*parsedBody.exprice),
	// 							portfolio : xarr
	// 						}
	// 					}
	// 				)
	// 			}

	// 			td_logs.findOne({username:req.session.userId},async function(err,data){

	// 				var flag = 0;
	// 				if(data)
	// 				{
	// 					console.log("ddd");
	// 					var xary = data.delivery;
	// 					for(i in xary)
	// 					{
	// 						if(xary[i].stockname == req.body.stockname)
	// 						{
	// 							flag = 1;
	// 							xary[i].quantity = xary[i].quantity + req.body.quantity;
	// 							xary[i].ex_price =  (xary[i].buyprice*xary[i].quantity)+(parsedBody.exprice*req.body.quantity)/(req.body.quantity+xary[i].quantity);
	// 						}
	// 					}
	
	// 					if(!flag)
	// 					{
	// 						console.log("yyy");
	// 						var stt = {
	// 							stockname : req.body.stockname,
	// 							quantity : req.body.quantity,
	// 							ex_price : parsedBody.exprice,
	// 							realised : 0
	// 						}
	// 						xary.push(stt);
	// 					}
	
	// 					await td_logs.updateOne(
	// 						{username : req.session.userId}, 
	// 						{
	// 							$set : {
	// 								delivery : xary
	// 							}
	// 						});
	// 				}
	// 				else{
	// 					console.log("else");
	// 				}
	// 			});
	// 			return res.send({"success" : "delivery trade executed."});
	// 		});
	// 	}
	// 	else
	// 	{
	// 		op_logs.findOne({username:req.session.userId},async function(err,data){
				
	// 			if(data)
	// 			{
	// 				if(data.balance < parsedBody.exprice*req.body.quantity){
	// 					return res.send({	"success" : "insufficient funds.", 
	// 										"availabel" : Math.floor(data.balance/parsedBody.exprice)});
	// 				}
					
	// 				var xar = data.log;
	// 				var fla = 1;
	// 				for (i in xar)
	// 				{
	// 					if(xar[i].stockname == req.body.stockname)
	// 					{
	// 						fla = 0;
	// 						xar[i].buyprice = (xar[i].ex_price*xar[i].quantity)+(parsedBody.exprice*req.body.quantity)/(req.body.quantity+xar[i].quantity);
	// 						xar[i].quantity = xar[i].quantity + req.body.quantity;
	// 					}
	// 				}

	// 				await Users.updateOne(
	// 					{"username" : req.session.userId},
	// 					{
	// 						$set :{
	// 							balance : data.balance - (req.body.quantity*parsedBody.exprice)
	// 						}
	// 					}
	// 				);
	
	// 				if(fla)
	// 				{
	// 					await op_logs.updateOne(
	// 						{"username" : req.session.userId },
	// 						{
	// 							$push : {
	// 								log : { 
	// 									stockname : req.body.stockname,
	// 									quantity : req.body.quantity,
	// 									ex_price : parsedBody.exprice,
	// 									direction : req.body.direction,
	// 								}
	// 							},
	// 							$set :{
	// 								balance : data.balance - (req.body.quantity*parsedBody.exprice)
	// 							}
	// 						}
	// 					);
	// 				}
	// 				else
	// 				{
	// 					await op_logs.updateOne(
	// 						{"username" : req.session.userId},
	// 						{
	// 							$set :{
	// 								balance : data.balance - (req.body.quantity*parsedBody.exprice),
	// 								log : xar
	// 							}
	// 						} 
	// 					);
	// 				}
	// 			}
	// 			else
	// 			{
	// 				console.log(req.session.userId);
	// 				var rex;
	// 				Users.findOne({username:req.session.userId},async function(err,data)
	// 				{
	// 					rex = data.balance - (parsedBody.exprice*req.body.quantity);
	// 					if(rex < 0)
	// 					{
	// 						res.send({	"success" : "insufficient funds.", 
	// 									"availabel" : Math.floor(data.balance/parsedBody.exprice)});
	// 						return;
	// 					}
	// 					console.log(rex);

	// 					var newentry = new op_logs({
	// 						username : req.session.userId,
	// 						balance : rex,
	// 						log : [{
	// 							stockname : req.body.stockname,
	// 							quantity : req.body.quantity,
	// 							ex_price : parsedBody.exprice,
	// 							direction : req.body.direction
	// 						}]
	// 					});
	
	// 					newentry.save(function(err, Person){
	// 						if(err)
	// 							console.log(err);
	// 						else
	// 							console.log('Success entry');
	// 					});

	// 					await Users.updateOne(
	// 						{"username" : req.session.userId},
	// 						{
	// 							$set :{
	// 								balance : data.balance - (req.body.quantity*parsedBody.exprice)
	// 							}
	// 						} 
	// 					);
	// 				});
	// 			}

	// 			td_logs.findOne({username:req.session.userId},async function(err,data){

	// 				if(data)
	// 				{
	// 					var xara = data.intraday;
	// 					var flag = 0;
	// 					var flag2 = 0;
	// 					var index = 0;
	// 					for( i in xara)
	// 					{
	// 						if(xara[i].date == new Date().toLocaleDateString())
	// 						{
	// 							index = i;
	// 							flag = 1;
	// 							for(j in xara[i].logos)
	// 							{
	// 								if(xara[i].logos[j].stockname == req.body.stockname)
	// 								{
	// 									flag2 = 1;
	// 									console.log("yess");
	// 									xara[i].logos[j].quantity = xara[i].logos[j].quantity + req.body.quantity;
	// 									xara[i].logos[j].ex_price = ((xara[i].logos[j].ex_price*xara[i].logos[j].quantity)+(parsedBody.exprice*req.body.quantity))/(req.body.quantity+xara[i].logos[j].quantity);
	// 								}
	// 							}
	// 						}
	// 					}

	// 					if(!flag2 && flag)
	// 					{
	// 						console.log("sss");
	// 						var sta = {
	// 							stockname : req.body.stockname,
	// 							quantity : req.body.quantity,
	// 							ex_price : parsedBody.exprice,
	// 							realised : 0
	// 						};
	// 						xara[index].logos.push(sta);
	// 					}

	// 					if(!flag)
	// 					{
	// 						console.log("xxx");
	// 						var d = new Date().toLocaleDateString();
	// 						var y = [{
	// 							stockname : req.body.stockname,
	// 							quantity  : req.body.quantity,
	// 							ex_price  : parsedBody.exprice,
	// 							realised  : 0,
	// 						}];
		
	// 						var stri = 	{date : d , logos : y};
	// 						xara.push(stri);
	// 					}
						
	// 					await td_logs.updateOne(
	// 						{username : req.session.userId}, 
	// 						{
	// 							$set : {
	// 								intraday : xara
	// 							}
	// 						});
	// 				}
	// 			});
	// 			return res.send({"success" : "intraday trade executed."});
	// 		});
	// 	}
	// })
	// return;
// });

//export
module.exports = router;