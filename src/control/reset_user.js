const Users = require('../models/user');
const op_logs = require('../models/open_trades');
const td_logs = require('..//models/trade_log');

module.exports = async function reset_user(req, res){

    console.log('reesetuser');
    try{
        const userdata = await Users.findOne( { username : req.session.userId} );
        console.log(userdata)
        
        if(userdata.limitcount > 0){
            return res.send({ success : 1003 });
        }

        await Users.updateOne( 
            { username : req.session.userId },
            {
                $set : {
                    limitcount : 0,
                    balance : 1000000,
                    portfolio : [],
                    watchlists : []
                }
            }
        );

        await td_logs.updateOne( 
            { username : req.session.userId },
            {
                $set : {
                    delivery : [],
                    intraday : [],
                    limit : [],
                }
            }
        );

        await op_logs.deleteOne( { username : req.session.userId } );
        return res.send({success : 1001 });
    }
    catch (err){
        console.log(err);
        return res.send({success : 1002 });
    }
}