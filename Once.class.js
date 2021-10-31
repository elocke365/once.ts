class Once {
    static async start() {
        let ONCE = new Once();
        ONCE.startTime = Date.now();
        const logger = console;

        console.log("starting...");
        if (typeof global === 'object') {
            if (global.ONCE) {
                logger.log("ONCE is already running: " + global.ONCE.mode);
                ONCE.state = "shutdown";
                logger.log("leaving uninitialized Once instance behind for garbage collection... ", ONCE);
                logger.log("This happens if you start ONCE a second time.");
                return global.ONCE;
            }

            console.log("starting in a node environment");
            global.ONCE = ONCE;
            ONCE.mode = "nodeServer";
            global.window = global;
            global.document = null;
            ONCE.global = global;
        }
        else {
            console.log("not in a node environment");
            // if (ONCE.global.frameElement && iframeSupport) {
            //     logger.log("running in an iFrame");
            //     var rootWindow = ONCE.global.frameElement.contentONCE.global.parent;
            //     ONCE = rootONCE.global.ONCE;
            //     Namespaces = rootONCE.global.Namespaces;
            //     var UcpComponentSupport = rootONCE.global.UcpComponentSupport;
            //     ONCE.global.frameElement.onload = UcpComponentSupport.onload.bind(UcpComponentSupport);
            //     logger.log("iFrame initialized");
            //     ONCE.mode = "iFrame";
            // } else {
            if (ONCE.global.ONCE) {
                logger.log("ONCE is already running: " + ONCE.global.ONCE.mode);
                ONCE.state = "shutdown";
                logger.log("leaving uninitialized Once instance behind for garbage collection... ", ONCE);
                return ONCE.global.ONCE;
            }
            console.log("running in a Browser");
            window.ONCE = ONCE;
            ONCE.global = window;
            ONCE.mode = "navigator";
            // }
        }
        ONCE.global.logger = console;

        await ONCE.init();

    }
    constructor() { }

    async init() {
        //general init        


        switch (ONCE.mode) {
            case Once.MODE_NAVIGATOR:
            case Once.MODE_I_FRAME:
            case "navigator":
                await this.initClientsideOnce();
                break;
            case Once.MODE_NODE_SERVER:
            case "nodeServer":
                await this.initServersideOnce();
                break;
        }
        console.group("word")
    }

    async initClientsideOnce() {

    }

    async initServersideOnce() {
        // process.on('uncaughtException', function (err) {
        //     logger.error("Unhandled exception follows");
        //     logger.error(err, err.stack);
        // })

        ONCE.global.url = require('url');      
        ONCE.global.fs = require('fs');
          
        Once.express = require('express');
        Once.http = require('http');

        // Once.express.serveIndex = require('serve-index');

        ONCE.experss = Once.express();
        ONCE.experss.get('/', ONCE.handleHTTPRequest);

        
        ONCE.servers = [];
        let httpsServer = null;
        /*
            Once.REPOSITORY_HOSTS.forEach(host => {
                ONCE.startServer(host);
            });
            */
        ONCE.dynamicPort = 8080;
        let dynamicPort = await ONCE.startServer("http://localhost:" + ONCE.dynamicPort, ONCE.dynamicPort);

    }

    startServer(host, dynamicPort) {
        return new Promise((resolve, reject) => {
            const currentURL = new URL(host);
            const port = parseInt(currentURL.port);
            const server = Once.http.createServer(ONCE.experss);
            server.on('error', (err) => {
                logger.error('XXX', err);
                if (err.code !== 'EADDRINUSE') {
                    server.state = Once.STATE_CRASHED;

                    return reject(err)
                }
                logger.log('/////////////');
                if (dynamicPort)
                    server.listen(++dynamicPort)
                logger.log(dynamicPort)
            }
            )
            server.on('listening', () => {
                ONCE.servers.push(server);

                if (dynamicPort)
                    logger.log("ONCE Server listening on dynamic port: http://localhost:" + dynamicPort);
                else
                    logger.log("ONCE Server listening on " + currentURL.toString());
                server.state = Once.STATE_STARTED;
                ONCE.dynamicPort = dynamicPort;
                resolve(port);
            })
            server.listen(port)
        }
        )
    }

    async handleHTTPRequest(request, response) {
        var path = url.parse(request.url).pathname;
        logger.log("Received " + request.method + " to:", request.headers.host, path, "from", request.connection.remoteAddress);
        
        //ONCE.hostnames.add(request.headers.host);
        //ONCE.clients.add(request.connection.remoteAddress);
        
        // dns.reverse(request.connection.remoteAddress, function (err, hostnames) {
        //     if (err)
        //         logger.error("No problem, but:", err);
        //     else
        //         logger.log("Client hostname(s) are " + hostnames.join("; "));
        // });

        switch (request.method) {
            case 'GET':
                switch (path) {
                    case '/':
                        ONCE.renderHTML('Once.html', 'text/html', response);
                        break;
                    // case '/test':
                    //     response.redirect(ONCE.path + '/test/html/Once.mochaTest.html');
                    //     //ONCE.renderHTML(ONCE.basePath + '/test/html/Once.mochaTest.html', 'text/html', response);
                    //     break;
                    // case "/once/env":
                    //     response.writeHead(200, {
                    //         'Content-Type': "application/json"
                    //     });

                    //     // Marcel: does not work over the ngx proxy on test.wo-da.de   will fallback to http and the produce a cors error 20210804

                    //     // let clientEnv = {};
                    //     // Object.assign(clientEnv, ONCE.ENV);
                    //     // clientEnv.ONCE_DEFAULT_URL = request.protocol + '://' + request.headers.host;

                    //     response.write(JSON.stringify(ONCE.ENV));
                    //     response.end();
                    //     break;
                    // case '/favicon.ico':
                    //     ONCE.renderHTML(ONCE.repositoryRootPath + Once.REPOSITORY_ROOT + '/favicon.ico', 'image/x-icon', response);
                    //     break;
                    // /*
                    //                 case Once.REPOSITORY_ROOT:
                    //                     ONCE.renderHTML('./login.html', response);
                    //                     break;
                    //     */
                    default:
                        response.writeHead(404);
                        response.write('Route not defined: ' + path);
                        response.end();

                }
                break;
        }
    }

    renderHTML(path, contentType, response) {
        let thePath = path;
        fs.readFile(path, null, (error, data) => {
            if (error) {
                response.writeHead(404);
                response.write('File ' + thePath + ' not found!');
                logger.error('File ' + thePath + ' not found!');
            } else {
                response.writeHead(200, {
                    'Content-Type': contentType
                });
                response.write(data);
            }
            response.end();
        }
        );
    }
}

Once.start();