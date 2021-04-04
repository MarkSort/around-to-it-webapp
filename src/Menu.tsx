import React, { ReactNode } from "react"

export default class Menu extends React.Component<MenuProps, MenuState> {
  constructor(props: MenuProps) {
    super(props)

    this.state = {
      versionClicks: 0,
      debug: false,
    }
  }

  render(): ReactNode {
    let debug
    if (this.state.debug) {
      debug = (
        <div id="debugMenu">
          debug
        </div>
      )
    }
    return (
      <div id="menu">
          <h1>Around To It</h1>
          <a href="#" onClick={this.goToHome.bind(this)} >view current tasks</a>
          <a href="#" onClick={this.goToNewTaskSchedule.bind(this)} >new task schedule</a>
          <a href="#" onClick={this.goToAllTaskSchedules.bind(this)} >view all task schedules</a>
          <div id="version">v2.0</div>
          {debug}
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

  handleVersionClick(event: React.MouseEvent<HTMLDivElement>): void {
    if (this.state.debug) {
      event.preventDefault()
      this.setState({
        versionClicks: 0,
        debug: false,
      })
    } else if (this.state.versionClicks < 4) { 
      this.setState({
        versionClicks: this.state.versionClicks + 1,
        debug: false,
      })
    } else {
      event.preventDefault()
      this.setState({
        versionClicks: 0,
        debug: true,
      })
    }
  }

}

type MenuProps = {
  goToHome: () => void
  goToNewTaskSchedule: () => void
  goToAllTaskSchedules: () => void
}

type MenuState = {
  versionClicks: number
  debug: boolean
}
