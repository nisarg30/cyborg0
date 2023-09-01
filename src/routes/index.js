var express = require('express');
var router = express.Router();
var Users = require('../models/user');
var td_logs = require('../models/trade_log');
const bcrypt = require('bcrypt');
const jwt=require("jsonwebtoken");

const sellod = require('../control/sellod');
const buyod = require('../control/buyod');
const maintain = require('../control/op_log_maintain');
const limitmaintain = require('../control/pot_maintain');
const { buy_handle, sell_handle } = require('../control/limit_order'); 
const reset_user = require('../control/reset_user');
const deleteuser = require('../control/delete_user');
require('dotenv').config()

//login routes
router.post("/jwt",async (req,res)=>{
    const token= req.body.token;
    jwt.verify(token ,process.env.secret_key, async (err,payload)=>{
        if(err){
            console.log(err)
            return res.status(204).send("--")
        }
        const {_id}=payload;
        
        return res.status(200).send({id:_id});
    })
});

const verifyToken = (req, res, next) => {
    const token = req.headers.authorization; // Extract the token from the header
    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }

    jwt.verify(token, process.env.secret_key, (err, decoded) => {
        if (err) {
            return res.status(403).json({ message: 'Failed to authenticate token' });
        }
        req.session.userId = decoded._id; // Attach the _id to the request object
        next(); // Move to the next middleware
    });
};

router.post('/', function (req, res, next) {
	console.log("login");
    Users.findOne({ username: req.body.username }, function (err, data) {
        if (data) {
            bcrypt.compare(req.body.password, data.password, function (err, result) {
                if (result === true) {
                    const token=jwt.sign({_id:data.username},process.env.secret_key);
                    res.cookie("jwt",token);
                    res.status(200).send({token, "success": "You are logged in now."})
                } else {
                    res.send({ "success": "Wrong password!" });
                }
            });
        } else {
            res.send({ "success": "This Email Is not registered!" });
        }
    });
});

//registration routes

router.post('/reg', async function(req, res, next) {
	var personInfo = req.body;

	if(!personInfo.email || !personInfo.username || !personInfo.password){
		res.send();
	} else {
			Users.findOne({username:personInfo.username},async function(err,data){
				if(!data){
					
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

					res.send({"Success":"You are regestered,You can login now."});
				}else{
					res.send({"Success":"username is already used."});
				}
			});
    }
});


router.post('/market/sellorder',verifyToken,sellod)

router.post('/market/buyorder',verifyToken ,buyod)

router.post('/maintainance', maintain)

router.post('/limitmaintainance', limitmaintain)

router.post('/deleteuser', verifyToken ,deleteuser)

router.post('/resetuser', verifyToken ,reset_user)

//limit order handeling
router.post('/limit', verifyToken ,async function(req, res, next) {

	if(!req.session.userId)
	{
		return res.send({Success : "login required."});
	}
	
	const order = {
		username : req.session.userId,
		exprice : req.body.exprice,
		quantity : req.body.quantity,
		ordertime : req.body.ordertime,
		direction : req.body.direction
	}
	
	if(req.body.direction == "BUY"){
		await buy_handle(order);
	}
	else{
		await sell_handle(order);
	}
	res.send({sucess : "limit order placed"});
});

router.post('/addstocktowatchlist', verifyToken ,async function(req, res, next) {
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

router.post('/addwatchlist', verifyToken, async function(req, res, next) {
	console.log("add watch list");
	try {
		const user = await Users.findOne({ username : req.session.userId, 'watchlists.watchlist.name': req.body.watchname });
		if(user){
			res.status(404).send({ success : "watchlist already exists"});
			return;
		}

		const entry = {
			watchlist : {
				name : req.body.watchname,
				array : []
			}
		}
		await Users.updateOne({username : "np1"},
			{
			$push : {
				watchlists :  entry 
			}
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
//export
module.exports = router;