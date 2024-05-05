/********************************************************************
 * Basic proxy that enables you to preview the local custom.js
 * in a Primo site. Set your Primo base URL in a PROXY_TARGET
 * environment variable.
 ********************************************************************/
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import {
  createProxyMiddleware,
  responseInterceptor,
} from "http-proxy-middleware";
import "dotenv/config";

const app = express();
const target = process.env.PROXY_TARGET;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const defaultProxy = createProxyMiddleware({
  target,
  changeOrigin: true,
});

const configProxy = createProxyMiddleware(
  ["/primaws/rest/pub/configuration/vid/*"],
  {
    target,
    changeOrigin: true,
    selfHandleResponse: true,
    onProxyRes: responseInterceptor((resBuffer) => {
      if (resBuffer.length === 0) return resBuffer;
      try {
        const appConfig = JSON.parse(resBuffer.toString("utf8"));
        appConfig.customization.viewJs = "/custom.js";
        return JSON.stringify(appConfig);
      } catch (e) {
        console.error(e);
      }
    }),
  }
);

// this should work with SAML, but I'm not sure about other auth schemes
const loginProxy = createProxyMiddleware(
  ["/primaws/suprimaLogin", "/primaws/suprimaExtLogin"],
  {
    target,
    changeOrigin: true,
    followRedirects: true,
    onProxyReq(_, req, res) {
      res.writeHead(302, { location: target + req.url });
    },
  }
);

app.use("/custom.js", (_, res) =>
  res.sendFile(path.resolve(__dirname, "custom.js"))
);

app.use("/", loginProxy, configProxy, defaultProxy);

app.listen(3000);
