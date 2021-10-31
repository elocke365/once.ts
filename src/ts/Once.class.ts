/*
 * The Web 4.0 ™ platform is supported by enterprise level subscription through Cerulean Circle GmbH
 *    Copyright (C) 2017  Marcel Donges (marcel@donges.it)
 *
 *    This program is free software: you can redistribute it and/or modify
 *    it under the terms of the GNU Affero General Public License as
 *    published by the Free Software Foundation, either version 3 of the
 *    License, or (at your option) any later version.
 *
 *    This program is distributed in the hope that it will be useful,
 *    but WITHOUT ANY WARRANTY; without even the implied warranty of
 *    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *    GNU Affero General Public License for more details.
 *
 *    You should have received a copy of the GNU Affero General Public License
 *    along with this program.  If not, see <https://www.gnu.org/licenses/>.
 *
      {
            license: "AGPL3.0",
            href: "http://www.gnu.org/licenses/agpl-3.0.de.html"
            coAuthors: [
                "Philipp Bartels",
                }
      }
 */

import http from "http";
import url from "url";
import express from "express";
import fs from "fs";

declare global {
  //   interface Window {
  //     ONCE: Once
  //     indow: Window& typeof globalThis

  //   }
  var ONCE: Once;
  var window: Window & typeof globalThis;
  var logger: Console;
}

enum ONCE_MODE {
  NAVIGATOR,
  I_FRAME,
  NODE_SERVER,
}

export class Once {
  private startTime: number;
  private global: typeof globalThis | undefined;
  mode: ONCE_MODE | undefined;
  state: string | undefined;
  express: any;
  private servers: any[] = [];
  private dynamicPort: number | undefined;

  static async start() {
    const ONCE = new Once();
    const logger = console;

    logger.log("starting...");
    if (typeof global === "object") {
      if (global.ONCE) {
        logger.log("ONCE is already running: " + global.ONCE.mode);
        ONCE.state = "shutdown";
        logger.log(
          "leaving uninitialized Once instance behind for garbage collection... ",
          ONCE
        );
        logger.log("This happens if you start ONCE a second time.");
        return global.ONCE;
      }

      logger.log("starting in a node environment");
      global.ONCE = ONCE;
      ONCE.mode = ONCE_MODE.NODE_SERVER;
      // TODO PB Check TS and fix if necessary™
      //   global.window = global;
      //   global.document = null;
      ONCE.global = global;
    } else {
      logger.log("not in a node environment");
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
      if (ONCE.global?.ONCE) {
        logger.log("ONCE is already running: " + ONCE.global.ONCE.mode);
        ONCE.state = "shutdown";
        logger.log(
          "leaving uninitialized Once instance behind for garbage collection... ",
          ONCE
        );
        return ONCE.global.ONCE;
      }
      logger.log("running in a Browser");
      window.ONCE = ONCE;
      ONCE.global = window;
      ONCE.mode = ONCE_MODE.NAVIGATOR;
      // }
    }
    ONCE.global.logger = console;

    await ONCE.init();
  }
  constructor() {
    this.startTime = Date.now();
  }

  async init() {
    // general init

    switch (ONCE.mode) {
      case ONCE_MODE.NAVIGATOR:
      case ONCE_MODE.I_FRAME:
        await this.initClientsideOnce();
        break;
      case ONCE_MODE.NODE_SERVER:
        await this.initServersideOnce();
        break;
    }
    logger.group("word");
  }

  async initClientsideOnce() {
    throw new Error("not implemented");
  }

  async initServersideOnce() {
    // process.on('uncaughtException', function (err) {
    //     logger.error("Unhandled exception follows");
    //     logger.error(err, err.stack);
    // })

    // Once.express.serveIndex = require('serve-index');

    ONCE.express = express();
    ONCE.express.get("/", ONCE.handleHTTPRequest);

    ONCE.servers = [];
    const httpsServer = null;
    /*
            Once.REPOSITORY_HOSTS.forEach(host => {
                ONCE.startServer(host);
            });
            */
    ONCE.dynamicPort = 8080;
    const dynamicPort = await ONCE.startServer(
      "http://localhost:" + ONCE.dynamicPort,
      ONCE.dynamicPort
    );
  }

  startServer(host: string, dynamicPort: number) {
    return new Promise((resolve, reject) => {
      const currentURL = new URL(host);
      const port = parseInt(currentURL.port, 10);
      const server = http.createServer(ONCE.express);
      server.on("error", (err: { code: string }) => {
        logger.error("XXX", err);
        if (err.code !== "EADDRINUSE") {
          //   server.state = Once.STATE_CRASHED;

          return reject(err);
        }
        logger.log("/////////////");
        if (dynamicPort) server.listen(++dynamicPort);
        logger.log(dynamicPort);
      });
      server.on("listening", () => {
        ONCE.servers.push(server);

        if (dynamicPort)
          logger.log(
            "ONCE Server listening on dynamic port: http://localhost:" +
              dynamicPort
          );
        else logger.log("ONCE Server listening on " + currentURL.toString());
        // server.state = Once.STATE_STARTED;
        ONCE.dynamicPort = dynamicPort;
        resolve(port);
      });
      server.listen(port);
    });
  }

  async handleHTTPRequest(request: any, response: any) {
    // const url = require("url");

    const path = url.parse(request.url).pathname;
    logger.log(
      "Received " + request.method + " to:",
      request.headers.host,
      path,
      "from",
      request.connection.remoteAddress
    );

    // ONCE.hostnames.add(request.headers.host);
    // ONCE.clients.add(request.connection.remoteAddress);

    // dns.reverse(request.connection.remoteAddress, function (err, hostnames) {
    //     if (err)
    //         logger.error("No problem, but:", err);
    //     else
    //         logger.log("Client hostname(s) are " + hostnames.join("; "));
    // });

    switch (request.method) {
      case "GET":
        switch (path) {
          case "/":
            ONCE.renderHTML("src/html/Once.html", "text/html", response);
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
            response.write("Route not defined: " + path);
            response.end();
        }
        break;
    }
  }

  renderHTML(path: any, contentType: any, response: any) {
    // const fs = require("fs");

    const thePath = path;
    fs.readFile(path, null, (error: any, data: any) => {
      if (error) {
        response.writeHead(404);
        response.write("File " + thePath + " not found!");
        logger.error("File " + thePath + " not found!");
      } else {
        response.writeHead(200, {
          "Content-Type": contentType,
        });
        response.write(data);
      }
      response.end();
    });
  }
}

Once.start();
