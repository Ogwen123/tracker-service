import express from "express"
import dotenv from "dotenv"
import bodyParser from "body-parser"

import tasksIndex from "./routes/tasks/index"
import tasksPinned from "./routes/tasks/pinned"

import newTask from "./routes/task/new"
import deleteTask from "./routes/task/delete"
import pinTask from "./routes/task/pin"

//@ts-ignore
BigInt.prototype.toJSON = function () { return this.toString() }

dotenv.config()

const app = express()
const port = 3004

//app.use(express.json())
app.use(bodyParser.json())

app.use('/*', (req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Content-Type,Authorization");
    res.header("Access-Control-Allow-Methods", "GET,HEAD,POST,PATCH,DELETE,OPTIONS")
    res.header("Access-Control-Max-Age", "86400")
    next();
});

app.get("/", (req, res) => {
    res.send({ "message": "api is running" })
})

app.post("/api/task/new", (req, res) => {
    newTask(req, res)
})

app.post("/api/tasks", (req, res) => {
    tasksIndex(req, res)
})

app.get("/api/tasks/pinned", (req, res) => {
    tasksPinned(req, res)
})

app.post("/api/task/delete", (req, res) => {
    deleteTask(req, res)
})

app.post("/api/task/pin", (req, res) => {
    pinTask(req, res)
})

app.listen(port, () => {
    console.log(`tracker service loaded, ${port}`)
})