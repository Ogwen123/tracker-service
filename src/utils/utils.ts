import Joi from "joi"
import type { RawTask, RepeatOptions, Task, TaskCompletion } from "../global/types"

export const now = (): number => {
    return Math.floor(Date.now() / 1000) // get unix seconds
}

export const iso = (): string => {
    return (new Date()).toISOString()
}

export const validate = (schema: Joi.Schema, data: any) => {
    const validate = schema.validate(data, { abortEarly: false })

    if (validate.error) {
        return {
            error: true,
            data: validate.error.details.map((error) => {
                return error.message
            })
        }
    }
    return {
        error: false,
        data: validate.value
    }
}

export const calc_threshold = (task: RawTask) => {
    const EPOCH = 1724025600 // midnight on monday (19/8/24)

    if (task.repeat_period === "WEEK") {
        const SECONDS_IN_WEEK = 60 * 60 * 24 * 7

        const time = now() - EPOCH
        const time_into_week = time % SECONDS_IN_WEEK

        const reset_point = time - time_into_week

        return reset_point + EPOCH
    } else {
        return 0
    }
}

export const is_completed = (task: RawTask) => {
    if (!task.task_completions) return
    if (task.repeat_period === "NEVER") {
        return true // function won't be run if there is not at least one completion so can just return true here
    } else {
        // calculate date of completion reset
        let threshold = calc_threshold(task)

        console.log(threshold)
        if (task.task_completions[0].completed_at > threshold) {
            return true
        } else {
            return false
        }
    }
}