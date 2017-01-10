"use strict";

var useConfig = true;

var request = require('request');
var VectorWatch = require('vectorwatch-sdk');
var vectorWatch = new VectorWatch();
var logger = vectorWatch.logger;

var cloudantUrl = 'your_cloudant_database_url';
var apiKeyUser = 'some_api_key';
var apiKeyPassword = 'some_password';
var apiKeyAuth = "Basic " + btoa(apiKeyUser + ":" + apiKeyPassword);

var cloudantDbDocuments = {};

if (!cloudantDbDocuments.messages) {
    try {
        getCloudantDbDocuments('_all_docs', 'include_docs=true');
    } catch (err) {
        logger.error('Error with Cloudant: ' + err.message);
    }
}

vectorWatch.on('config', function(event, response) {
    // your stream was just dragged onto a watch face
    logger.info('on config: ' + JSON.stringify(event));

    var userKey = event.req.body.userKey;
    var n2wKey;
    
    try {
        n2wKey = findDocForThisUserKey(userKey).doc._id;
    } catch(err) {
        n2wKey = Date.now();        
    }

    if (useConfig) {
        var key = response.createGridList('Key');
        key.setHint('Please enter this number in Notif2Watch app, it is your unique identifier key.');
        key.addOption(n2wKey);
    }
        
    response.send();
});

vectorWatch.on('subscribe', function(event, response) {
    // your stream was added to a watch face
    logger.info('on subscribe: ' + JSON.stringify(event));

    response.setValue("Waiting notifications");
    response.send();
    
    var userKey = event.req.body.userKey;
    var doc = findDocForThisUserKey(userKey);
    
    if (doc == null) {
        doc = {
            "_id": event.userSettings.settings.Key.name,
            "channelLabel": event.channelLabel,
            "userKey": userKey
        };
        logger.info('doc: ' + doc + ' ' + JSON.stringify(doc));
        createCloudantDocument(doc);
    }
});

vectorWatch.on('unsubscribe', function(event, response) {
    // your stream was removed from a watch face
    logger.info('on unsubscribe');
    response.send();
});

vectorWatch.on('webhook', function(event, response, records) {
    logger.info('on webhook: ' + JSON.stringify(event));
    
    var msg = event.getQuery().msg;
    logger.info('msg: ' + msg);
    if (msg === 'updateCloudantDbDocuments') {
        getCloudantDbDocuments('_all_docs', 'include_docs=true');
    }
    else if(msg === 'log') {
        logger.info('records: ' + JSON.stringify(records));
    }
    else if (msg === 'updateStream') {
        try {
            var n2wKey = event.getQuery().n2wKey;
            var streamText = decodeURIComponent(event.getQuery().streamText);
            streamText = replaceAppNamesByIcons(streamText);
            logger.info('streamText: ' + streamText);
            var doc = findDocForN2wKey(n2wKey);
            var channelLabel = doc.doc.channelLabel;
            var record = findRecordForThisChannelLabel(records, channelLabel);
            if (record !== undefined) {
                logger.info('pushing update to channelLabel: ' + channelLabel);
                logger.info('pushing update to record: ' + JSON.stringify(record));
                record.pushUpdate(streamText);
            }
        } catch(err) {
            logger.error('Error trying to update stream: ' + err.message);
            
            response.setContentType('text/plain');
            response.setContent('Bad Request');
            response.statusCode = 400;
            response.send();
            
            return;
        }
    }
    else if (msg === 'testUpdateSimulatorStream') {
        testUpdateSimulatorStream();
    }
    
    response.setContentType('text/plain');
    response.setContent('OK');
    response.statusCode = 200;
    response.send();
});

