import React, { ReactNode } from "react"

import { TaskSchedule, TaskScheduleStatusString, TaskScheduleType } from "./lib"

export default class Home extends React.Component<HomeProps, HomeState> {
  constructor(props: HomeProps) {
    super(props)

    const state = Home.getDerivedStateFromProps(props, {
      moving: false,
      deleting: false,
      taskSchedules: [],
      taskSchedulesByType: {},
    })

    if (state == null) throw new Error('got null initial Home state')

    this.state = state
  }

  static getDerivedStateFromProps(props: HomeProps, state: HomeState): HomeState | null {
    if (props.taskSchedules === state.taskSchedules) return null

    const taskSchedulesByType: {[t: string]: TaskSchedule[]} = {
      [TaskScheduleType.Daily.toString()]: [],
      [TaskScheduleType.Once.toString()]: [],
    }

    props.taskSchedules.forEach(taskSchedule => {
      if (!taskSchedule.active) {
        return
      }
      const typeString = taskSchedule.type.toString()
      taskSchedulesByType[typeString].push(taskSchedule)
    })

    return {
      moving: state.moving,
      deleting: state.deleting,
      taskSchedules: props.taskSchedules,
      taskSchedulesByType,
    }
  }

  render(): ReactNode {
    if (this.props.taskSchedules.length === 0) {
      return (
        <div id="no-schedules">
          <h1>Around To It</h1>
          at the bottom right, there&apos;s A Round To-It you can use to get started
        </div>
      )
    }

    const taskScheduleTypes = [TaskScheduleType.Daily, TaskScheduleType.Once]
    const typeLabels = {
      [TaskScheduleType.Daily.toString()]: { heading: 'daily', empty: 'all done for the day!'},
      [TaskScheduleType.Once.toString()]: { heading: 'one-time', empty: 'no more one time tasks!'},
    }

    const reactNodes: ReactNode[] = []

    taskScheduleTypes.forEach((type) => {
      const typeString = type.toString()

      reactNodes.push(<h2 key={`h2-${typeString}`}>{typeLabels[typeString].heading} tasks</h2>)

      if (this.state.taskSchedulesByType[typeString].length === 0) {
        reactNodes.push(<div key={`empty-${typeString}`}>{typeLabels[typeString].empty}</div>)
      }

      let afterSelected = false
      let lastOrder = 0

      this.state.taskSchedulesByType[typeString].forEach((taskSchedule) => {
        if (!taskSchedule.active) return

        lastOrder = taskSchedule.order

        let moveHere
        if (this.state.moving && this.state.selected?.type === type && this.state.selected.id !== taskSchedule.id) {
          const moveOrder = taskSchedule.order
          moveHere =
            <a href="#"
                onClick={this.getMoveHandler(moveOrder)}
                key={`move-${typeString}-${moveOrder}`}
                className="move">
              move here
            </a>
        }

        let title = taskSchedule.title
        title = `${taskSchedule.id}|${taskSchedule.type} ${taskSchedule.order}|${taskSchedule.typeAndOrder}| ${title}`

        let task
        if (this.state.selected?.id != taskSchedule.id) {
          task = <a href="#" onClick={this.getClickHandler(taskSchedule)} key={taskSchedule.id}>{title}</a>
        } else {
          afterSelected = true

          let actions
          if (this.state.moving) {
            actions = (
              <div>
                <a href="#" onClick={this.handleCancelMove.bind(this)}>cancel move</a>
              </div>
            )
          } else if (this.state.deleting) {
            actions = (
              <div>
                <div>
                  when task schedules are deleted, they will not reoccur in the future.
                  <br /><br />
                  delete this task schedule?
                </div>
                <div id="delete">
                  <a href="#" onClick={this.handleDelete.bind(this)}>delete</a>
                  <a href="#" onClick={this.handleCancelDelete.bind(this)}>keep</a>
                </div>
              </div>
            )
          } else {
            actions = (
              <div>
                <a href="#" onClick={this.handleMarkComplete.bind(this)}>mark complete</a>
                <div id="moreActions">
                  <a href="#" onClick={this.handleStartMove.bind(this)}>move</a>
                  <a href="#" onClick={this.handleEdit.bind(this)}>edit</a>
                  <a href="#" onClick={this.handleStartDelete.bind(this)}>delete</a>
                </div>
              </div>
            )
          }

          task = (
            <div id="selectedContainer" key={taskSchedule.id}>
              <a id="selected" href="#" onClick={this.getClickHandler(taskSchedule)}>{title}</a>
              {actions}
            </div>
          )
        }

        if (moveHere != null && !afterSelected) {
          reactNodes.push(moveHere)
        }
        reactNodes.push(task)
        if (moveHere != null && afterSelected) {
          reactNodes.push(moveHere)
        }
      })
    })

    return (
      <div id="tasks">
        {reactNodes}
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
        deleting: false,
      })
      return
    }

    this.setState({
      selected: schedule,
      moving: false,
      deleting: false,
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

  getMoveHandler(newOrder: number): (event: React.MouseEvent<HTMLAnchorElement>) => void {
    return (event: React.MouseEvent<HTMLAnchorElement>) => this.handleMove(event, newOrder)
  }
  async handleMove(event: React.MouseEvent<HTMLAnchorElement>, newOrder: number): Promise<void> {
    event.preventDefault()

    if (!this.state.selected) throw new Error('handleMove called without this.state.selected set')

    await this.props.moveTaskSchedule(this.state.selected.type, this.state.selected.order, newOrder)

    this.setState({
      moving: false,
      selected: undefined,
    })
  }

  handleEdit(event: React.MouseEvent<HTMLAnchorElement>): void {
    event.preventDefault()

    if (this.state.selected == null) return

    this.props.goToEditTaskSchedule(this.state.selected)
  }

  handleStartDelete(event: React.MouseEvent<HTMLAnchorElement>): void {
    event.preventDefault()

    this.setState({deleting: true})
  }

  handleCancelDelete(event: React.MouseEvent<HTMLAnchorElement>): void {
    event.preventDefault()

    this.setState({
      deleting: false,
      selected: undefined,
    })
  }

  async handleDelete(event: React.MouseEvent<HTMLAnchorElement>): Promise<void> {
    event.preventDefault()

    const id = this.state.selected?.id
    if (id == null) return

    await this.props.deleteSchedule(id)

    this.setState({
      selected: undefined,
      deleting: false,
    })
  }
}

type HomeProps = {
  taskSchedules: TaskSchedule[]
  todayDateStr: string

  goToEditTaskSchedule: (id: TaskSchedule) => void

  deleteSchedule(id: number): Promise<void>
  addTaskScheduleStatus(id: number, status: TaskScheduleStatusString): Promise<void>
  moveTaskSchedule(type: TaskScheduleType, oldOrder: number, newOrder: number): Promise<void>
}

type HomeState = {
  selected?: TaskSchedule
  moving: boolean
  deleting: boolean
  taskSchedulesByType: {[s: string]: TaskSchedule[]}
  taskSchedules: TaskSchedule[]
}
