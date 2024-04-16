var express = require('express');
var router = express.Router();
var Users = require('../models/user');
var td_logs = require('../models/trade_log');
const op_logs = require('../models/open_trades.js');
const bcrypt = require('bcrypt');
const jwt=require("jsonwebtoken");

const spp = require('../models/stockprice.js')
const sellod = require('../control/sellod');
const buyod = require('../control/buyod');
const maintain = require('../control/op_log_maintain');
const limitmaintain = require('../control/pot_maintain');
const { buy_handle, sell_handle } = require('../control/limit_order'); 
const reset_user = require('../control/reset_user');
const deleteuser = require('../control/delete_user');
require('dotenv').config()

//login routes
const verifyToken = (req, res, next) => {
    const token = req.body.token;
    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }

    jwt.verify(token, "36a4df6c92e79981ebd6ac4652a9d3695db3a0d3d062c76f4631a6b5098b6e47", (err, decoded) => {
        if (err) {
            return res.status(403).json({ message: 'Failed to authenticate token' });
        }
        next(); // Move to the next middleware
    });
};

const verifyTokenFirst = (req, res, next) => {
    const token = req.body.token;
	console.log("verify token first : ", token );
	
    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }

    jwt.verify(token, "36a4df6c92e79981ebd6ac4652a9d3695db3a0d3d062c76f4631a6b5098b6e47", (err, decoded) => {
        if (err) {
            return res.status(403).json({ message: 'Failed to authenticate token' });
        }
        req.session.userId = decoded._id; 
        next(); // Move to the next middleware
    });
};

router.post('/jwt', verifyTokenFirst,async function(req, res) {
	const data = await Users.findOne({ username : req.session.userId });
	res.status(200).send({ success: 'verification successful' , data : data.watchlists});
	return;
}); 

// Login route with JWT token generation
router.post('/', function (req, res, next) {
    console.log(req.body);
    Users.findOne({ username: req.body.username }, function (err, data) {
        if (data) {
            bcrypt.compare(req.body.password, data.password, function (err, result) {
                if (result === true) {
					console.log('abc');
                    const token = jwt.sign({ _id: data.username }, "36a4df6c92e79981ebd6ac4652a9d3695db3a0d3d062c76f4631a6b5098b6e47");
					req.session.userId = data.username;
                    res.cookie("jwt", token, data.watchlists);
                    res.status(200).send({ token, "success": "You are logged in now." , data : data.watchlists});
                } else {
                    res.status(403).send({ "success": "Wrong password!" });
                }
            });
        } else {
			console.log(err);
            res.status(404).send({ "success": "This Email Is not registered!" });
        }
    });
});

//registration routes

router.post('/reg', async function(req, res, next) {
	var personInfo = req.body;
	console.log(personInfo);
	if(!personInfo.email || !personInfo.username || !personInfo.password){
		res.send({ success : "missing info" });
	} else {
			const udata = await Users.findOne({
				username : personInfo.username
			});
			const edata = await Users.findOne({
				email : personInfo.email
			})

			if(udata){
				res.status(403).send({"success" : "username already in use"});
				return;
			}
			if(edata){
				res.status(403).send({"success" : "email already in use"});
				return;
			}

			const hashedPassword = await bcrypt.hash(personInfo.password, 10);

			var newPerson = new Users({
				email:personInfo.email,
				username: personInfo.username,
				password: hashedPassword,
				limitcount : 0,
				watchlists : [],
				balance : 1000000,
				portfolio: []
			});

			newPerson.save(function(err, Person){
				if(err)
					console.log(err);
				else
					console.log('Success');
			});

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

			res.status(200).send({"Success":"You are regestered,You can login now."});
		}
});

router.post('/data', async (req, res) => {
	console.log('req')
	var array = await spp.find({}, 'stockname');
	// console.log(array);
	res.send(array);
})

