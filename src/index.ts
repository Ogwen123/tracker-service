import express from "express";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import { prisma } from "./utils/db";
import { error } from "./utils/api";

import tasksIndex from "./routes/tasks";
import tasksPinned from "./routes/tasks/pinned";
import tasksSearch from "./routes/tasks/search";

import taskIndex from "./routes/task";
import newTask from "./routes/task/new";
import deleteTask from "./routes/task/delete";
import pinTask from "./routes/task/pin";
import completeTask from "./routes/task/complete";
import editTask from "./routes/task/edit";

import newLink from "./routes/link/new";

import allLinks from "./routes/links/all";

import newLinkType from "./routes/link/type/new";
import deleteLinkType from "./routes/link/type/delete";

import newClassType from "./routes/link/class/new";
import deleteClassType from "./routes/link/class/delete";
import { verifyToken } from "./utils/token";
import type { TokenData } from "./global/types";

//@ts-ignore
BigInt.prototype.toJSON = function () {
    return this.toString();
};

declare global {
    namespace Express {
        interface Request {
            user: TokenData;
        }
    }
}

dotenv.config();

const app = express();
const port = 3004;
const TRACKER_SERVICE_ID = "daa8bbca-dfe0-4886-919f-5514641bc110";

app.use(bodyParser.json());

app.use((req, res, next) => {
    // CORS middleware
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Content-Type,Authorization");
    res.header(
        "Access-Control-Allow-Methods",
        "GET,HEAD,POST,PATCH,DELETE,OPTIONS",
    );
    res.header("Access-Control-Max-Age", "86400");
    next();
});

app.use("/api/", async (req, res, next) => {
    const token = req.get("Authorization")?.split(" ")[1];

    if (token === undefined) {
        error(res, 401, "Invalid token");
        return;
    }

    const tokenRes = await verifyToken(token);

    if (tokenRes === false) {
        error(res, 401, "This is not a valid token.");
        return;
    }

    req.user = tokenRes.data;
    next();
});

app.use("/", async (req, res, next) => {
    // check if the service is disabled middleware
    let enabled;
    const enabledRes = await prisma.services.findUnique({
        where: {
            id: TRACKER_SERVICE_ID,
        },
        select: {
            enabled: true,
        },
    });

    if (enabledRes === undefined || enabledRes === null) {
        enabled = true;
    } else {
        enabled = enabledRes.enabled;
    }

    if (enabled) {
        next();
    } else {
        error(res, 403, "This service is disabled.");
    }
});

app.get("/", async (req, res) => {
    res.send({
        message: "The service is running.",
    });
});

app.post("/api/tasks", (req, res) => {
    tasksIndex(req, res);
});

app.get("/api/tasks/pinned", (req, res) => {
    tasksPinned(req, res);
});

app.post("/api/tasks/search", (req, res) => {
    tasksSearch(req, res);
});

app.post("/api/task", (req, res) => {
    taskIndex(req, res);
});

app.post("/api/task/new", (req, res) => {
    newTask(req, res);
});

app.post("/api/task/delete", (req, res) => {
    deleteTask(req, res);
});

app.post("/api/task/pin", (req, res) => {
    pinTask(req, res);
});

app.post("/api/task/complete", (req, res) => {
    completeTask(req, res);
});

app.post("/api/task/edit", (req, res) => {
    editTask(req, res);
});

app.post("/api/link", (req, res) => {
    newLink(req, res);
});

app.get("/api/links/all", (req, res) => {
    allLinks(req, res);
});

app.post("/api/link/type", (req, res) => {
    newLinkType(req, res);
});

app.delete("/api/link/type", (req, res) => {
    deleteLinkType(req, res);
});

app.post("/api/link/class", (req, res) => {
    newClassType(req, res);
});

app.delete("/api/link/class", (req, res) => {
    deleteClassType(req, res);
});

app.listen(port, () => {
    console.log(`tracker service loaded, ${port}`);
});
