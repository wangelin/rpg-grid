import {CommandHandler} from './eventsourcing';
import {BoardAggregate} from './board';
const uuid = require('node-uuid');

class CreateBoardCommandHandler {
  constructor(log, eventStore) {
    super(log);
    this.eventStore = eventStore;
  }

  execute(command, retries = 3) {
    let clientId = command.clientId;
    let streamId = `board_${uuid.v4()}`;

    this.log('Creating board', clientId, streamKey);

    let aggregate  = this.eventStore.loadAggregate(
      streamId, new BoardAggregate(this.log));

    if (aggregate.created) {
      if (retries > 0) {
        this.log('Key conflict, retrying');
        this.execute(command, retries - 1);
      } else {
        this.log('Key conflict, giving up');
      }
    }

    this.eventStore.appendStream(streamId, [
      {
        type: 'board.created',
        data: {
          boardId: streamId,
          width: command.width,
          height: command.height
        }
      }
    ]);
  }
}

export {
  CreateBoardCommandHandler
};
