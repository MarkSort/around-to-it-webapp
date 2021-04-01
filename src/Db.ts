import { DBSchema, deleteDB, IDBPDatabase, openDB } from 'idb/with-async-ittr'
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
        taskScheduleStore.createIndex('by-typeAndOrder', ['type', 'order'], { unique: true })

        const taskScheduleStatusStore = db.createObjectStore(TaskScheduleStatusesStoreName, {
          autoIncrement: true,
        })
        taskScheduleStatusStore.createIndex('by-id', 'id')
        taskScheduleStatusStore.createIndex('by-changedAt', 'changedAt')
        taskScheduleStatusStore.createIndex('by-idAndChangedAt', ['id', 'changedAt'])
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

  static async deleteDatabase(): Promise<void> {
    await deleteDB('ati')
  }

  async getAllTaskSchedules(): Promise<DBTaskSchedule[]> {
    const taskSchedules = []

    let cursor = await this.db.transaction(TaskSchedulesStoreName, 'readwrite').store.index('by-typeAndOrder').openCursor()
    while (cursor != null) {
      taskSchedules.push(cursor.value)
      cursor = await cursor.continue()
    }

    return taskSchedules
  }

  async addTaskSchedule(title: string, type: TaskScheduleType): Promise<void> {
    const range = IDBKeyRange.bound(
      [type, 0],
      [type + 1, 0],
      false,
      true,
    )
    const store = this.db.transaction(TaskSchedulesStoreName, 'readwrite').store
    const cursor = await store.index('by-typeAndOrder').openCursor(range, 'prev')

    let order
    if (cursor == null) {
      order = 0
    } else if (cursor.value.order != null) {
      order = cursor.value.order + 1
    }

    if (order == null) throw new Error('could not determine order for new TaskSchedule')

    const dbTaskSchedule = {
      title,
      type,
      order,
    }
    await store.add(dbTaskSchedule)
  }

  async moveTaskSchedule(type: TaskScheduleType, oldOrder: number, newOrder: number): Promise<void> {
    if (oldOrder === newOrder) throw new Error('oldOrder === newOrder')

    const tempOrderRange = IDBKeyRange.bound(
      [type, 0],
      [type + 1, 0],
      false,
      true,
    )
    const store = this.db.transaction(TaskSchedulesStoreName, 'readwrite').store
    const lastTaskSchedule = await store.index('by-typeAndOrder').openCursor(tempOrderRange, 'prev')

    if (lastTaskSchedule == null) throw new Error('no TaskSchedule to move?')
    if (lastTaskSchedule.value.order == null) throw new Error('while moving, TaskSchedule is missing order')

    const lastOrder = lastTaskSchedule.value.order

    const taskSchedule = await store.index('by-typeAndOrder').get([type, oldOrder])
    if (taskSchedule == null) throw new Error('could not find TaskSchedule to move')

    if (oldOrder !== lastOrder) {
      taskSchedule.order = lastOrder + 1
      await store.put(taskSchedule)
    }

    let direction: IDBCursorDirection
    let orderChange: number
    let otherTaskSchedulesRange
    if (oldOrder < newOrder) {
      /*
        goal 1 to 3      temp        decrement       done   
          /----v       /-------v  old!open to new!open      
        a b c d e    a   c d e b    a c d   e b    a c d b e
        0 1 2 3 4    0   2 3 4 5    0 1 2   4 5    0 1 2 3 4
        n m d d n    n   d d n m    n d d   n m    n d d m n
      */
      direction = 'next'
      orderChange = -1
      otherTaskSchedulesRange = IDBKeyRange.bound(
        [type, oldOrder],
        [type, newOrder],
      )
    } else {
      /*
        goal 3 to 1      temp        increment       done   
         v----\            /---v  new!open to old!open      
        a b c d e    a b c   e d    a   b c e d    a d b c e
        0 1 2 3 4    0 1 2   4 5    0   2 3 4 5    0 1 2 3 4
        n i i m n    n i i   n m    n   i i n m    n m i i n
      */

      /*
        goal 4 to 1              increment       done   
         v------\          new!open to old!open         
        a b c d e               a   b c d b    a e b c d
        0 1 2 3 4               0   2 3 4 5    0 1 2 3 4
        n i i i m               n   i i i mi*  n m i i i
        * moved task incidentally incremented
      */
      direction = 'prev'
      orderChange = 1
      otherTaskSchedulesRange = IDBKeyRange.bound(
        [type, newOrder],
        [type, oldOrder],
      )
    }

    const taskSchedulesToUpdate = []
    let taskScheduleToUpdateCursor = await store.index('by-typeAndOrder').openCursor(otherTaskSchedulesRange, direction)
    while (taskScheduleToUpdateCursor != null) {
      taskSchedulesToUpdate.push(taskScheduleToUpdateCursor.value)
      taskScheduleToUpdateCursor = await taskScheduleToUpdateCursor.continue()
    }

    for (let i = 0; i < taskSchedulesToUpdate.length; i++) {
      const taskScheduleToUpdate = taskSchedulesToUpdate[i]
      if (taskScheduleToUpdate.order == null) throw new Error('taskSchedule missing order')
      taskScheduleToUpdate.order += orderChange
      await store.put(taskScheduleToUpdate)
    }

    taskSchedule.order = newOrder
    await store.put(taskSchedule)
  }

  async updateTaskSchedule(taskSchedule: DBTaskSchedule): Promise<void> {
    await this.db.put(TaskSchedulesStoreName, taskSchedule)
  }

  async deleteTaskSchedule(id: number): Promise<void> {
    // TODO update order - maybe?
    await this.db.delete(TaskSchedulesStoreName, id)
    // TODO delete TaskScheduleStatuses
  }

  async addTaskScheduleStatus(id: number, status: TaskScheduleStatusString): Promise<void> {
    const changedAt = new Date()
    const dbTaskScheduleStatus = {
      id,
      changedAt,
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
      [id, day],
      [id, nextDay],
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
    indexes: {
      'by-type': TaskScheduleType
      'by-typeAndOrder': [TaskScheduleType, number]
    }
  },
  [TaskScheduleStatusesStoreName]: {
    key: number
    value: DBTaskScheduleStatus
    indexes: {
      'by-id': number // example: find all changes for a certain taskSchedule
      'by-changedAt': Date // example: find all taskSchedules changed today
      'by-idAndChangedAt': [number, Date] // example: find if certain taskSchedule changed today
    }
  }
}

type DBTaskSchedule = {
  id?: number
  title: string
  type: TaskScheduleType
  order?: number
}

type DBTaskScheduleStatus = {
  id: number
  changedAt: Date
  status: TaskScheduleStatusString
}
