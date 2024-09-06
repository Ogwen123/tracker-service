import Joi from "joi"
import express from "express"
import config from "../../config.json"
import { isCompleted } from "../../utils/tasks"
import { validate } from "../../utils/utils"
import { error, success } from "../../utils/api"
import { verifyToken } from "../../utils/token"
import type { RepeatOptions, TokenData } from "../../global/types"
import { prisma } from "../../utils/db"

const SCHEMA = Joi.object({
    id: Joi.string().required()
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

    const task = await prisma.tasks.findUnique({
        where: {
            id: data.id,
            user_id: validToken.id
        },
        include: {
            task_completions: {
                orderBy: {
                    completed_at: "desc"// newest first
                }
            }
        }
    })

    if (task === null) {
        error(res, 400, "This task does not exist")
        return
    }

    const i = {
        ...task,
        completed: isCompleted(task),
        completions: task.task_completions.length
    }

    success(res, i, "Successfully fetched tasks.", 200)
}