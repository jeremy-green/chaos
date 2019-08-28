exports.actions = emit => ({
  actions: {
    notify(context, { status, currently }) {
      emit('precipitation', { status, currently });
    },
    rejected(context, event) {
      console.log('rejected', context, event);
    },
  },
});

exports.states = {
  id: 'weather',
  initial: 'boot',
  states: {
    boot: {
      on: {
        PRECIPITATION: { target: 'precipitation', actions: ['notify'] },
        NO_PRECIPITATION: { target: 'no_precipitation', actions: ['notify'] },
        REJECTED: { target: 'no_precipitation', actions: ['rejected'] },
      },
    },
    no_precipitation: {
      on: {
        PRECIPITATION: { target: 'precipitation', actions: ['notify'] },
        REJECTED: { target: 'no_precipitation', actions: ['rejected'] },
      },
    },
    precipitation: {
      on: {
        NO_PRECIPITATION: { target: 'no_precipitation', actions: ['notify'] },
        REJECTED: { target: 'precipitation', actions: ['rejected'] },
      },
    },
  },
};