function replaceAppNamesByIcons(streamText) {
    streamText = streamText.replace(/Calendar/gi, String.fromCharCode(0xe003));
    streamText = streamText.replace(/Instagram/gi, String.fromCharCode(0xe025));
    streamText = streamText.replace(/Facebook/gi, String.fromCharCode(0xe026));
    streamText = streamText.replace(/Twitter/gi, String.fromCharCode(0xe027));
    streamText = streamText.replace(/Pinterest/gi, String.fromCharCode(0xe028));
    streamText = streamText.replace(/Tinder/gi, String.fromCharCode(0xe002));
    streamText = streamText.replace(/Notification/gi, 'Notif');
    streamText = streamText.replace(/Slack/gi, '#');
    streamText = streamText.replace(/WeChat/gi, String.fromCharCode(0xe036));
    streamText = streamText.replace(/Download/gi, String.fromCharCode(0xe039));
    streamText = streamText.replace(/Talk/gi, String.fromCharCode(0xe02e));
    streamText = streamText.replace(/Just10/gi, 'J');
    streamText = streamText.replace(/Messenger/gi, '~');
    streamText = streamText.replace(/Screenshot/gi, String.fromCharCode(0xe034));
    streamText = streamText.replace(/Google+/gi, 'G+');
    streamText = streamText.replace(/OneDrive/gi, '1Drive');
    streamText = streamText.replace(/PayPal/gi, 'PP');
    streamText = streamText.replace(/Runner/gi, String.fromCharCode(0xe02c));
    streamText = streamText.replace(/Music/gi, String.fromCharCode(0xe03c));
    streamText = streamText.replace(/Tumblr/gi, 't');
    streamText = streamText.replace(/GMail/gi, 'M');
    streamText = streamText.replace(/LinkedIn/gi, 'in');
    return streamText;
}

function findDocForThisUserKey(userKey) {
    var row = cloudantDbDocuments.rows.find(function(element) {
        return element.doc.userKey === userKey;
    });
    return row;
}

function findDocForN2wKey(n2wKey) {
    var row = cloudantDbDocuments.rows.find(function(element) {
        return element.id === n2wKey;
    });
    return row;
}

function findRecordForThisChannelLabel(records, channelLabel) {
    var record = records.find(function(element) {
        return element.channelLabel === channelLabel;
    });
    return record;
}

function getCloudantDbDocuments(query, args) {
    return new Promise(function(resolve, reject) {
        request.get({
            url: cloudantUrl + (query ? query : '') + (args ? '?' + args : ''), 
            headers: {
                'Authorization': apiKeyAuth
            }
        }, function(error, httpResponse, body) {
            if (error) {
                reject('Error calling ' + cloudantUrl + ': ' + error.message);
                return;
            }
            
            if (httpResponse && httpResponse.statusCode !== 200) {
                reject('Status code error for ' + cloudantUrl + ': ' + httpResponse.statusCode);
                return;
            }
            
            try {
                logger.info('response: ' + body);
                body = JSON.parse(body);
                if (query === '_all_docs') {
                    cloudantDbDocuments = body;
                    logger.info('cloudantDbDocuments: ' + JSON.stringify(cloudantDbDocuments));
                }
                resolve(body);
            } catch(err) {
                logger.info('Error parsing JSON response');
            }
        });
    });
}

function createCloudantDocument(doc) {
    return new Promise(function(resolve, reject) {
        logger.info('doc: ' + doc + ' ' + JSON.stringify(doc));
        request.post({
            url: cloudantUrl,
            headers: {
                'Authorization': apiKeyAuth,
                'content-type': 'application/json'
            },
            body: JSON.stringify(doc)
        }, function(error, httpResponse, body) {
            if (error) {
                reject('Error calling ' + cloudantUrl + ': ' + error.message);
                return;
            }
            
            if (httpResponse && httpResponse.statusCode !== 200) {
                reject('Status code error for ' + cloudantUrl + ': ' + httpResponse.statusCode);
                return;
            }
            
            logger.info('response: ' + body);
            resolve(doc);
            
            getCloudantDbDocuments('_all_docs', 'include_docs=true')
        });
    });
}

function testUpdateSimulatorStream() {
    logger.info('testUpdateSimulatorStream()');
    
    var apps = ['GMail', 'Facebook', 'Twitter', 'Instagram', 'Pinterest'];
//    var apps = ['Messenger', 'Slack', 'Download', 'BBM', 'LinkedIn', 'Keep'];
    var url = 'https://endpoint.vector.watch/VectorCloud/rest/v1/stream/168831F3329B917BA94173DB6A5DBDFD/webhook?msg=updateStream&n2wKey=1483848884889&streamText=' + apps.join(' ');
    logger.info('url: ' + url);
    url = encodeURI(url);
    logger.info('url: ' + url);
    
    request(url);
}
