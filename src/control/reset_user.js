const Users = require('../models/user');
const op_logs = require('../models/open_trades');
const td_logs = require('..//models/trade_log');

module.exports = async function reset_user(req, res){
    try{
        const userdata = await Users.findone( { username : req.session.userId} );
        if(userdata.limitcount > 0){
            return res.send({success : "you have limit trades pending either close them or wait for them to get executed"});
        }

        await Users.updateOne( 
            { username : req.session.userId },
            {
                $set : {
                    limitcount : 0,
                    balance : 1000000,
                    portfolio : []
                }
            }
        );

        await td_logs.updateOne( 
            { username : req.session.userId },
            {
                $set : {
                    delivery : [],
                    intraday : [],
                }
            }
        );

        await op_logs.deleteOne( { username : req.session.userId } );
        return res.send({success : "account resetted"});
    }
    catch (err){
        console.log(err);
        return res.send({success : "error occured"});
    }
}