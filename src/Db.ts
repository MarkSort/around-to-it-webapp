import { DBSchema, IDBPDatabase, openDB } from 'idb/with-async-ittr'
import { TaskScheduleType, TaskScheduleStatusString } from './lib'

export default class Db {

  db: IDBPDatabase<AtiDBSchema>

  constructor(db: IDBPDatabase<AtiDBSchema>) {
    this.db = db
  }

  static async build(): Promise<Db> {
    console.log('if db errors, delete with \n    indexedDB.deleteDatabase(\'ati\')\nand refresh')
    const db = await openDB<AtiDBSchema>('ati', 1, {
      upgrade(db, oldVersion, newVersion, _transaction) {
        console.log(`openDB upgrade ${oldVersion} to ${newVersion}`)

        const taskScheduleStore = db.createObjectStore(TaskSchedulesStoreName, {
          keyPath: 'id',
          autoIncrement: true,
        })
        taskScheduleStore.createIndex('by-type', 'type')

        const taskScheduleStatusStore = db.createObjectStore(TaskScheduleStatusesStoreName, {
          autoIncrement: true,
        })
        taskScheduleStatusStore.createIndex('by-id', 'id')
        taskScheduleStatusStore.createIndex('by-changedAt', 'changedAt')
        taskScheduleStatusStore.createIndex('by-idAndChangedAt', 'idAndChangedAt')
      },
      blocked() {
        console.warn('openDB blocked')
      },
      blocking() {
        console.warn('openDB blocking')
      },
      terminated() {
        console.warn('openDB terminated')
      },
    })

    return new Db(db)
  }

  getAllTaskSchedules(): Promise<DBTaskSchedule[]> {
    return this.db.getAll(TaskSchedulesStoreName)
  }

  async addTaskSchedule(title: string, type: TaskScheduleType): Promise<void> {
    const dbTaskSchedule = {
      title,
      type,
    }
    await this.db.add(TaskSchedulesStoreName, dbTaskSchedule)
  }

  async updateTaskSchedule(taskSchedule: DBTaskSchedule): Promise<void> {
    await this.db.put(TaskSchedulesStoreName, taskSchedule)
  }

  async deleteTaskSchedule(id: number): Promise<void> {
    console.log(`db delete ${id}`)
    await this.db.delete(TaskSchedulesStoreName, id)
  }

  async addTaskScheduleStatus(id: number, status: TaskScheduleStatusString): Promise<void> {
    const changedAt = new Date()
    const dbTaskScheduleStatus = {
      id,
      changedAt,
      idAndChangedAt: `${id} ${changedAt.valueOf()}`,
      status
    }
    await this.db.add(TaskScheduleStatusesStoreName, dbTaskScheduleStatus)
  }

  async getTaskScheduleStatus(id: number): Promise<DBTaskScheduleStatus | undefined> {
    return this.db.transaction(TaskScheduleStatusesStoreName).store.index('by-id').get(id)
  }

  async getTodayTaskScheduleStatus(id: number/*, day: Date*/): Promise<DBTaskScheduleStatus | undefined> {
    /* TODO */ const day = new Date()
    day.setHours(0)
    day.setMinutes(0)
    day.setSeconds(0)
    day.setMilliseconds(0)

    const nextDay = new Date(day.valueOf())
    nextDay.setDate(nextDay.getDate() + 1)

    const range = IDBKeyRange.bound(
      `${id} ${day.valueOf()}`,
      `${id} ${nextDay.valueOf()}`,
      false,
      true
    )
    return this.db.transaction(TaskScheduleStatusesStoreName).store.index('by-idAndChangedAt').get(range)
  }

}

const TaskSchedulesStoreName = "taskSchedules"
const TaskScheduleStatusesStoreName = "taskScheduleStatuses"

interface AtiDBSchema extends DBSchema {
  [TaskSchedulesStoreName]: {
    key: number
    value: DBTaskSchedule
    indexes: { 'by-type': TaskScheduleType }
  },
  [TaskScheduleStatusesStoreName]: {
    key: number
    value: DBTaskScheduleStatus
    indexes: {
      'by-id': number // example: find all changes for a certain taskSchedule
      'by-changedAt': Date // example: find all taskSchedules changed today
      'by-idAndChangedAt': string // example: find if certain taskSchedule changed today
    }
  }
}

type DBTaskSchedule = {
  id?: number
  title: string
  type: TaskScheduleType
}

type DBTaskScheduleStatus = {
  id: number
  changedAt: Date
  idAndChangedAt: string
  status: TaskScheduleStatusString
}
