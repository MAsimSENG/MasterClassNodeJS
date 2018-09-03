/*
* This is the primary file for the api
*
*/

// dependencies (imports)

var http = require ('http');
var https = require ('https');
var url = require ('url');
var StringDecoder = require ('string_decoder').StringDecoder;
var config = require ('./config.js');
var fs = require ('fs');

// We are instantiating the http server

  var httpServer = http.createServer( function(req,res) {
      unifiedServer(req,res);
});



// start the server
var httpServerOptions = {
    'key' : fs.readFileSync('./https/key.pem')  ,
    'cert': fs.readFileSync('./https/cert.pem')
};
httpServer.listen(config.httpPort, function(){
    console.log("The server is listening on port  "+config.httpPort);
});

// instantiate https server

  var httpsServer = https.createServer (httpServerOptions, function( req,res){

      unifiedServer(req,res);
  });

  // start the https server
  httpsServer.listen(config.httpsPort, function(){
      console.log("The server is listening on port  "+config.httpsPort);
  });


var unifiedServer = function( req, res)  {
  // get url and parse it
  var parsedurl= url.parse(req.url,true);

  // get path from url
  var path = parsedurl.pathname;
  var trimmedPath = path.replace(/^\/+|\/+$/g, '');
  // get the query string as an object
  var queryStringObject = parsedurl.query;

  //get the http method used
  var method = req.method.toLowerCase();

  // get the headers as an object
  var headers = req.headers;
  // get payload if any
  var decoder = new StringDecoder('utf-8');
  var buffer = "";
  req.on('data', function(data){
    buffer+=decoder.write(data);
  });
  req.on('end',function(){
    buffer+=decoder.end();
    //choose the handler this request should go to (if type of router is not undefined then chandler= router[trim] else handlers.notfound)
    var chosenHandler = typeof (router[trimmedPath])!== 'undefined'? router[trimmedPath]: handlers.notfound;
    // construct the data object to send to the handler
    var data = {
      'trimmedPath': trimmedPath,
      'queryStringObject': queryStringObject,
      'method': method,
      'headers': headers,
      'buffer':buffer
    };
    // route the request to the handler specified in the router
    chosenHandler(data,function(statusCode,payload) {
      // use the status code called back by the handler or use default
      statusCode= typeof(statusCode)== 'number'? statusCode:200;

      // use the payload called back by the handler or default to empty object
      payload = typeof(payload)=='object' ? payload : {};
      // conver the payload to a string
      var payloadString = JSON.stringify(payload);
      // return the response
      res.setHeader('content-type','application/JSON');
      res.writeHead(statusCode);
      res.end(payloadString);

    // Log the request path
     console.log("Request this response",statusCode,payloadString);
    });


  });
}


//define handlers
var handlers = {};
handlers.ping = function (data,callback) {
  callback(200);
};
// not found handler
handlers.notfound = function(data,callback) {
  callback(404);
};
// defining a request router
var router= {
  'ping' : handlers.ping

};
