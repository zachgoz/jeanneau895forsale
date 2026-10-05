// TEST ONLY: serves the static export with an injected mailer that never sends email.
import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { createContactHandler } = require("../functions/lib/contact.js");
const handleContact = createContactHandler({
  emulator: true,
  getConfiguration: () => ({
    toEmail: "owner@example.com",
    fromEmail: "sender@example.com",
  }),
  sendEmail: async () => ({ id: "local-test-acceptance" }),
});
const types = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".jpg": "image/jpeg",
  ".xml": "application/xml",
  ".txt": "text/plain",
};
const publicRoot = path.resolve("out");
http
  .createServer(async (request, response) => {
    try {
      const pathname = new URL(request.url, "http://127.0.0.1:5003").pathname;
      if (pathname === "/api/contact") {
        const chunks = [];
        for await (const chunk of request) {
          chunks.push(chunk);
          if (Buffer.concat(chunks).length > 16384) {
            response.writeHead(413);
            response.end();
            return;
          }
        }
        const rawBody = Buffer.concat(chunks);
        let body;
        try {
          body = JSON.parse(rawBody.toString());
        } catch {
          body = {};
        }
        const wrapped = {
          set: (key, value) => {
            response.setHeader(key, value);
            return wrapped;
          },
          status: (code) => {
            response.statusCode = code;
            return wrapped;
          },
          json: (value) => {
            response.setHeader("Content-Type", "application/json");
            response.end(JSON.stringify(value));
          },
        };
        await handleContact(
          {
            path: pathname,
            method: request.method,
            body,
            rawBody,
            get: (key) => request.headers[key.toLowerCase()],
          },
          wrapped,
        );
        return;
      }
      let file = path.resolve(publicRoot, "." + decodeURIComponent(pathname));
      if (file !== publicRoot && !file.startsWith(publicRoot + path.sep)) {
        response.writeHead(403);
        response.end();
        return;
      }
      if (pathname.endsWith("/")) file = path.join(file, "index.html");
      const contents = await fs.readFile(file);
      response.setHeader(
        "Content-Type",
        types[path.extname(file)] || "application/octet-stream",
      );
      response.end(contents);
    } catch {
      response.writeHead(404);
      response.end("Not found");
    }
  })
  .listen(5003, "127.0.0.1", () =>
    console.log(
      "TEST ONLY preview: http://127.0.0.1:5003 (mock mail acceptance; no email delivery)",
    ),
  );
