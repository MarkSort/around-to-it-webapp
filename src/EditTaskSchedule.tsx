import React, { ReactNode } from "react"

export default class EditTaskSchedule extends React.Component<EditTaskScheduleProps, EditTaskScheduleState> {
  constructor(props: EditTaskScheduleProps) {
    super(props)

    this.state = {
      title: props.title,
      submitting: false,
    }
  }

  render(): ReactNode {
    const error = this.state.error != null ? <div id="error">{this.state.error}</div> : null
    return (
      <div>
        <h2>Edit Task Schedule</h2>
        <form onSubmit={this.handleSubmit.bind(this)}>
          <div><label>title
            <input name="title" value={this.state.title} type="text"
              onChange={this.handleTitleChange.bind(this)}
              disabled={this.state.submitting} />
          </label></div>
          {error}
          <input type="submit" value="edit" disabled={this.state.submitting || this.state.error != null} />
          <button onClick={this.props.goBack}>cancel</button>
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

    await this.props.updateSchedule(this.state.title)

    this.props.goBack()
  }
}

type EditTaskScheduleProps = {
  title: string
  updateSchedule: (title: string) => Promise<void>
  goBack: () => void
}

type EditTaskScheduleState = {
  title: string
  submitting: boolean
  error?: string
}
