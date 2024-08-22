import Joi from "joi"
import express from "express"
import config from "../../config.json"
import { is_completed, iso, validate } from "../../utils/utils"
import { error, success } from "../../utils/api"
import { verifyToken } from "../../utils/token"
import type { RepeatOptions, TokenData } from "../../global/types"
import { prisma } from "../../utils/db"

export default async (req: express.Request, res: express.Response) => {

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

    const results = await prisma.tasks.findMany({
        where: {
            user_id: validToken.id,
            pinned: true
        },
        include: {
            task_completions: {
                orderBy: {
                    completed_at: "desc"// newest first
                }
            }
        }
    })

    const i = results.map((task) => {
        return {
            ...task,
            completed: task.task_completions.length === 0
                ?
                false
                :
                is_completed(task),
            completions: task.task_completions.length
        }
    })

    success(res, i, "Successfully fetched pinned tasks.", 200)
}