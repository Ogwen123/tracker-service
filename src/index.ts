import express from "express"
import dotenv from "dotenv"
import bodyParser from "body-parser"

import newTask from "./routes/task/new"

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

app.listen(port, () => {
    console.log(`tracker service loaded, ${port}`)
})