const { assign } = require('xstate');

exports.stateMap = {
  ON: true,
  OFF: false,
};

exports.machine = {
  key: 'binary-switch',
  initial: 'down',
  states: {
    up: {
      on: {
        OFF: 'offLoading',
      },
    },
    down: {
      on: {
        ON: 'onLoading',
      },
    },
  },
};

exports.getLoadingState = (successTarget, failureTarget, src) => {
  const id = `loading-${successTarget}`;
  return {
    invoke: {
      src,
      id,
      onDone: {
        target: successTarget,
        actions: assign({ deviceInfo: (context, event) => event.data }),
      },
      onError: {
        target: failureTarget,
      },
    },
  };
};
