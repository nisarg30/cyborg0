const Users = require('../models/user.js');
const td_logs = require('../models/trade_log.js');
const op_logs = require('../models/open_trades.js');

module.exports = async function limit_maintain(req, res){

    const removeCriteria = {
        'portfolio.quantity': 0,
        'portfolio.buy_price': 0,
    };
    await Users.updateMany({}, {
        $pull: {
            portfolio: {
            quantity: 0,
            buy_price: 0,
        },
        },
    });

    const logremoveCriteria = {
        'log.quantity': 0,
        'log.ex_price': 0,
    };
    await op_logs.updateMany({}, {
        $pull: {
            log: {
            quantity: 0,
            ex_price: 0,
        },
        },
    });

    await td_logs.updateMany(
        { 'delivery.dlog': [] }, 
        { $pull: { delivery: { dlog: [] } } }
    );
    
    const todayDate = new Date().toLocaleDateString();
    await td_logs.updateMany(
        { 'intraday.date': todayDate },
        {
            $pull: {
                'intraday.$.logos': {
                quantity: 0,
                buy_price: 0,
                sell_price: 0,
                realised: 0
            }
        }
    });

    res.send({success : "limit maintainance performed"});
}