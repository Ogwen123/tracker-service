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
    // everything is timed off the start of the week and the unix epoch is on a thursday so required a new one that is a monday
    const EPOCH = 1720396800 // midnight on monday (8/7/24)
    const SECONDS_IN_WEEK = 60 * 60 * 24 * 7
    const SECONDS_IN_FORTNIGHT = 60 * 60 * 24 * 7 * 2

    if (task.repeat_period === "WEEK") {
        const time = now() - EPOCH
        const time_into_week = time % SECONDS_IN_WEEK

        const reset_point = time - time_into_week

        return reset_point + EPOCH
    } else if (task.repeat_period === "FORTNIGHT") {
        // midnight on the monday of the week the task was created in
        const creation_timestamp = Math.round(Date.parse(task.created_at).valueOf() / 1000)
        const weeks_since_creation = Math.floor((creation_timestamp - EPOCH) / SECONDS_IN_WEEK)
        const week_of_creation_epoch = creation_timestamp - ((creation_timestamp - EPOCH) % SECONDS_IN_WEEK)

        const time = now() - week_of_creation_epoch
        const time_into_fortnight = time % SECONDS_IN_FORTNIGHT

        console.log(week_of_creation_epoch)
        console.log(time)
        console.log(time_into_fortnight)

        const reset_point = time - time_into_fortnight

        return reset_point + week_of_creation_epoch

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

        console.log(task.name + ": " + threshold)
        if (task.task_completions[0].completed_at > threshold) {
            return true
        } else {
            return false
        }
    }
}