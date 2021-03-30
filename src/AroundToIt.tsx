import React, { ReactNode } from "react"

import Home from "./Home"
import NewTaskSchedule from "./NewTaskSchedule"
import EditTaskSchedule from "./EditTaskSchedule"

import { TaskSchedule, TaskScheduleType, TaskScheduleStatusString } from "./lib"
import Db from "./Db"

export default class AroundToIt extends React.Component<AroundToItProps, AroundToItState> {
  constructor(props: AroundToItProps) {
    super(props)

    this.updateStateFromDb()

    this.state = {
      loading: true,

      taskSchedules: [],
      todayDateStr: '',

      screen: AtiScreen.Home,
    }
  }

  render(): ReactNode {
    let screen

    if (this.state.loading) return <div>loading...</div>

    if (this.state.screen === AtiScreen.Home) {
      screen = <Home
                  taskSchedules={this.state.taskSchedules}
                  todayDateStr={this.state.todayDateStr}

                  goToEditTaskSchedule={this.goToEditTaskSchedule.bind(this)}
                  
                  deleteSchedule={this.deleteSchedule.bind(this)}
                  addTaskScheduleStatus={this.addTaskScheduleStatus.bind(this)}
                  moveTaskSchedule={this.moveTaskSchedule.bind(this)}
                />

    } else if (this.state.screen === AtiScreen.NewTaskSchedule) {
      screen = <NewTaskSchedule
                  addSchedule={this.addSchedule.bind(this)}
                  goBack={this.goToHome.bind(this)}
                />

    } else if (this.state.screen === AtiScreen.EditTaskSchedule) {
      if (this.state.screenTaskSchedule == null) {
        console.error("invalid state - EditTaskSchedule without screenTaskSchedule")
        setTimeout(this.goToHome.bind(this), 0)
      } else {
        screen = <EditTaskSchedule
                    title={this.state.screenTaskSchedule.title}
                    updateSchedule={this.updateSchedule.bind(this)}
                    goBack={this.goToHome.bind(this)}
                  />
      }

    } else {
      console.error("invalid state - unknown AtiScreen")
      setTimeout(this.goToHome.bind(this), 0)
    }

    return (
      <div id="around-to-it">
        <h1>Around To It</h1>
        {screen}
        <a href="#" id="a-round-to-it" onClick={this.goToNewTaskSchedule.bind(this)}>
          <img src="images/a-round-to-it.png" />
        </a>
      </div>
    )
  }

  // navigation

  goToHome(): void {
    this.setState({ screen: AtiScreen.Home })
  }

  goToNewTaskSchedule(event: React.MouseEvent<HTMLAnchorElement>): void {
    event.preventDefault()
    if (event.button !== 0) {
      return
    }
    this.setState({ screen: AtiScreen.NewTaskSchedule })
  }

  goToEditTaskSchedule(taskSchedule: TaskSchedule): void {
    this.setState({
      screen: AtiScreen.EditTaskSchedule,
      screenTaskSchedule: taskSchedule,
    })
  }

  // db

  async updateStateFromDb(): Promise<void> {
    const todayDateStr = this.getDateStr()
    const dbTaskSchedules = await this.props.db.getAllTaskSchedules()
    const taskSchedules = await Promise.all(dbTaskSchedules.map(async (dbTaskSchedule) => {
      if (dbTaskSchedule.id == null) throw new Error("DBTaskSchedule missing id")
      if (dbTaskSchedule.order == null) throw new Error("DBTaskSchedule missing order")
      if (dbTaskSchedule.typeAndOrder == null) throw new Error("DBTaskSchedule missing typeAndOrder")

      let active
      if (dbTaskSchedule.type == TaskScheduleType.Once) {
        active = await this.props.db.getTaskScheduleStatus(dbTaskSchedule.id) == null
      } else if (dbTaskSchedule.type == TaskScheduleType.Daily) {
        active = await this.props.db.getTodayTaskScheduleStatus(dbTaskSchedule.id) == null
      } else {
        active = false
      }

      return {
        id: dbTaskSchedule.id,
        title: dbTaskSchedule.title,
        type: dbTaskSchedule.type,
        order: dbTaskSchedule.order,
        typeAndOrder: dbTaskSchedule.typeAndOrder,
        active, 
      }
    }))

    this.setState({
      loading: false,
      taskSchedules,
      todayDateStr,
    })
  }

  async addSchedule(title: string, type: TaskScheduleType): Promise<void> {
    if (title === "//TEST//") {
      await this.props.db.addTaskSchedule("daily0", TaskScheduleType.Daily)
      await this.props.db.addTaskSchedule("daily1", TaskScheduleType.Daily)
      await this.props.db.addTaskSchedule("daily2", TaskScheduleType.Daily)
      await this.props.db.addTaskSchedule("daily3", TaskScheduleType.Daily)
      await this.props.db.addTaskSchedule("daily4", TaskScheduleType.Daily)
      await this.props.db.addTaskSchedule("once0", TaskScheduleType.Once)
      await this.props.db.addTaskSchedule("once1", TaskScheduleType.Once)
      await this.props.db.addTaskSchedule("once2", TaskScheduleType.Once)
      await this.props.db.addTaskSchedule("once3", TaskScheduleType.Once)
      await this.props.db.addTaskSchedule("once4", TaskScheduleType.Once)
    } else {
      await this.props.db.addTaskSchedule(title, type)
    }
    await this.updateStateFromDb()
  }

  async moveTaskSchedule(type: TaskScheduleType, oldOrder: number, newOrder: number): Promise<void> {
    await this.props.db.moveTaskSchedule(type, oldOrder, newOrder)
    await this.updateStateFromDb()
  }

  async updateSchedule(title: string): Promise<void> {
    if (this.state.screenTaskSchedule == null) {
      console.error('invalid state - updateSchedule without screenTaskSchedule')
      this.goToHome()
      return
    }
    await this.props.db.updateTaskSchedule({
      id: this.state.screenTaskSchedule.id,
      title,
      type: this.state.screenTaskSchedule.type,
    })
    await this.updateStateFromDb()
  }

  async deleteSchedule(id: number): Promise<void> {
    await this.props.db.deleteTaskSchedule(id)
    await this.updateStateFromDb()
  }

  async addTaskScheduleStatus(id: number, status: TaskScheduleStatusString): Promise<void> {
    await this.props.db.addTaskScheduleStatus(id, status)
    await this.updateStateFromDb()
  }

  // misc

  getDateStr(now?: Date): string {
    now = now || new Date
  
    const year = now.getFullYear()
  
    const monthInt = now.getMonth() + 1
    const month = monthInt < 10 ? `0${monthInt}` : `${monthInt}`
  
    const dayInt = now.getDate()
    const day = dayInt < 10 ? `0${dayInt}` : `${dayInt}`
  
    return `${year}-${month}-${day}`
  }
}

type AroundToItProps = {
  db: Db
}

type AroundToItState = {
  loading: boolean
  taskSchedules: TaskSchedule[]
  todayDateStr: string

  screen: AtiScreen
  screenTaskSchedule?: TaskSchedule
}

enum AtiScreen {
  Home,
  NewTaskSchedule,
  EditTaskSchedule,
}
