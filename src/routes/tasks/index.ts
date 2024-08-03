import Joi from "joi"
import express from "express"
import config from "../../config.json"
import { iso, validate } from "../../utils/utils"
import { error, success } from "../../utils/api"
import { verifyToken } from "../../utils/token"
import type { Task, TokenData } from "../../global/types"
import { prisma } from "../../utils/db"

const SCHEMA = Joi.object({
    page: Joi.number().required().min(0)
})

export default async (req: express.Request, res: express.Response) => {
    // validate the request body
    const valid = validate(SCHEMA, req.body || {})

    if (valid.error) {
        error(res, 400, valid.data)
        return
    }

    const data = valid.data

    const token = req.get("Authorization")?.split(" ")[1]

    if (token === undefined) {
        error(res, 401, "Invalid token")
        return
    }

    const tokenRes = await verifyToken(token)

    if (tokenRes === false) {
        error(res, 401, "This is not a valid token.")
        return
    }

    const validToken: TokenData = tokenRes.data

    const pageSize = config.taskPageSize || 20

    const tasks = await prisma.tasks.findMany({ // add filtering to not take never repeats that have been completed
        skip: data.page * pageSize,
        take: pageSize,
        where: {
            user_id: validToken.id
        }
    })

    let filtered: any[] = []

    tasks.forEach((task, _) => {
        filtered.push({
            ...task,
            completed: false,
            completions: 1
        })
    })

    success(res, filtered, "Successfully fetched tasks.", 200)
}