import React, { ReactNode } from "react"

import { TaskScheduleType } from "./lib"

export default class NewTaskSchedule extends React.Component<NewTaskScheduleProps, NewTaskScheduleState> {
  constructor(props: NewTaskScheduleProps) {
    super(props)
    this.state = {
      title: "",
      type: TaskScheduleType.Once,
      submitting: false,
    }
  }

  render(): ReactNode {
    const error = this.state.error != null ? <div id="error">{this.state.error}</div> : null
    return (
      <div>
        <h2>Schedule a Task</h2>
        <form onSubmit={this.handleSubmit.bind(this)}>
          <div><label>title
            <input name="title" value={this.state.title} type="text"
              onChange={this.handleTitleChange.bind(this)}
              disabled={this.state.submitting} />
          </label></div>
          <div><label>type
            <select name="type" value={this.state.type} onChange={this.handleTypeChange.bind(this)}>
              <option value={TaskScheduleType.Once}>once</option>
              <option value={TaskScheduleType.Daily}>daily</option>
            </select>
          </label></div>
          {error}
          <input type="submit" value="schedule" disabled={this.state.submitting || this.state.error != null} />
        </form>
      </div>
    )
  }

  handleTitleChange(event: React.ChangeEvent<HTMLInputElement>): void {
    const title = event.target.value
    let error

    if (new Blob([title]).size > 250) {
      error = "woah! sorry, but that title is too big!"
    }

    this.setState({
      title,
      error,
    })
  }

  handleTypeChange(event: React.ChangeEvent<HTMLSelectElement>): void {
    let newValue = TaskScheduleType.Once
    switch(event.target.value) {
      case "0":
        newValue = TaskScheduleType.Daily
        break
    }
    
    this.setState({
      type: newValue,
    })
  }

  async handleSubmit(event: React.FormEvent): Promise<void> {
    event.preventDefault()
    this.setState({ submitting: true })

    const title = this.state.title.trim()
    if (title.length === 0) {
      this.setState({
        title,
        submitting: false,
        error: "how will you know what to do without a title?",
      })
      return
    }

    await this.props.addSchedule(this.state.title, this.state.type)

    this.props.goBack()
  }
}

type NewTaskScheduleProps = {
  addSchedule: (title: string, type: TaskScheduleType) => Promise<void>
  goBack: () => void
}

type NewTaskScheduleState = {
  title: string
  type: TaskScheduleType
  submitting: boolean
  error?: string
}
