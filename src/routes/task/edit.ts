import Joi from "joi"
import express from "express"
import { iso, validate } from "../../utils/utils"
import { error, success } from "../../utils/api"
import { verifyToken } from "../../utils/token"
import type { TokenData } from "../../global/types"
import { prisma } from "../../utils/db"
import { isCompleted, calcEndThreshold } from "../../utils/tasks"

const SCHEMA = Joi.object({
    id: Joi.string().required(),
    name: Joi.string().required(),
    repeat_period: Joi.string().allow("WEEK", "FORTNIGHT", "MONTH").required(),
    date_time: Joi.boolean().required(),
    day: Joi.string().allow("MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"),
    hour: Joi.number(),
    minute: Joi.number(),
    week_of_repeat_period: Joi.string().allow("FIRST", "SECOND", "THIRD", "FOURTH"),
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

    if (data.name.includes("*")) {
        error(res, 400, "Asterik is a reserved character and cannot be used in task names.")
        return
    }

    await prisma.tasks.update({
        where: {
            id: data.id
        },
        data: {
            name: data.name,
            repeat_period: data.repeatPeriod,
            date_time: data.date_time,
            day: data.day || null,
            hour: data.hour !== undefined ? data.hour : null,
            minute: data.minute !== undefined ? data.minute : null,
            week_of_repeat_period: data.week_of_repeat_period || null,
        }
    }).catch((e) => {
        console.log(e)
        error(res, 400, "An error occured while creating the task.")
    })

    const task = await prisma.tasks.findUnique({
        where: {
            id: data.id,
            user_id: validToken.id
        },
        include: {
            task_completions: {
                orderBy: {
                    completed_at: "desc"// newest first
                },
                take: 10
            }
        }
    })

    if (task === null) {
        error(res, 400, "This task does not exist")
        return
    }

    const extendedTask = {
        ...task,
        completed: isCompleted(task),
        completions: task.task_completions.length,
        threshold: calcEndThreshold(task)
    }

    success(res, extendedTask, "Successfully created task.", 200)
}