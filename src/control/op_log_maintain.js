const Users = require('../models/user');
const op_logs = require('../models/open_trades');
const td_logs = require('../models/trade_log');
const { parse } = require('path');
const fetch123 = require('../utls/s_price');

async function up(log, day_obj) {
    var balupdate = 0;
    for (const e of log) {
        var x = await fetch123(e.stockname);
        x = parseFloat(x);
        await new Promise((resolve) => {
            console.log(x);
                for (const i in day_obj) {
                    if (day_obj[i].stockname === e.stockname) {
                        day_obj[i].quantity += e.quantity;
                        day_obj[i].sell_price = ((day_obj[i].sell_price * (day_obj[i].quantity)) + (x * e.quantity)) / (day_obj[i].quantity);
                        day_obj[i].realised = (day_obj[i].sell_price - day_obj[i].buy_price) * day_obj[i].quantity;
                        balupdate = balupdate + (x*e.quantity);
                    }
                }
                resolve();
        });
    }

    return {"day_obj" : day_obj, "balupdate" : balupdate};
}

module.exports = async (req, res) => {
    try {
        const odata = await op_logs.find({});
        const updatePromises = odata.map(async (e) => {
            const tdata = await td_logs.findOne({ username: e.username });
            const intra_trade = tdata.intraday;
            let day_obj;
            let index = 0;
            for (const i in intra_trade) {
                if (intra_trade[i].date === new Date().toLocaleDateString()) {
                    day_obj = intra_trade[i].logos;
                    index = i;
                    break;
                }
            }
            const vv = await up(e.log, day_obj);
            console.log(vv);
            intra_trade[index].logos = vv.day_obj;
            await td_logs.updateOne(
                { "username": e.username },
                {
                    $set: {
                        intraday: intra_trade
                    }
                }
            );
            
            const udata = await op_logs.findOne({ username: e.username });
            await Users.updateOne(
                { "username": e.username },
                {
                    $set: {
                        balance: udata.balance + vv.balupdate
                    }
                }
            );
        });

        await Promise.all(updatePromises);
        op_logs.deleteMany({}, async (err,data) => {

            if(err){
                console.log(err);
            }
            else{
                console.log("deletion successfull");
            }
        })
        res.send({ "success": "deletion" });
    } catch (error) {
        console.error("Error:", error);
        res.status(500).send({ "error": "An error occurred" });
    }
};