router.post('/market',verifyTokenFirst,async function(req, res) {
	if(!req.session.userId)
	{
		return res.send({ case : 1000 });
	}
	
	// const order = {
	// 	username : req.session.userId,
	// 	stockname : req.body.stockname,
	// 	quantity : req.body.quantity,
	// 	ordertime : req.body.ordertime,
	// 	direction : req.body.direction
	// }
	
	if(req.body.direction == 0){
		await buyod(req, res);
	}
	else{
		await sellod(req, res);
	}
	// res.send({sucess : "limit order placed"});
})

router.post('/maintainance', maintain)

router.post('/limitmaintainance', limitmaintain)

router.post('/deleteuser', verifyToken ,deleteuser)

router.post('/resetuser', verifyToken ,reset_user)

//limit order handeling
router.post('/limit', verifyTokenFirst ,async function(req, res, next) {

	if(!req.session.userId)
	{
		return res.status(200).send({ case : 1000 });
	}
	
	const order = {
		username : req.session.userId,
		stockname : req.body.stockname,
		exprice : req.body.exprice,
		quantity : req.body.quantity,
		ordertime : req.body.ordertime,
		direction : req.body.direction
	}
	console.log(order)
	
	var x;
	if(req.body.direction == 0){
		x = await buy_handle(order);
	}
	else{
		x = await sell_handle(order);
	}
	res.status(200).send(x);
});

router.post('/addstocktowatchlist', verifyTokenFirst ,async function(req, res, next) {
	const username = req.session.userId;
	const watchlistname = req.body.watchlistname;
	const stockname = req.body.stockname;

	await Users.updateOne(
		{
			username : username,
			"watchlists.watchlist.name": watchlistname,
			"watchlists.watchlist.array": {
			$not: {
				$elemMatch: {
				stockname:  stockname// Replace with the stock name to check
				}
			}
			}
		},
		{
			$push: {
			"watchlists.$.watchlist.array": {
			  stockname: stockname // Replace with the actual stock name you want to add
			}
			}
		}
	);
	return res.send({'success' : "stock added to watchlis"});
});

router.post('/addwatchlist', verifyTokenFirst,async function(req, res, next) {
	console.log("add watch list");
	try {
		const user = await Users.findOne({ username : req.session.userId, 'watchlists.watchlist.name': req.body.watchlist });
		if(user){
			res.status(404).send({ success : "watchlist already exists"});
			return;
		}

		console.log(req.session.userId);

		const entry = {
			watchlist : {
				name : req.body.watchlist,
				array : []
			}
		}
		Users.updateOne({ username : req.session.userId },
			{
				$push : {
					watchlists :  entry 
				}
			}, () => {
				console.log("add watchlist");
			}
		)
		res.status(200).send({ success : "watchlist created" });
		return;
	}
	catch (err) {
		res.status(500).send({ error : err });
		return;
	}
})

router.post('/deletewatchlist', verifyTokenFirst,async function(req, res, next) {
	console.log("delete watch list");
	try {
		await Users.findOneAndUpdate(
			{ username : req.session.userId },
			{ $pull: { watchlists: { 'watchlist.name': req.body.watchlistName } } },
			{ new: false }
		);
	
		res.status(200).send({ success : "watchlist deleted" });
		return;
	}
	catch (err) {
		console.log(err)
		res.status(500).send({ error : err });
		return;
	}
})

router.post('/deletestock', verifyTokenFirst,async function(req, res, next) {
	console.log("delete stock");
	try {
		await Users.findOneAndUpdate(
			{ username : req.session.userId, 'watchlists.watchlist.name': req.body.watchlistName },
			{ $pull: { 'watchlists.$.watchlist.array': { stockname: req.body.stockName } } },
			{ new: false }
		);
	
		res.status(200).send({ success : "stockname deleted" });
		return;
	}
	catch (err) {
		console.log(err);
		res.status(500).send({ error : err });
		return;
	}
})

router.post('/portfolio', verifyTokenFirst,async (req, res) => { 
	try {
		const data = await Users.findOne({ username : req.session.userId });
		const portfolio = data.portfolio;
        console.log(data);
		res.status(200).send({success : 'success', portfolio});
	} catch (error) {
		console.log(error);
	}
});

