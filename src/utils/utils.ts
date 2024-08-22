import Joi from "joi"
import type { RepeatOptions, TaskCompletion } from "../global/types"

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

export const is_completed = (latest_completion: TaskCompletion, repeat_period: RepeatOptions) => {
    if (repeat_period === "NEVER") {
        return true // function won't be run if there is not at least one completion so can just return true here
    } else {
        // calculate date of completion reset
        let threshold = 0
        const EPOCH = 1724025600 // midnight on monday (19/8/24)

        if (repeat_period === "WEEK") {
            const SECONDS_IN_WEEK = 60 * 60 * 24 * 7

            const time = now() - EPOCH
            const time_into_week = time % SECONDS_IN_WEEK

            const reset_point = time - time_into_week

            threshold = reset_point + EPOCH
            console.log(threshold)
        }
    }
}