import express from "express"
import dotenv from "dotenv"
import bodyParser from "body-parser"

import tasksIndex from "./routes/tasks"
import tasksPinned from "./routes/tasks/pinned"
import tasksSearch from "./routes/tasks/search"

import taskIndex from "./routes/task"
import newTask from "./routes/task/new"
import deleteTask from "./routes/task/delete"
import pinTask from "./routes/task/pin"
import completeTask from "./routes/task/complete"
import editTask from "./routes/task/edit"
import { prisma } from "./utils/db"
import { error } from "./utils/api"

//@ts-ignore
BigInt.prototype.toJSON = function () { return this.toString() }

dotenv.config()

const app = express()
const port = 3004
const TRACKER_SERVICE_ID = "daa8bbca-dfe0-4886-919f-5514641bc110"

//app.use(express.json())
app.use(bodyParser.json())

app.use('/*', (req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Content-Type,Authorization");
    res.header("Access-Control-Allow-Methods", "GET,HEAD,POST,PATCH,DELETE,OPTIONS")
    res.header("Access-Control-Max-Age", "86400")
    next();
});

app.use("/api/*", async (req, res, next) => {
    let enabled
    const enabledRes = (await prisma.services.findUnique({
        where: {
            id: TRACKER_SERVICE_ID
        },
        select: {
            enabled: true
        }
    }))


    if (enabledRes === undefined || enabledRes === null) {
        enabled = true
    } else {
        enabled = enabledRes.enabled
    }

    //console.log(enabledRes)

    //console.log(enabled)
    if (enabled) {
        next();
    } else {
        error(res, 403, "This service is disabled.")
    }
})

app.get('/', async (req, res) => {
    const enabled = (await prisma.services.findUnique({
        where: {
            id: TRACKER_SERVICE_ID
        },
        select: {
            enabled: true
        }
    }))?.enabled

    res.send({
        "message": (enabled ? "API is running." : "API is disabled.")
    })
})

app.post("/api/tasks", (req, res) => {
    tasksIndex(req, res)
})

app.get("/api/tasks/pinned", (req, res) => {
    tasksPinned(req, res)
})

app.post("/api/tasks/search", (req, res) => {
    tasksSearch(req, res)
})

app.post("/api/task", (req, res) => {
    taskIndex(req, res)
})

app.post("/api/task/new", (req, res) => {
    newTask(req, res)
})

app.post("/api/task/delete", (req, res) => {
    deleteTask(req, res)
})

app.post("/api/task/pin", (req, res) => {
    pinTask(req, res)
})

app.post("/api/task/complete", (req, res) => {
    completeTask(req, res)
})

app.post("/api/task/edit", (req, res) => {
    editTask(req, res)
})

app.listen(port, () => {
    console.log(`tracker service loaded, ${port}`)
})