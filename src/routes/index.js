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
const maintain = require('../control/op_log_maintain');
// const demo = require('../../../cyborg0/demo');
const { buy_handle, sell_handle } = require('../control/limit_order'); 
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

router.post('/reg', async function(req, res, next) {
	console.log(req.body);
	var personInfo = req.body;

	if(!personInfo.email || !personInfo.username || !personInfo.password || !personInfo.passwordConf){
		res.send();
	} else {
		if (personInfo.password == personInfo.passwordConf) {

			const uemail = await Users.findOne({email:personInfo.email});
			if (uemail){
				return res.send({"syccess" : "email already in use"});
			}
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


router.post('/buyorder',buyod)


router.post('/maintainance', maintain)

router.post('/limit', async function(req, res, next) {

	console.log(req.session.userId);
	if(!req.session.userId)
	{
		console.log(req.session.userId);
		return res.send({Success : "login required."});
	}
	
	const order = {
		username : req.body.username,
		exprice : req.body.exprice,
		quantity : req.body.quantity,
		ordertime : req.body.ordertime,
		direction : "BUY"
	}
	console.log(req.body.stockname);
	if(req.body.direction == "BUY"){
		await buy_handle(order);
	}
	else{
		await sell_handle(order);
	}
	res.send("sucess");
});
//export
module.exports = router;