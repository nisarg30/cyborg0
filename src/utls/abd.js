const { SmartAPI, WebSocketV2 } = require('smartapi-javascript');
const mongoose = require('mongoose');
const spp = require('../models/stockprice.js');
const auth = require('otplib');
const tokent_to_stock = require('../../x.json');
const fs = require('fs');
const { getIO } = require('../socket.js');
const limit_execution = require('./limitexe.js');
const moment = require('moment');
require('dotenv').config();

var io;
// Common WebSocket configuration
const websocketConfig = {
    apikey: process.env.apikey,
    clientcode: process.env.client,
};

async function createSession() {
    const smart_api = new SmartAPI({ api_key: process.env.apikey });
    const secret = process.env.see;
    const token = auth.authenticator.generate(secret);
    const session = await smart_api.generateSession(process.env.client, process.env.passc, token);
    return session.data;
}

async function setupWebSocket(array, data) {
    const web_socket = new WebSocketV2({
        jwttoken: data.jwtToken,
        ...websocketConfig,
        feedtype: data.feedToken,
    });

    try {
        io = getIO();
        await web_socket.connect();
        let json_req = {
            "correlationID": "abcde12345",
            "action": 1,
            "mode": 2,
            "exchangeType": 1,
            "tokens": array
        };
        web_socket.fetchData(json_req);
        web_socket.on('tick', receiveTick);
    } catch (error) {
        console.error('WebSocket connection error:', error);
    }
}

const BULK_UPDATE_SIZE = 100; 
let bulkOperations = [];
let bulkTimer = null;
let pendingStocks = new Set();
const BATCH_INTERVAL = 5000; 

function flushBulkOperations() {
    if (bulkOperations.length > 0) {
        spp.bulkWrite(bulkOperations).then().catch(err => {
            console.error('Bulk update failed:', err);
        });
        // Clear the current bulk operations array
        bulkOperations = [];
    }
}

async function receiveTick(data) {
    const now = moment().tz('Asia/Kolkata');
    const startTime = moment({ hour: 9, minute: 15 });
    const endTime = moment({ hour: 15, minute: 30 });

    if (now.isBetween(startTime, endTime)) {
        if (data.token !== undefined) {
            const tokenWithQuotes = data.token;
            const tokenWithoutQuotes = tokenWithQuotes.replace(/['"]+/g, '');
            const price = parseInt(data.last_traded_price, 10) / 100;
            const close = parseInt(data.close_price, 10) / 100;
            const stockname = tokent_to_stock[tokenWithoutQuotes];

            // Emit socket message
            io.of('/auth').to(tokent_to_stock[tokenWithoutQuotes]).emit('update', {
                stock: stockname,
                price: price,
                open: close
            });

            io.of('/general').to(tokent_to_stock[tokenWithoutQuotes]).emit('update', {
                exchange_timestamp : data.exchange_timestamp,
                stock: stockname,
                price: price,
                open: close,
                vol_traded : data.vol_traded,
            });

            console.log(tokent_to_stock[tokenWithoutQuotes], price);

            // Add stock to the pending set
            pendingStocks.add(stockname);

            // Prepare update operation for bulk writing
            bulkOperations.push({
                updateOne: {
                    filter: { token: tokenWithoutQuotes },
                    update: [{
                        $set: {
                            previousprice: "$currentprice",  // This now correctly references the field
                            currentprice: price,
                            close: close
                        }
                    }]
                }
            });

            // Check if it's time to flush the bulk operations
            if (bulkOperations.length >= BULK_UPDATE_SIZE) {
                flushBulkOperations();
            }

            // Optionally set a timer to flush operations at least every few seconds
            if (!bulkTimer) {
                bulkTimer = setTimeout(() => {
                    flushBulkOperations();
                    bulkTimer = null;
                }, 1000);  // Adjust time to balance between performance and real-time requirement
            }
        }
    }
}

// Set up an interval to process pending stocks every 5 seconds
setInterval(async () => {
    if (pendingStocks.size > 0) {
        const stocksToProcess = Array.from(pendingStocks);
        pendingStocks.clear(); // Clear the set before processing
        for (const stock of stocksToProcess) {
            await limit_execution(stock);
            console.log("limit execution: ", stock);
        }
    }
}, BATCH_INTERVAL);

// Wrapping abd and abc function to reduce duplication
async function handleTokens(tokens) {
    const sessionData = await createSession();
    const firstBatch = tokens.slice(0, 1000);
    const secondBatch = tokens.slice(1000);
    setupWebSocket(firstBatch, sessionData);
    setupWebSocket(secondBatch, sessionData);
    // setupWebSocket(['26000','26009','2885'],sessionData)
}

async function getConnection() {
    const tokensFilename = 'tokens.json';
    const rawData = fs.readFileSync(tokensFilename);
    var tokens = JSON.parse(rawData);
    await handleTokens(tokens);
}

module.exports = getConnection;
