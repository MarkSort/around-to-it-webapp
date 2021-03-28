import React from "react"
import ReactDOM from "react-dom"

import AroundToIt from "./AroundToIt"
import Db from "./Db"

async function init() {
  const db = await Db.build()

  ReactDOM.render(
    <AroundToIt db={db} />,
    document.getElementById("root")
  )
}

/////////////////////////////

init()
