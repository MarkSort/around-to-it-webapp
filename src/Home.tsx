import React, { ReactNode } from "react"

import { TaskSchedule, TaskScheduleStatusString, TaskScheduleType } from "./lib"

export default class Home extends React.Component<HomeProps, HomeState> {
  constructor(props: HomeProps) {
    super(props)
    this.state = {
      moving: false,
    }
  }

  render(): ReactNode {
    if (this.props.taskSchedules.length === 0) {
      return <div id="no-schedules">at the bottom right, there&apos;s A Round To-It you can use to get started</div>
    }

    const dailies: ReactNode[] = []
    const onces: ReactNode[] = []

    this.props.taskSchedules.forEach((taskSchedule) => {
      if (!taskSchedule.active) return

      let task
      if (this.state.selected?.id != taskSchedule.id) {
        task = <a href="#" onClick={this.getClickHandler(taskSchedule)} key={taskSchedule.id}>{taskSchedule.title}</a>
      } else {
        let actions
        if (this.state.moving) {
          actions = (
            <div>
              <a href="#" onClick={this.handleCancelMove.bind(this)}>cancel move</a>
            </div>
          )
        } else {
          actions = (
            <div>
              <a href="#" onClick={this.handleMarkComplete.bind(this)}>mark complete</a>
              <div id="moreActions">
                <a href="#" onClick={this.handleStartMove.bind(this)}>move</a>
                <a href="#" onClick={this.handleEdit.bind(this)}>edit</a>
                <a href="#" onClick={this.handleDelete.bind(this)}>delete</a>
              </div>
            </div>
          )

        }
        task = (
          <div id="selectedContainer" key={taskSchedule.id}>
            <a id="selected" href="#" onClick={this.getClickHandler(taskSchedule)}>{taskSchedule.title}</a>
            {actions}
          </div>
        )
      }

      if (taskSchedule.type === TaskScheduleType.Daily) {
        if (this.state.moving && this.state.selected?.type === taskSchedule.type && this.state.selected?.id !== taskSchedule.id) {
          dailies.push(<div key={`move-before-${taskSchedule.id}`}>move here</div>)
        }
        dailies.push(task)
      } else {
        if (this.state.moving && this.state.selected?.type === taskSchedule.type && this.state.selected?.id !== taskSchedule.id) {
          onces.push(<div key={`move-before-${taskSchedule.id}`}>move here</div>)
        }
        onces.push(task)
      }
    })


    return (
      <div id="tasks">
        <h2>daily</h2>
        {dailies.length > 0 ? dailies : "all done for the day!"}
        <h2>once</h2>
        {onces.length > 0 ? onces : "no more one time tasks!"}
      </div>
    )
  }

  getClickHandler(schedule: TaskSchedule): (event: React.MouseEvent<HTMLAnchorElement>) => void {
    return (event: React.MouseEvent<HTMLAnchorElement>) => this.handleClick(event, schedule)
  }

  handleClick(event: React.MouseEvent<HTMLAnchorElement>, schedule: TaskSchedule): void {
    event.preventDefault()

    if (this.state.selected?.id === schedule.id) {
      this.setState({
        selected: undefined,
        moving: false,
      })
      return
    }

    this.setState({
      selected: schedule,
      moving: false,
    })
  }

  async handleMarkComplete(event: React.MouseEvent<HTMLAnchorElement>): Promise<void> {
    event.preventDefault()

    const id = this.state.selected?.id
    if (id == null) return

    this.setState({
      selected: undefined,
    })
    await this.props.addTaskScheduleStatus(id, 'completed')
  }

  handleStartMove(event: React.MouseEvent<HTMLAnchorElement>): void {
    event.preventDefault()

    this.setState({
      moving: true,
    })
  }
  handleCancelMove(event: React.MouseEvent<HTMLAnchorElement>): void {
    event.preventDefault()

    this.setState({
      moving: false,
    })
  }

 handleEdit(event: React.MouseEvent<HTMLAnchorElement>): void {
    event.preventDefault()

    if (this.state.selected == null) return

    this.props.goToEditTaskSchedule(this.state.selected)
  }

  async handleDelete(event: React.MouseEvent<HTMLAnchorElement>): Promise<void> {
    event.preventDefault()

    const id = this.state.selected?.id
    if (id == null) return

    await this.props.deleteSchedule(id)

    this.setState({
      selected: undefined,
    })
  }
}

type HomeProps = {
  taskSchedules: TaskSchedule[]
  todayDateStr: string

  goToEditTaskSchedule: (id: TaskSchedule) => void

  deleteSchedule: (id: number) => Promise<void>
  addTaskScheduleStatus(id: number, status: TaskScheduleStatusString): Promise<void>
}

type HomeState = {
  selected?: TaskSchedule
  moving: boolean

}
