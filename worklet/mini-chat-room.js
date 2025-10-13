const MultiWriterDispatch = require('../spec/dispatch')
const MultiWriterRoom = require('./multi-writer-room')

class MiniChatRoom extends MultiWriterRoom {
  constructor (opts = {}) {
    super({
      ...opts,
      dbNamespace: 'minichat'
    })
  }

  _addRouter () {
    super._addRouter()

    this.router.add(`@${this.dbNamespace}/add-message`, async (data, context) => {
      await context.view.db.insert(`@${this.dbNamespace}/messages`, data)
    })
    this.router.add(`@${this.dbNamespace}/del-message`, async (data, context) => {
      await context.view.db.delete(`@${this.dbNamespace}/messages`, { id: data.id })
    })
  }

  async getMessages ({ reverse = true, limit = 100 } = {}) {
    return await this.view.db.find(`@${this.dbNamespace}/messages`, { reverse, limit }).toArray()
  }

  async addMessage (id, text, info) {
    await this.base.append(
      MultiWriterDispatch.encode(`@${this.dbNamespace}/add-message`, { id, text, info })
    )
  }

  async delMessage (id) {
    await this.base.append(
      MultiWriterDispatch.encode(`@${this.dbNamespace}/del-message`, { id })
    )
  }
}

module.exports = MiniChatRoom
