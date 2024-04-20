const Users = require('../models/user');
const op_logs = require('../models/open_trades');
const td_logs = require('../models/trade_log');

module.exports = async function delete_user(req, res) {
    try {
        await Users.deleteOne({ username: req.session.userId });
        await op_logs.findOneAndDelete({ username: req.session.userId });
        await td_logs.deleteOne({ username: req.session.userId });
        return res.status(200).send({ success: 1001 });
    } catch (err) {
        console.log(err);
        return res.send({ success: 1002});
    }
}
