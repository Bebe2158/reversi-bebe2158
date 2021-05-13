/******************************/
/* set up static file */
let static = require ('node-static');

/* set up http file */
let http = require('http');

/* assume we are running */
let port = process.env.PORT;
let directory = __dirname + '/public';

/* if not */
if ((typeof port == 'undefined') || (port === null)) {
    port = 8080;
    directory = './public';
}

/* set up static fil server */
let file = new static.Server(directory);

let app = http.createServer(
    function(request,response){
        request.addListener('end',
            function(){
                file.serve(request,response);
            }
        ).resume();
    }
).listen(port);

console.log('The server is running');