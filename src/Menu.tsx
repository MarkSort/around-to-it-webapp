import React, { ReactNode } from "react"

export default class Menu extends React.Component<MenuProps, MenuState> {
  constructor(props: MenuProps) {
    super(props)

    this.state = {
    }
  }

  render(): ReactNode {
    return (
      <div id="menu">
          <h1>Around To It</h1>
          <a href="#" onClick={this.goToHome.bind(this)} >view current tasks</a>
          <a href="#" onClick={this.goToNewTaskSchedule.bind(this)} >new task schedule</a>
          <a href="#" onClick={this.goToAllTaskSchedules.bind(this)} >view all task schedules</a>
      </div>
    )
  }

  goToHome(event: React.MouseEvent<HTMLAnchorElement>): void {
    event.preventDefault()
    this.props.goToHome()
  }

  goToNewTaskSchedule(event: React.MouseEvent<HTMLAnchorElement>): void {
    event.preventDefault()
    this.props.goToNewTaskSchedule()
  }

  goToAllTaskSchedules(event: React.MouseEvent<HTMLAnchorElement>): void {
    event.preventDefault()
    this.props.goToAllTaskSchedules()
  }
}

type MenuProps = {
  goToHome: () => void
  goToNewTaskSchedule: () => void
  goToAllTaskSchedules: () => void
}

type MenuState = {
}
