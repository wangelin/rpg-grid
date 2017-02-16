import postal from 'postal'

class BoardStream {
  constructor(log, channelName) {
    this.log = log
    log('Creating channel ' + channelName);
    this.channel = postal.channel(channelName);
    this.clientSubscriptions = {}
  }

  objectAdded(clientId, obj, x, y) {
    this.channel.publish('board.object_added', {
      'addedBy': clientId,
      'object': obj,
      'x': x,
      'y': y
    })
  }

  objectGrabbed(clientId, objectId) {
    this.channel.publish('board.object_grabbed', {
      'clientId': clientId,
      'objectId': objectId
    })
  }

  objectDropped(objectId, x, y) {
    this.channel.publish('board.object_dropped', {
      'objectId': objectId,
      'x': x,
      'y': y
    })
  }

  objectRemoved(clientId, objectId) {
    this.channel.publish('board.object_removed', {
      'removedBy': clientId,
      'objectId': objectId
    });
  }

  clientAdded(client) {
    const id = client.id
    const log = this.log
    const channel = this.channel
    log('Adding client with id=' + id.toString())
    var subscriptions = []

    subscriptions.push(channel.subscribe('board.client_added', (ev, en) => {
      log(id, en)
      client.onClientAdded(ev)
    }))
    subscriptions.push(channel.subscribe('board.client_removed', (ev, en) => {
      log(id, en)
      client.onClientRemoved(ev)
    }))
    subscriptions.push(channel.subscribe('board.object_added', (ev, en) => {
      log(id, en)
      client.onObjectAdded(ev)
    }))
    subscriptions.push(channel.subscribe('board.object_grabbed', (ev, en) => {
      log(id, en)
      client.onObjectGrabbed(ev)
    }))
    subscriptions.push(channel.subscribe('board.object_dropped', (ev, en) => {
      log(id, en)
      client.onObjectDropped(ev)
    }))
    subscriptions.push(channel.subscribe('board.object_removed', (ev, en) => {
      log(id, ev, en)
      client.onObjectRemoved(ev)
    }))
    this.clientSubscriptions[id] = subscriptions
    channel.publish('board.client_added', {clientId: id})
  }

  clientRemoved(id) {
    var subscriptions = this.clientSubscriptions[id];

    if (subscriptions) {
      for (var i = 0, len = subscriptions.length; i < len; ++i) {
        subscriptions[i].unsubscribe()
      }
    }

    this.clientSubscriptions[id] = null
    this.channel.publish('board.client_removed', {clientId: id})
  }
}

export default BoardStream