router.post('/positions', verifyTokenFirst, async (req, res) => {
	try {
		const open_positions = await op_logs.findOne({ username : req.session.userId }, { log : 1});
		const trade_lgt = await td_logs.aggregate([
            { $match: { username: req.session.userId } },
            { $unwind: '$intraday' },
            { $match: { 'intraday.date': new Date().toLocaleDateString() } },
            { $project: { _id: 0, logos: '$intraday.logos' } }
        ]).exec();

		console.log(open_positions)
		res.status(200).send({ ope : open_positions , close : trade_lgt.length == 0 ? [] : trade_lgt[0].logos });

	} catch (error) {
		console.log(error);
	}
})

router.post('/orderhistory', verifyTokenFirst,async function(req, res) {
	try {
		const dateToSearch = new Date().toLocaleDateString();
		console.log(dateToSearch);
		try {
			const trade_lgt = await td_logs.aggregate([
				{
					$match: {
						username: req.session.userId
					}
				},
				{
					$unwind: "$intraday"
				},
				{
					$match: {
						"intraday.date": dateToSearch
					}
				},
				{
					$project: {
						_id: 0,
						logos: "$intraday.logos"
					}
				}
			]).exec();
			// console.log("logos : ", result[0].logos);
			res.status(200).send({ " success" : "true", "logos" : trade_lgt.length == 0 ? [] : trade_lgt[0].logos });
		} catch (error) {
			console.error("Error:", error);
		}
	} catch (error) {
		console.log(error);
		res.status(500).send({ error : error });
	}
});

router.post('/openorders', verifyTokenFirst, async function (req, res) {
	try {
		const response = await td_logs.findOne({ username : req.session.userId }, { _id:0, limit : 1});
		console.log(response.limit);
		res.status(200).send({" success" : "success" , "openOrders" : response.limit })
	} catch (error) {
		console.log(error);
		res.status(500).send({ error : error });
	}
})

router.post('/account', verifyTokenFirst, async function(req,res) {
	try {
		const tdata = await td_logs.findOne({ username : req.session.userId }, { 'delivery.stockname': 1, 'delivery.realised': 1, '_id': 0 });
		console.log(tdata);
		res.status(200).send({" success" : "success" , "delivery" : tdata.delivery.length > 0 ? tdata.delivery : [] })
	} catch (error) {
		res.status(500).send({" error" : error });
	}
})

router.post('/deliveryfetch', verifyTokenFirst, async function(req,res) {
	try {
		const tdata = await td_logs.aggregate([
            { $match: { username: req.session.userId } },
            { $unwind: "$delivery" },
            { $match: { "delivery.stockname": req.body.stockname } },
            { $project: { dlog: "$delivery.dlog", _id: 0 } }
        ]);
		console.log(tdata);
		res.status(200).send({"success" : "success" , "deliveryfetch" : tdata[0].dlog.length > 0 ? tdata[0].dlog : [] })
	} catch (error) {
		console.log(error);
		res.status(500).send({"error" : error });
	}
})

router.post('/intradayfetch', verifyTokenFirst, async function (req, res) {
	try {
		const dateToSearch = req.body.date;
		console.log(dateToSearch);
		try {
			const result = await td_logs.aggregate([
				{
					$match: {
						username: req.session.userId
					}
				},
				{
					$unwind: "$intraday"
				},
				{
					$match: {
						"intraday.date": dateToSearch
					}
				},
				{
					$project: {
						_id: 0,
						logos: "$intraday.logos"
					}
				}
			]).exec();
			console.log(result);
			res.status(200).send({ " success" : "true", "logos" : result.length == 0 ? [] : result[0].logos });
		} catch (error) {
			console.error("Error:", error);
		}
	} catch (error) {
		console.log(error);
		res.status(500).send({ error : error });
	}
})
//export
module.exports = router;