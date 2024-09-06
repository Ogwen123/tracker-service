import type { RawTask, RepeatOptions, Task } from "../global/types"
import { now } from "./utils"

export const calcThreshold = (task: RawTask) => {
    // everything is timed off the start of the week and the unix epoch is on a thursday so required a new one that is a monday
    const EPOCH = 1720396800 // midnight on monday (8/7/24)
    const SECONDS_IN_WEEK = 60 * 60 * 24 * 7
    const SECONDS_IN_FORTNIGHT = 60 * 60 * 24 * 7 * 2

    if (task.repeat_period === "WEEK") {
        const time = now() - EPOCH
        const timeIntoWeek = time % SECONDS_IN_WEEK

        const resetPoint = time - timeIntoWeek

        return resetPoint + EPOCH

    } else if (task.repeat_period === "FORTNIGHT") {
        // calculate timestamp for the midnight on the monday of the week the task was created on
        const creationTimestamp = Math.round(Date.parse(task.created_at).valueOf() / 1000)
        const weekOfCreationEpoch = creationTimestamp - ((creationTimestamp - EPOCH) % SECONDS_IN_WEEK)

        const time = now() - weekOfCreationEpoch
        const timeIntoFortnight = time % SECONDS_IN_FORTNIGHT

        const resetPoint = time - timeIntoFortnight

        return resetPoint + weekOfCreationEpoch

    } else {
        return 0
    }
}

export const isCompleted = (task: RawTask) => {
    if (!task.task_completions || task.task_completions.length === 0) return false
    if (task.repeat_period === "NEVER") {
        return true // function won't be run if there is not at least one completion so can just return true here
    } else {
        // calculate date of completion reset
        let threshold = calcThreshold(task)

        console.log(task.name + ": " + threshold)
        if (task.task_completions[0].completed_at > threshold) {
            return true
        } else {
            return false
        }
    }
}

export const addCompletionData = (tasks: RawTask[]) => {
    let filtered: any[] = []

    tasks.forEach((task, _) => {
        // if a task set to never repeat is completed then do not show it on the task page
        if (task.repeat_period === "NEVER" && task.task_completions && task.task_completions.length > 0) return false
        filtered.push({
            ...task,
            completed: isCompleted(task),
            completions: (task.task_completions ? task.task_completions.length : 0)
        })
    })

    return filtered
}