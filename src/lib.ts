export type TaskSchedule = {
  id: number
  title: string
  type: TaskScheduleType
  order: number
  active: boolean
}

export enum TaskScheduleType {
  Daily,
  Once,
}

export type TaskScheduleStatusString = 'completed' | 'skipped' | 'missed'
