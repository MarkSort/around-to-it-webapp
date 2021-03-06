import React, { ReactNode } from "react"

import Home from "./Home"
import NewTaskSchedule from "./NewTaskSchedule"
import EditTaskSchedule from "./EditTaskSchedule"

import { TaskSchedule, TaskScheduleType, TaskScheduleStatusString } from "./lib"
import Db from "./Db"
import Menu from "./Menu"
import AllTaskSchedules from "./AllTaskSchedules"

export default class AroundToIt extends React.Component<AroundToItProps, AroundToItState> {
  constructor(props: AroundToItProps) {
    super(props)

    this.updateStateFromDb()

    this.state = {
      loading: true,

      taskSchedules: [],

      todayDate: new Date(),
      todayDateStr: '',

      screen: AtiScreen.Home,
      previousScreen: AtiScreen.Home,

      menuOpen: false,
    }

    this.setMidnightUpdateTimeout()
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

    } else if (this.state.screen === AtiScreen.AllTaskSchedules) {
      screen = <AllTaskSchedules
                  taskSchedules={this.state.taskSchedules}
                  todayDateStr={this.state.todayDateStr}

                  goToEditTaskSchedule={this.goToEditTaskSchedule.bind(this)}
                  
                  deleteSchedule={this.deleteSchedule.bind(this)}
                  addTaskScheduleStatus={this.addTaskScheduleStatus.bind(this)}
                  deleteTaskScheduleStatuses={this.deleteTaskScheduleStatuses.bind(this)}
                  moveTaskSchedule={this.moveTaskSchedule.bind(this)}
                />

    } else if (this.state.screen === AtiScreen.NewTaskSchedule) {
      screen = <NewTaskSchedule
                  addSchedule={this.addSchedule.bind(this)}
                  goBack={this.goBack.bind(this)}
                />

    } else if (this.state.screen === AtiScreen.EditTaskSchedule) {
      if (this.state.screenTaskSchedule == null) {
        console.error("invalid state - EditTaskSchedule without screenTaskSchedule")
        setTimeout(this.goBack.bind(this), 0)
      } else {
        screen = <EditTaskSchedule
                    title={this.state.screenTaskSchedule.title}
                    updateSchedule={this.updateSchedule.bind(this)}
                    goBack={this.goBack.bind(this)}
                  />
      }

    } else {
      console.error("invalid state - unknown AtiScreen")
      setTimeout(this.goToHome.bind(this), 0)
    }

    let menu
    if (this.state.menuOpen) {
      menu = <Menu goToHome={this.goToHome.bind(this)}
                    goToNewTaskSchedule={this.goToNewTaskSchedule.bind(this)}
                    goToAllTaskSchedules={this.goToAllTaskSchedules.bind(this)} />
    }

    return (
      <div id="around-to-it">
        {screen}
        {menu}
        <a href="#" id="a-round-to-it" onClick={this.toggleMenu.bind(this)}>
          <img src="images/a-round-to-it.png" />
        </a>
      </div>
    )
  }

  // navigation

  toggleMenu(event: React.MouseEvent<HTMLAnchorElement>): void {
    event.preventDefault()
    this.setState({
      menuOpen: !this.state.menuOpen
    })
  }

  goToHome(): void {
    this.setState({
      screen: AtiScreen.Home,
      menuOpen: false,
    })
  }

  goToAllTaskSchedules(): void {
    this.setState({
      screen: AtiScreen.AllTaskSchedules,
      menuOpen: false,
    })
  }

  goToNewTaskSchedule(): void {
    if (this.state.screen === AtiScreen.Home || this.state.screen === AtiScreen.AllTaskSchedules) {
      this.setState({
        screen: AtiScreen.NewTaskSchedule,
        menuOpen: false,
        previousScreen: this.state.screen,
      })
    } else {
      this.setState({
        screen: AtiScreen.NewTaskSchedule,
        menuOpen: false,
      })
    }
  }

  goToEditTaskSchedule(taskSchedule: TaskSchedule): void {
    if (this.state.screen === AtiScreen.Home || this.state.screen === AtiScreen.AllTaskSchedules) {
      this.setState({
        screen: AtiScreen.EditTaskSchedule,
        screenTaskSchedule: taskSchedule,
        menuOpen: false,
        previousScreen: this.state.screen,
      })
    } else {
      this.setState({
        screen: AtiScreen.EditTaskSchedule,
        screenTaskSchedule: taskSchedule,
        menuOpen: false,
      })
    }
  }

  goBack(): void {
    this.setState({
      screen: this.state.previousScreen,
      previousScreen: AtiScreen.Home,
    })
  }

  // db

  async updateStateFromDb(): Promise<void> {
    const todayDate = new Date()
    const todayDateStr = this.getDateStr(todayDate)
    const dbTaskSchedules = await this.props.db.getAllTaskSchedules()
    const taskSchedules = await Promise.all(dbTaskSchedules.map(async (dbTaskSchedule) => {
      if (dbTaskSchedule.id == null) throw new Error("DBTaskSchedule missing id")
      if (dbTaskSchedule.order == null) throw new Error("DBTaskSchedule missing order")

      let active
      if (dbTaskSchedule.type == TaskScheduleType.Once) {
        active = await this.props.db.getTaskScheduleStatus(dbTaskSchedule.id) == null
      } else if (dbTaskSchedule.type == TaskScheduleType.Daily) {
        active = await this.props.db.getTodayTaskScheduleStatus(dbTaskSchedule.id, todayDate) == null
      } else {
        active = false
      }

      return {
        id: dbTaskSchedule.id,
        title: dbTaskSchedule.title,
        type: dbTaskSchedule.type,
        order: dbTaskSchedule.order,
        active, 
      }
    }))

    this.setState({
      loading: false,
      taskSchedules,
      todayDate,
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
      order: this.state.screenTaskSchedule.order,
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

  async deleteTaskScheduleStatuses(taskSchedule: TaskSchedule): Promise<void> {
    if (taskSchedule.type == TaskScheduleType.Once) {
      await this.props.db.deleteAllTaskScheduleStatuses(taskSchedule.id)
    } else if (taskSchedule.type == TaskScheduleType.Daily) {
      await this.props.db.deleteTodayTaskScheduleStatuses(this.state.todayDate, taskSchedule.id)
    }
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

  setMidnightUpdateTimeout(): void {

    const midnight = new Date()
    midnight.setDate(midnight.getDate() + 1)
    midnight.setHours(0)
    midnight.setMinutes(0)
    midnight.setSeconds(0)
    midnight.setMilliseconds(0)

    const now = new Date()

    const msUntilMidnight = midnight.valueOf() - now.valueOf()

    console.log(`setting midnight update timeout for ${midnight} in ${msUntilMidnight} ms`)

    setTimeout(this.updateDateStr.bind(this), msUntilMidnight)
  }

  async updateDateStr(): Promise<void> {
    const now = new Date()
    console.log(`midnight update fired at ${now.toString()}`)

    await this.updateStateFromDb()

    this.setMidnightUpdateTimeout()
  }
}

type AroundToItProps = {
  db: Db
}

type AroundToItState = {
  loading: boolean
  taskSchedules: TaskSchedule[]

  todayDate: Date
  todayDateStr: string

  screen: AtiScreen
  screenTaskSchedule?: TaskSchedule
  previousScreen: AtiScreen

  menuOpen: boolean
}

enum AtiScreen {
  Home,
  AllTaskSchedules,
  NewTaskSchedule,
  EditTaskSchedule,
}
